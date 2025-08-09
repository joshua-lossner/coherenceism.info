import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import OpenAI from 'openai';
import { EMBEDDING_MODEL } from '../../../../lib/models'
import SecureLogger from '../../../../lib/secure-logger';
import { SecurityHeadersManager } from '../../../../lib/security-headers';

interface ContentFile {
  name: string;
  download_url: string;
  type: string;
  path: string;
}

interface ProcessedDocument {
  slug: string;
  chunks: Array<{
    content: string;
    embedding: number[];
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow internal requests or admin access
    const isInternalRequest = request.headers.get('X-Internal-Request') === 'true';
    if (!isInternalRequest) {
      return SecurityHeadersManager.createErrorResponse('Unauthorized', 401);
    }

    const startTime = Date.now();
    SecureLogger.info('Starting RAG refresh process');

    // Initialize OpenAI client
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return SecurityHeadersManager.createErrorResponse('OpenAI API key not configured', 500);
    }

    const openai = new OpenAI({ apiKey });

    // Fetch content from GitHub repository
    const documents = await fetchAllContent();
    SecureLogger.info(`Fetched ${documents.length} documents from repository`);

    // Process documents: chunk and generate embeddings
    let totalChunks = 0;
    const processedDocs: ProcessedDocument[] = [];
    let embeddingDim = 1536;

    for (const doc of documents) {
      try {
        const chunks = chunkDocument(doc.content, doc.slug);
        const embeddings = await generateEmbeddings(openai, chunks);
        if (embeddings.length > 0) {
          embeddingDim = embeddings[0].length;
        }
        
        processedDocs.push({
          slug: doc.slug,
          chunks: chunks.map((content, index) => ({
            content,
            embedding: embeddings[index]
          }))
        });

        totalChunks += chunks.length;
        SecureLogger.debug(`Processed ${doc.slug}: ${chunks.length} chunks`);
      } catch (error) {
        SecureLogger.error(`Error processing document ${doc.slug}`, { error });
      }
    }

    // Clear existing vectors, migrate dimension and insert new ones
    await updateDatabase(processedDocs, embeddingDim);

    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2) + 's';
    SecureLogger.info('RAG refresh completed', {
      documentsProcessed: documents.length,
      chunksCreated: totalChunks,
      timeTaken
    });

    return NextResponse.json({
      success: true,
      documentsProcessed: documents.length,
      chunksCreated: totalChunks,
      timeTaken
    });

  } catch (error: any) {
    SecureLogger.error('RAG refresh failed', { error });
    return SecurityHeadersManager.createErrorResponse(
      `RAG refresh failed: ${error.message}`,
      500
    );
  }
}

async function fetchAllContent(): Promise<Array<{ slug: string; content: string }>> {
  const documents: Array<{ slug: string; content: string }> = [];
  
  try {
    // Fetch journal entries
    const journalResponse = await fetch('https://api.github.com/repos/joshua-lossner/coherenceism.content/contents/content/journal');
    const journalFiles = await journalResponse.json();

    if (Array.isArray(journalFiles)) {
      const journalPromises = journalFiles
        .filter((file: ContentFile) => file.name.endsWith('.md') && file.name !== 'AGENTS.md')
        .map(async (file: ContentFile) => {
          try {
            const response = await fetch(file.download_url);
            const content = await response.text();
            return {
              slug: `journal/${file.name.replace('.md', '')}`,
              content: stripFrontmatter(content)
            };
          } catch (error) {
            SecureLogger.error(`Failed to fetch journal ${file.name}`, { error });
            return null;
          }
        });

      const journalDocs = await Promise.all(journalPromises);
      documents.push(...journalDocs.filter(doc => doc !== null));
    }

    // Fetch books and their chapters
    const booksResponse = await fetch('https://api.github.com/repos/joshua-lossner/coherenceism.content/contents/content/books');
    const bookDirs = await booksResponse.json();

    if (Array.isArray(bookDirs)) {
      for (const bookDir of bookDirs.filter((f: ContentFile) => f.type === 'dir')) {
        const chaptersResponse = await fetch(`https://api.github.com/repos/joshua-lossner/coherenceism.content/contents/content/books/${bookDir.name}`);
        const chapterFiles = await chaptersResponse.json();

        if (Array.isArray(chapterFiles)) {
          const chapterPromises = chapterFiles
            .filter((file: ContentFile) => file.name.endsWith('.md'))
            .map(async (file: ContentFile) => {
              try {
                const response = await fetch(file.download_url);
                const content = await response.text();
                return {
                  slug: `books/${bookDir.name}/${file.name.replace('.md', '')}`,
                  content: stripFrontmatter(content)
                };
              } catch (error) {
                SecureLogger.error(`Failed to fetch chapter ${bookDir.name}/${file.name}`, { error });
                return null;
              }
            });

          const chapterDocs = await Promise.all(chapterPromises);
          documents.push(...chapterDocs.filter(doc => doc !== null));
        }
      }
    }

    // Fetch docs/codex entries
    try {
      const docsResponse = await fetch('https://api.github.com/repos/joshua-lossner/coherenceism.content/contents/content/docs');
      const docsDirs = await docsResponse.json();
      
      if (Array.isArray(docsDirs)) {
        // Check for codex directory
        const codexDir = docsDirs.find((f: ContentFile) => f.name === 'codex' && f.type === 'dir');
        if (codexDir) {
          const codexResponse = await fetch('https://api.github.com/repos/joshua-lossner/coherenceism.content/contents/content/docs/codex');
          const codexFiles = await codexResponse.json();
          
          if (Array.isArray(codexFiles)) {
            const codexPromises = codexFiles
              .filter((file: ContentFile) => file.name.endsWith('.md'))
              .map(async (file: ContentFile) => {
                try {
                  const response = await fetch(file.download_url);
                  const content = await response.text();
                  return {
                    slug: `docs/codex/${file.name.replace('.md', '')}`,
                    content: stripFrontmatter(content)
                  };
                } catch (error) {
                  SecureLogger.error(`Failed to fetch codex doc ${file.name}`, { error });
                  return null;
                }
              });
              
            const codexDocs = await Promise.all(codexPromises);
            documents.push(...codexDocs.filter(doc => doc !== null));
          }
        }
      }
    } catch (error) {
      SecureLogger.error('Failed to fetch docs/codex content', { error });
    }
    
    // Note: essays and podcast directories are currently empty but can be added here when content is added
    
  } catch (error) {
    SecureLogger.error('Failed to fetch content from GitHub', { error });
    throw error;
  }

  return documents;
}

