# Coherenceism.info – A Futuristic Blog Site

**Purpose**: Render markdown content from `coherenceism.content.git` with a site architecture and aesthetic aligned to the Coherenceist ethos: minimalist, accessible, radically future-aware.

---

## 🔹 PHASE 0: Foundation Setup

- [x] Initialize Next.js 14 app with App Router
- [x] Install Tailwind CSS + set up PostCSS config
- [x] Install MDX support with `next-mdx-remote` or native MDX routing
- [x] Create `/content` directory and configure local dev to clone/sync with `https://github.com/joshua-lossner/coherenceism.content.git`
- [x] Add `.env.example` and `.env.local` with Git sync options (optional)

---

## 🔹 PHASE 1: Content Architecture *(completed)*

- [x] Create dynamic route for `/journal/[slug]` and `/books/[slug]`
- [x] Build `getStaticProps` or equivalent content loader (use `gray-matter` + MDX parser)
- [x] Define unified frontmatter schema for markdown (title, date, tags, summary, type)
- [x] Build index pages:
  - [x] `/journal` → lists latest entries
  - [x] `/books` → longform or serialized content
  - [x] `/tags/[tag]` → filter by tag/topic

---

## 🔹 PHASE 2: Design System & Social Feed

- [x] Implement base layout: header, nav, main content area, footer
- [x] Configure custom Tailwind theme with:
  - Fonts: `Inter`, `IBM Plex Mono`, or something... *coherently alien*
  - Color palette: Deep gray, soft neon, sandlight blue
  - Ambient dark mode default
- [x] Build scrollable feed experience similar to **bsky.app** or **x.com**:
  - [x] Vertical timeline layout for journal entries
  - [x] Infinite scroll or "load more" interaction
  - [x] Reusable card component for posts
