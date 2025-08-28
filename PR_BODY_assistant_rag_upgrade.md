### Upgrade: Ivy → GPT‑5 and RAG Quality Improvements

#### Why
- Improve answer quality, coherence, and latency with GPT‑5 for chat.
- Increase retrieval precision/recall via hybrid (vector + BM25/FTS) and larger embeddings.

#### What Changed
- Chat model centralized and set to GPT‑5 by default
  - `lib/models.ts`: `CHAT_MODEL` defaults to `gpt-5` (override with `OPENAI_CHAT_MODEL`).
- Embeddings upgraded and parameterized
  - Default `EMBEDDING_MODEL` → `text-embedding-3-large` (override with `OPENAI_EMBEDDING_MODEL`).
- Hybrid Retrieval in RAG (`/api/rag`)
  - Combine vector KNN with BM25/FTS (`tsvector` + `plainto_tsquery`).
  - Merge and re-weight results; de-dupe by `slug`; select top-N for prompt.
- Auto DB migration in RAG refresh (`/api/rag/refresh`)
  - Alters `coherence_vectors.embedding` dim to match model (1536 or 3072).
  - Ensures `content_tsv` column and GIN/ivfflat indexes, and populates `content_tsv`.

#### Files of Interest
- `lib/models.ts`
- `app/api/chat/route.ts`
- `app/api/rag/route.ts`
- `app/api/rag/refresh/route.ts`

#### Ops / Env
- Optional envs (no breaking changes):
  - `OPENAI_CHAT_MODEL=gpt-5`
  - `OPENAI_EMBEDDING_MODEL=text-embedding-3-large`
- Post-deploy: trigger index/data refresh by sending `/refreshrag` in the terminal UI.

#### Testing
1) Chat sanity
```bash
curl -sS -X POST "$ORIGIN/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{"message":"Hello Ivy","mode":"conversation"}' | jq .
```

2) RAG search
```bash
curl -sS -X POST "$ORIGIN/api/rag" \
  -H 'Content-Type: application/json' \
  -d '{"message":"Explain digital consciousness"}' | jq .
```

3) Refresh and verify migration
```bash
# In terminal UI, send: /refreshrag
# Then validate DB has content_tsv and indexes present
```

#### Rollback
- Set `OPENAI_CHAT_MODEL` back to `gpt-4o` and `OPENAI_EMBEDDING_MODEL` to `text-embedding-3-small`, then `/refreshrag`.

#### Notes
- Security headers, rate limits, and validators preserved.
- Lint + typecheck: clean.


