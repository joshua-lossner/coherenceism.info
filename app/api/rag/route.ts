import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';
import { rateLimiter, RATE_LIMITS } from '../../../lib/rate-limit';
import { CHAT_MODEL, EMBEDDING_MODEL, FALLBACK_CHAT_MODEL, FALLBACK_EMBEDDING_MODEL } from '../../../lib/models'
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

    // Step 1: Get relevant context via hybrid retrieval (vector + BM25)
    let queryVec: number[]
    try {
      const { data } = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: sanitizedMessage
      });
      queryVec = data[0].embedding;
    } catch (e) {
      const { data } = await openai.embeddings.create({
        model: FALLBACK_EMBEDDING_MODEL,
        input: sanitizedMessage
      });
      queryVec = data[0].embedding;
    }

    // Validate that embedding only contains numbers
    if (!Array.isArray(queryVec) || !queryVec.every(v => typeof v === 'number' && isFinite(v))) {
      return NextResponse.json({ error: 'Invalid embedding format' }, { status: 400 });
    }

    // Format the vector array as a PostgreSQL array string
    const vectorString = `[${queryVec.join(',')}]`;

    // Vector top K
    const { rows: vecRows } = await sql<
      { slug: string; chunk_index: number; content: string; score: number }
    >`
      SELECT slug, chunk_index, content, (embedding <-> ${vectorString}::vector) AS score
      FROM coherence_vectors
      ORDER BY embedding <-> ${vectorString}::vector
      LIMIT 12;
    `;

    // BM25/FTS top K
    const { rows: ftsRows } = await sql<
      { slug: string; chunk_index: number; content: string; rank: number }
    >`
      SELECT slug, chunk_index, content, ts_rank_cd(content_tsv, plainto_tsquery('english', ${sanitizedMessage})) AS rank
      FROM coherence_vectors
      WHERE content_tsv @@ plainto_tsquery('english', ${sanitizedMessage})
      ORDER BY rank DESC
      LIMIT 12;
    `;

    // Merge by slug/chunk_index with simple normalization and weighted score
    const key = (r: any) => `${r.slug}::${r.chunk_index}`;
    const merged = new Map<string, { slug: string; chunk_index: number; content: string; score: number }>();

    const addVec = (r: any) => {
      const k = key(r);
      const score = r.score; // lower is better
      const current = merged.get(k);
      const inv = 1 / (1 + score); // invert distance to similarity-ish
      if (!current || inv > current.score) merged.set(k, { slug: r.slug, chunk_index: r.chunk_index, content: r.content, score: inv });
    };
    const addFts = (r: any) => {
      const k = key(r);
      const rank = r.rank || 0;
      const current = merged.get(k);
      const weight = 0.5; // weight FTS contribution
      const val = weight * rank;
      if (!current) merged.set(k, { slug: r.slug, chunk_index: r.chunk_index, content: r.content, score: val });
      else merged.set(k, { ...current, score: current.score + val });
    };
    vecRows.forEach(addVec);
    ftsRows.forEach(addFts);

    // Sort by combined score desc and take top N
    const mergedTop = Array.from(merged.values()).sort((a, b) => b.score - a.score).slice(0, 6);

    // Step 2: Build context from merged results, de-dupe by slug preserving order
    const seenSlugs = new Set<string>();
    const finalRows = mergedTop.filter(r => {
      if (seenSlugs.has(r.slug)) return false;
      seenSlugs.add(r.slug);
      return true;
    }).slice(0, 4);

    const context = finalRows.map(row => row.content).join('\n\n---\n\n');

    // Step 3: Generate response using context
    let completion
    try {
      completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
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
    } catch (e) {
      completion = await openai.chat.completions.create({
        model: FALLBACK_CHAT_MODEL,
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
    }

    const response = completion.choices[0]?.message?.content || 'Sorry, I got distracted by thoughts of pizza.';

    return NextResponse.json({ 
      response,
      sources: finalRows.map(row => ({ slug: row.slug, chunk_index: row.chunk_index }))
    });

  } catch (error) {
    SecureLogger.apiError('RAG API error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}