function stripFrontmatter(content: string): string {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)/);
  return frontmatterMatch ? frontmatterMatch[2].trim() : content.trim();
}

function chunkDocument(content: string, slug: string): string[] {
  const chunks: string[] = [];
  const maxChunkSize = 2000; // Increased for better context
  const overlap = 300; // More overlap for coherence

  // Split by paragraphs first
  const paragraphs = content.split(/\n\n+/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        // Start new chunk with overlap from previous
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-50).join(' '); // Last ~50 words for better context
        currentChunk = overlapWords + '\n\n' + paragraph;
      } else {
        // Single paragraph is too long, split it
        const words = paragraph.split(' ');
        for (let i = 0; i < words.length; i += 200) {
          chunks.push(words.slice(i, i + 200).join(' '));
        }
        currentChunk = '';
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  // Add metadata to each chunk with enhanced context
  return chunks.map((chunk, index) => {
    const sourceType = slug.startsWith('journal/') ? 'Journal Entry' :
                      slug.startsWith('books/') ? 'Book Chapter' :
                      slug.startsWith('docs/codex/') ? 'Technical Documentation' : 'Document';
    
    return `[${sourceType}: ${slug}, Part ${index + 1}/${chunks.length}]\n\n${chunk}`;
  });
}

async function generateEmbeddings(openai: OpenAI, chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  const batchSize = 20; // Process 20 chunks at a time to avoid rate limits

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch
      });

      embeddings.push(...response.data.map(item => item.embedding));
    } catch (error) {
      SecureLogger.error('Failed to generate embeddings', { error, batchIndex: i });
      // Fill with zero vectors on failure
      for (let j = 0; j < batch.length; j++) {
        embeddings.push(new Array(1536).fill(0));
      }
    }

    // Small delay to avoid rate limiting
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return embeddings;
}

async function updateDatabase(documents: ProcessedDocument[], embeddingDim: number): Promise<void> {
  try {
    // Start a transaction
    await sql`BEGIN`;

    // Clear existing vectors
    await sql`DELETE FROM coherence_vectors`;

    // NOTE: Do not alter column type here.
    // Some environments use halfvec(3072) instead of vector(3072).
    // We avoid ALTER TYPE to maintain compatibility with existing column type.

    // Ensure full-text search column exists
    await sql`ALTER TABLE coherence_vectors ADD COLUMN IF NOT EXISTS content_tsv tsvector`;

    // Ensure indexes exist for vector and FTS
    // Use HNSW for high-dimensional vectors (>2000), fallback to IVFFLAT otherwise
    try {
      if (embeddingDim > 2000) {
        // Prefer HNSW for high-dimensional vectors (halfvec cosine ops)
        await sql`DROP INDEX IF EXISTS coherence_vectors_embedding_idx`;
        await sql`CREATE INDEX IF NOT EXISTS coherence_vectors_embedding_idx ON coherence_vectors USING hnsw (embedding halfvec_cosine_ops) WITH (m = 16, ef_construction = 64)`;
      } else {
        // IVFFLAT for lower dimensions (halfvec cosine ops)
        await sql`CREATE INDEX IF NOT EXISTS coherence_vectors_embedding_idx ON coherence_vectors USING ivfflat (embedding halfvec_cosine_ops)`;
      }
    } catch (e) {
      // If HNSW is not available and dimensions > 2000, skip vector index entirely to avoid ivfflat 2000-d cap
      if (embeddingDim > 2000) {
        await sql`DROP INDEX IF EXISTS coherence_vectors_embedding_idx`;
        SecureLogger.warn('HNSW not supported; proceeding without vector index due to >2000 dimensions. Queries will use sequential scan.');
      } else {
        // For <=2000 dims, attempt ivfflat with halfvec ops as a safe fallback
        await sql`CREATE INDEX IF NOT EXISTS coherence_vectors_embedding_idx ON coherence_vectors USING ivfflat (embedding halfvec_cosine_ops)`;
      }
    }
    await sql`CREATE INDEX IF NOT EXISTS coherence_vectors_content_tsv_idx ON coherence_vectors USING GIN (content_tsv)`;

    // Insert new vectors
    for (const doc of documents) {
      for (let i = 0; i < doc.chunks.length; i++) {
        const chunk = doc.chunks[i];
        const vectorString = `[${chunk.embedding.join(',')}]`;
        
        await sql`
          INSERT INTO coherence_vectors (slug, chunk_index, content, embedding)
          VALUES (${doc.slug}, ${i}, ${chunk.content}, ${vectorString}::halfvec)
        `;
      }
    }

    // Populate FTS column
    await sql`UPDATE coherence_vectors SET content_tsv = to_tsvector('english', content)`;

    // Commit transaction
    await sql`COMMIT`;
    SecureLogger.info('Database updated successfully');
  } catch (error) {
    // Rollback on error
    await sql`ROLLBACK`;
    throw error;
  }
}