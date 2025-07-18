import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    // Step 1: Get relevant context from vector search
    const { data } = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message
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
          content: message
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
    console.error('RAG API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}