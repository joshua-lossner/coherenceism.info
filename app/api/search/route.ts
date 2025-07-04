import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) {
    return NextResponse.json({ error: 'Missing ?q=' }, { status: 400 });
  }

  // 1 – embed query
  const { data } = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: q
  });
  const queryVec = data[0].embedding;

  // 2 – nearest-neighbour search
  const { rows } = await sql<
    { slug: string; chunk_index: number; content: string }[]
  >`
    SELECT slug, chunk_index, content
    FROM coherence_vectors
    ORDER BY embedding <-> ${`[${queryVec.join(',')}]`}::vector
    LIMIT 8;
  `;

  return NextResponse.json({ results: rows });
}