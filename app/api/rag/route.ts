import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';
import { rateLimiter, RATE_LIMITS } from '../../../lib/rate-limit';
import { InputValidator } from '../../../lib/validation';
import SecureLogger from '../../../lib/secure-logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimiter.check(req, RATE_LIMITS.RAG.limit, RATE_LIMITS.RAG.windowMs);
    if (!rateLimitResult.allowed) {
      const resetInSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    const { message } = await req.json();
    
    // Validate message input
    const messageValidation = InputValidator.validateRAGQuery(message);
    if (!messageValidation.isValid) {
      return NextResponse.json({ error: messageValidation.error }, { status: 400 });
    }
    
    const sanitizedMessage = messageValidation.sanitized!;

    // Step 1: Get relevant context from vector search
    const { data } = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: sanitizedMessage
    });
    const queryVec = data[0].embedding;

    // Validate that embedding only contains numbers
    if (!Array.isArray(queryVec) || !queryVec.every(v => typeof v === 'number' && isFinite(v))) {
      return NextResponse.json({ error: 'Invalid embedding format' }, { status: 400 });
    }

    // Format the vector array as a PostgreSQL array string
    const vectorString = `[${queryVec.join(',')}]`;

    const { rows } = await sql<
      { slug: string; chunk_index: number; content: string }
    >`
      SELECT slug, chunk_index, content
      FROM coherence_vectors
      ORDER BY embedding <-> ${vectorString}::vector
      LIMIT 4;
    `;

    // Step 2: Build context from search results
    const context = rows.map(row => row.content).join('\n\n---\n\n');

    // Step 3: Generate response using context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are Byte, a sarcastic but caring AI assistant representing Coherenceism. You have access to relevant passages from Coherenceism texts to answer questions. Keep your responses conversational, witty, and grounded in the provided context. Reference the context naturally but don't just quote it verbatim.

Coherenceism Context:
${context}`
        },
        {
          role: 'user',
          content: sanitizedMessage
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I got distracted by thoughts of pizza.';

    return NextResponse.json({ 
      response,
      sources: rows.map(row => ({
        slug: row.slug,
        chunk_index: row.chunk_index
      }))
    });

  } catch (error) {
    SecureLogger.apiError('RAG API error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}