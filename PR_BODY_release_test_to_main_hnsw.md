### Release: GPT-5 upgrade, published-only content, and 3072‑D RAG

This release improves AI quality, content control, and retrieval performance.

#### Highlights
- **GPT‑5 upgrade**: Byte now runs with GPT‑5 defaults and a hybrid RAG (vector + FTS) flow
- **Published‑only content**: Journals/chapters are visible only when front matter has `published: true`
- **3072‑D RAG with HNSW**: Support for `text-embedding-3-large` via HNSW index (with safe fallbacks)

#### Details
- RAG: HNSW index for high‑dim embeddings; falls back to IVFFLAT or sequential scan if HNSW unsupported
- Content: Front matter filter accepts `true`, `yes`, `on`, `1`
- UX: Previous terminal fixes retained (numeric ‘4’ navigation, instant screen switches)

#### Technical notes
- Files: `app/api/rag/refresh/route.ts`, `app/api/chat/route.ts`, `app/api/rag/route.ts`, `app/api/search/route.ts`, `lib/models.ts`, content pages
- Env (recommended): `OPENAI_EMBEDDING_MODEL=text-embedding-3-large`

#### How to try
- Trigger `/refreshrag` to rebuild vectors & indexes
- Toggle `published` in front matter to control visibility
- Verify fast, relevant answers with GPT‑5 + hybrid retrieval
