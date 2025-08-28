# Working with GPT-5 in Cursor

This repository includes a Claude-oriented setup (`.claude/`, `CLAUDE.md`). Runtime code is OpenAI-first (GPT-4o), so for Cursor the goal is to streamline how GPT-5 assists you while preserving the existing architecture.

## Quickstart
- Open `components/ECHOTerminal.tsx` and `app/api/chat/route.ts` for most tasks
- Use the `.cursorrules` as the assistant’s operating guide in this repo
- Run locally: `npm run dev`

## Common tasks

### Add a new terminal command
1. Edit `components/ECHOTerminal.tsx` and locate the command switch (search for `processCommand` or existing command cases)
2. Add your case, preserving the terminal UX conventions
3. If it triggers API calls, add/modify `app/api/*` routes
4. Typecheck + lint: `npx tsc --noEmit && npm run lint`

### Modify AI behavior (system prompt / model)
1. Open `app/api/chat/route.ts`
2. Adjust the system prompt construction and/or message assembly
3. Keep Ivy’s persona consistent (see `CLAUDE.md` and `README.md`)
4. Leave model IDs as-is unless you intend to change defaults project-wide

### Extend RAG behavior
1. See `app/api/rag/route.ts` and `app/api/search/route.ts`
2. Embeddings use `text-embedding-3-small`; SQL via `@vercel/postgres`
3. Keep validation, rate limiting, and security headers intact

### Narration / speech
- Endpoints: `app/api/narrate/route.ts`, `app/api/speech/route.ts`
- Uses ElevenLabs; chunking and caching documented in `NARRATION_FEATURE.md` and `CHUNKED_NARRATION_UPDATE.md`

## Verification
- After edits to critical files, run:
  - `npx tsc --noEmit`
  - `npm run lint`
- For API routes, verify with curl or browser; ensure `SecurityHeadersManager` is applied

## Notes on the Claude files
- `.claude/` and `CLAUDE.md` provide helpful project context and workflows
- You don’t need to change or remove them; they’re documentation for another assistant
- Prefer `.cursorrules` + this guide when working in Cursor with GPT-5

## Model defaults (runtime)
- Chat: `gpt-4o`
- Embeddings: `text-embedding-3-small`
- To change models, centralize them in a small config module before swapping across routes

## Environment variables
```
OPENAI_API_KEY=...
OPENAI_PROJECT_ID=...   # optional
POSTGRES_URL=...
ELEVENLABS_API_KEY=...
BLOB_READ_WRITE_TOKEN=...
```

## Safety
- Never expose secrets to the client
- Respect rate limits and validators
- Keep the session cookie logic in `/api/chat` as-is unless explicitly refactoring 