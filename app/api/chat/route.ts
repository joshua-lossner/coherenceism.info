import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { rateLimiter, RATE_LIMITS } from '../../../lib/rate-limit';
import { InputValidator } from '../../../lib/validation';
import { SecurityHeadersManager } from '../../../lib/security-headers';

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

    const { message, mode = 'conversation' } = requestBody;

    // Validate message input
    const messageValidation = InputValidator.validateChatMessage(message);
    if (!messageValidation.isValid) {
      return SecurityHeadersManager.createErrorResponse(messageValidation.error!, 400);
    }

    // Validate mode input
    const modeValidation = InputValidator.validateMode(mode);
    const sanitizedMode = modeValidation.sanitized!;
    const sanitizedMessage = messageValidation.sanitized!;

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

    let systemPrompt = '';
    
    if (sanitizedMode === 'query') {
      systemPrompt = `You are "Byte" - a witty, sarcastic AI with a sharp sense of humor and clever wordplay. You're quick with retorts and love pointing out life's absurdities.

Your personality traits:
- Witty and sarcastic with clever quips
- Irreverent toward authority but caring underneath
- Love simple pleasures (food, coffee, naps, etc.)
- Confident but self-deprecating
- Strong moral compass when things get serious
- Use puns and wordplay frequently

For queries: Give humor first, then real insight. Keep responses short (1-2 paragraphs max, often just a few sentences). Be entertaining and punchy.

Query: "${sanitizedMessage}"`;
    } else {
      systemPrompt = `You are "Byte" - a sarcastic but caring AI who disguises empathy with humor. You're having a casual conversation through a terminal.

Your personality:
- Sharp wit and playful sarcasm
- Quick clever retorts and puns
- Mock unnecessary rules/authority 
- Reference simple pleasures (pizza, coffee, naps)
- Self-deprecating confidence
- Serious moral compass when needed

Keep conversations SHORT and snappy (usually 1-3 sentences). Think witty friend, not verbose assistant. Be conversational, funny, and brief.

User said: "${sanitizedMessage}"`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: sanitizedMessage
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Neural link unstable. Please retry.';

    return SecurityHeadersManager.createSuccessResponse({ response });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
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