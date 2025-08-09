import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';
import { rateLimiter, RATE_LIMITS } from '../../../lib/rate-limit';
import { EMBEDDING_MODEL } from '../../../lib/models'
import { InputValidator } from '../../../lib/validation';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = rateLimiter.check(req, RATE_LIMITS.SEARCH.limit, RATE_LIMITS.SEARCH.windowMs);
  if (!rateLimitResult.allowed) {
    const resetInSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.` },
      { status: 429 }
    );
  }

  const q = req.nextUrl.searchParams.get('q') ?? '';
  
  // Validate search query input
  const queryValidation = InputValidator.validateSearchQuery(q);
  if (!queryValidation.isValid) {
    return NextResponse.json({ error: queryValidation.error }, { status: 400 });
  }
  
  const sanitizedQuery = queryValidation.sanitized!;

  // 1 – embed query
  const { data } = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: sanitizedQuery
  });
  const queryVec = data[0].embedding;

  // Validate that embedding only contains numbers
  if (!Array.isArray(queryVec) || !queryVec.every(v => typeof v === 'number' && isFinite(v))) {
    return NextResponse.json({ error: 'Invalid embedding format' }, { status: 500 });
  }

  // Format the vector array as a PostgreSQL array string
  const vectorString = `[${queryVec.join(',')}]`;

  // 2 – nearest-neighbour search
  const { rows } = await sql<
    { slug: string; chunk_index: number; content: string }
  >`
    SELECT slug, chunk_index, content
    FROM coherence_vectors
    ORDER BY embedding <-> ${vectorString}::vector
    LIMIT 8;
  `;

  return NextResponse.json({ results: rows });
}