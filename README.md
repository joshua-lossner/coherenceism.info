# Coherenceism Frontend

This repo hosts the Next.js frontend for **Coherenceism.info**. Content is stored in the separate `coherenceism.content` repository and will be pulled in during build time or runtime.

## Project Structure

```
/app/           - App Router pages and layouts
/components/    - Reusable UI components
/lib/           - Server/client utilities
/public/        - Static assets
/scripts/       - Build and setup helpers
/content/       - Markdown content cloned from `coherenceism.content`
/tests/         - Vitest test suites
/cms/           - Content pipeline (placeholder)
```

## Developing

```
npm install
npm run dev
npm test
```

To pull down the markdown content repository, run:

```
npm run content:sync
```

MDX pages can be placed anywhere under `app/` using the `.mdx` extension. See `app/hello.mdx` for a simple example.

The journal section lives under `/app/journal`. For now it contains mocked entries and a placeholder layout. Individual entries are served via `/journal/[slug]`.

Content from `coherenceism.content` will eventually be injected via a CMS pipeline in `/cms`.

## Content Sync during Build

Running `npm run build` triggers a `prebuild` step that clones the `coherenceism.content` repository via `scripts/sync-content.js`. The repository URL can be customized using the `CONTENT_REPO_URL` environment variable. When deploying to Vercel, ensure this variable points to a repo the build process can access, either publicly or via credentials.
