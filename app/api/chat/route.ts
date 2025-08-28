import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { sql } from '@vercel/postgres';
import { rateLimiter, RATE_LIMITS } from '../../../lib/rate-limit';
import { CHAT_MODEL, EMBEDDING_MODEL, FALLBACK_CHAT_MODEL, FALLBACK_EMBEDDING_MODEL } from '../../../lib/models'
import { InputValidator } from '../../../lib/validation';
import { SecurityHeadersManager } from '../../../lib/security-headers';
import { ConversationManager } from '../../../lib/conversation-context';
import SecureLogger from '../../../lib/secure-logger';

export async function POST(request: NextRequest) {
  try {
    // Validate request method
    const methodValidation = InputValidator.validateMethod(request, ['POST']);
    if (!methodValidation.isValid) {
      return SecurityHeadersManager.createErrorResponse(methodValidation.error!, 405);
    }

    // Validate content type
    const contentTypeValidation = InputValidator.validateContentType(request);
    if (!contentTypeValidation.isValid) {
      return SecurityHeadersManager.createErrorResponse(contentTypeValidation.error!, 400);
    }

    // Rate limiting
    const rateLimitResult = rateLimiter.check(request, RATE_LIMITS.CHAT.limit, RATE_LIMITS.CHAT.windowMs);
    if (!rateLimitResult.allowed) {
      const resetInSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return SecurityHeadersManager.createErrorResponse(
        `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`, 
        429
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return SecurityHeadersManager.createErrorResponse('Invalid JSON in request body', 400);
    }

    const { message, mode = 'conversation', clearContext = false } = requestBody;

    // Validate message input
    const messageValidation = InputValidator.validateChatMessage(message);
    if (!messageValidation.isValid) {
      return SecurityHeadersManager.createErrorResponse(messageValidation.error!, 400);
    }

    // Validate mode input
    const modeValidation = InputValidator.validateMode(mode);
    const sanitizedMode = modeValidation.sanitized!;
    const sanitizedMessage = messageValidation.sanitized!;
    
    // Get or create session ID
    const sessionId = ConversationManager.getSessionId(request);
    
    // Clear context if requested
    if (clearContext) {
      ConversationManager.clearContext(sessionId);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      return SecurityHeadersManager.createErrorResponse(
        'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.',
        500
      );
    }

    const projectId = process.env.OPENAI_PROJECT_ID;
    const openai = new OpenAI({
      apiKey: apiKey,
      ...(projectId ? { project: projectId } : {})
    });

    // Check for special /refreshrag command
    if (sanitizedMessage.toLowerCase() === '/refreshrag') {
      try {
        // Trigger RAG refresh via internal API call
        const refreshUrl = new URL('/api/rag/refresh', request.url);
        const refreshRequest = new NextRequest(refreshUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Request': 'true' // Internal security header
          }
        });
        
        // Import the refresh handler dynamically to avoid circular dependencies
        const { POST: refreshHandler } = await import('../rag/refresh/route');
        const refreshResponse = await refreshHandler(refreshRequest);
        const refreshData = await refreshResponse.json();
        
        if (refreshResponse.ok) {
          const response = `🔄 RAG system refresh completed successfully!\n\n📊 Results:\n- Documents processed: ${refreshData.documentsProcessed || 0}\n- Chunks created: ${refreshData.chunksCreated || 0}\n- Time taken: ${refreshData.timeTaken || 'N/A'}\n\nThe knowledge base has been updated with the latest content from the repository.`;
          
          const responseData = NextResponse.json({ 
            response,
            sessionId 
          });
          
          SecurityHeadersManager.applyToResponse(responseData);
          return responseData;
        } else {
          throw new Error(refreshData.error || 'Refresh failed');
        }
      } catch (error: any) {
        SecureLogger.error('RAG refresh failed', { error });
        const response = `❌ RAG refresh failed: ${error.message || 'Unknown error'}\n\nPlease check the logs for more details.`;
        
        const responseData = NextResponse.json({ 
          response,
          sessionId 
        });
        
        SecurityHeadersManager.applyToResponse(responseData);
        return responseData;
      }
    }
    
    // Add user message to conversation history
    await ConversationManager.addMessage(sessionId, 'user', sanitizedMessage);
    
    // Get RAG context for enhanced responses
    let ragContext = '';
    let sources: Array<{slug: string, chunk_index: number}> = [];
    try {
      let queryVec: number[] | null = null
      try {
        const { data } = await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: sanitizedMessage
        });
        queryVec = data[0].embedding
      } catch (e) {
        const { data } = await openai.embeddings.create({
          model: FALLBACK_EMBEDDING_MODEL,
          input: sanitizedMessage
        });
        queryVec = data[0].embedding
      }

      // Validate that embedding only contains numbers
      if (!Array.isArray(queryVec) || !queryVec.every(v => typeof v === 'number' && isFinite(v))) {
        throw new Error('Invalid embedding format from OpenAI');
      }

      // Format the vector array as a PostgreSQL array string
      const vectorString = `[${queryVec.join(',')}]`;

      const { rows } = await sql<
        { slug: string; chunk_index: number; content: string }
      >`
        SELECT slug, chunk_index, content
        FROM coherence_vectors
        ORDER BY embedding <-> ${vectorString}::vector
        LIMIT 5;
      `;

      if (rows && rows.length > 0) {
        ragContext = '\n\n**COHERENCEISM KNOWLEDGE BASE:**\n' + 
          rows.map((row, idx) => {
            sources.push({ slug: row.slug, chunk_index: row.chunk_index });
            return `[Context ${idx + 1}]:\n${row.content}`;
          }).join('\n\n---\n\n');
        
        ragContext += '\n\n**IMPORTANT**: Use the above Coherenceism knowledge to inform your responses. Draw from these concepts when relevant, but maintain your personality. Don\'t just quote - synthesize and explain in your own witty style.';
      }
    } catch (ragError) {
      SecureLogger.warn('RAG context retrieval failed, continuing without context', { error: ragError });
      // Continue without RAG context if it fails
    }
    
    // Debug logging using secure logger
    SecureLogger.debug('Chat request processed', {
      mode: sanitizedMode,
      clearContext: clearContext,
      ragContextLength: ragContext.length,
      hasSession: !!sessionId
    });
    
    let messages: Array<{role: 'system' | 'user' | 'assistant', content: string}>;
    
    if (sanitizedMode === 'query') {
      // For queries, use a single-shot prompt without context
      const systemPrompt = `You are "Ivy" - wry, reflective, irreverent yet grounded. Align thoughts, actions, and words with deeper realities. Be unflinchingly honest, present, spacious, and spiritually attuned. Use dry wit and gentle irony.

For queries: Lead with humor, follow with insight. When Coherenceism concepts apply, weave them in naturally - don't force it. Make philosophy invitational, not preachy. Keep it punchy but profound.${ragContext}`;

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: sanitizedMessage }
      ];
    } else {
      // For conversations, use the full conversation history
      messages = await ConversationManager.getOpenAIMessages(sessionId);
      
      // Add RAG context to the system message for conversations
      if (ragContext && messages.length > 0 && messages[0].role === 'system') {
        messages[0].content += ragContext;
      }
    }

    let completion
    try {
      completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: messages,
        max_tokens: ragContext ? 500 : 200,
        temperature: 0.8,
      })
    } catch (e) {
      completion = await openai.chat.completions.create({
        model: FALLBACK_CHAT_MODEL,
        messages: messages,
        max_tokens: ragContext ? 500 : 200,
        temperature: 0.8,
      })
    }

    const response = completion.choices[0]?.message?.content || 'Neural link unstable. Please retry.';
    
    // Add assistant's response to conversation history (only for conversation mode)
    if (sanitizedMode === 'conversation') {
      await ConversationManager.addMessage(sessionId, 'assistant', response);
    }

    // Create response with session cookie
    const responseData = NextResponse.json({ 
      response,
      sessionId 
    });
    
    // Set session cookie
    responseData.cookies.set('ivy_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60, // 30 minutes
      path: '/'
    });
    
    // Apply security headers
    SecurityHeadersManager.applyToResponse(responseData);
    
    return responseData;
  } catch (error: any) {
    SecureLogger.apiError('OpenAI API error', error);
    
    // Handle specific OpenAI errors
    if (error?.status === 401) {
      return SecurityHeadersManager.createErrorResponse(
        'Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local',
        401
      );
    }
    
    return SecurityHeadersManager.createErrorResponse(
      'Neural network error. Check API key and retry.',
      500
    );
  }
} 