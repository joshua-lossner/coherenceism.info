# AI Assistant Guidelines

This repository contains a Next.js + TypeScript project for the ECHO Coherence Archive. These notes help AI assistants like OpenAI's Codex and ChatGPT contribute effectively.

## Development Commands

- `npm run dev` – start the local development server
- `npm run build` – create a production build
- `npm start` – run the production server
- `npm run lint` – lint the codebase with ESLint
- `npm run typecheck` – verify TypeScript types with `tsc --noEmit`

Always run linting and type checks before committing changes.

## Code Style

- TypeScript in strict mode; prefer explicit types
- React functional components with hooks
- camelCase for variables/functions, PascalCase for components
- Use async/await with proper error handling
- Preserve security patterns (validation, rate limiting, secure headers)
- Maintain the retro terminal aesthetic in UI changes

## Project Structure Highlights

- `app/` – Next.js App Router pages and API routes
- `components/` – React components such as `ECHOTerminal`
- `lib/` – utilities (audio cache, rate limiting, secure logging, etc.)
- `data/` – project data files like `audio-cache.json`

## Additional References

- See `CLAUDE.md` and `CURSOR.md` for deeper architectural context and workflows.
- Environment variables are documented in `CURSOR.md`.

Following these practices ensures smooth collaboration between human developers and AI assistants.
