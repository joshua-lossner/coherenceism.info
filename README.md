# Coherenceism Frontend

This repo hosts the Next.js frontend for **Coherenceism.info**. Content is stored in the separate `coherenceism.content` repository and will be pulled in during build time or runtime.

## Project Structure

```
/app/           - App Router pages and layouts
/components/    - Reusable UI components
/lib/           - Server/client utilities
/public/        - Static assets
/scripts/       - Build and setup helpers
/tests/         - Vitest test suites
/cms/           - Content pipeline (placeholder)
```

## Developing

```
npm install
npm run dev
npm test
```

The journal section lives under `/app/journal`. For now it contains mocked entries and a placeholder layout. Individual entries are served via `/journal/[slug]`.

Content from `coherenceism.content` will eventually be injected via a CMS pipeline in `/cms`.
