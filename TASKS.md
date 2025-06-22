# Coherenceism.info – A Futuristic Blog Site

**Purpose**: Render markdown content from `coherenceism.content.git` with a site architecture and aesthetic aligned to the Coherenceist ethos: minimalist, accessible, radically future-aware.

---

## 🔹 PHASE 0: Foundation Setup

- [ ] ✅ Initialize Next.js 14 app with App Router
- [ ] ✅ Install Tailwind CSS + set up PostCSS config
- [ ] ✅ Install MDX support with `next-mdx-remote` or native MDX routing
- [ ] ✅ Create `/content` directory and configure local dev to clone/sync with `https://github.com/joshua-lossner/coherenceism.content.git`
- [ ] ✅ Add `.env.example` and `.env.local` with Git sync options (optional)

---

## 🔹 PHASE 1: Content Architecture

- [ ] Create dynamic route for `/journal/[slug]` and `/books/[slug]`
- [ ] Build `getStaticProps` or equivalent content loader (use `gray-matter` + MDX parser)
- [ ] Define unified frontmatter schema for markdown (title, date, tags, summary, type)
- [ ] Build index pages:
  - [ ] `/journal` → lists latest entries
  - [ ] `/books` → longform or serialized content
  - [ ] `/tags/[tag]` → filter by tag/topic

---

## 🔹 PHASE 2: Design System

- [ ] Implement base layout: header, nav, main content area, footer
- [ ] Configure custom Tailwind theme with:
  - Fonts: `Inter`, `IBM Plex Mono`, or something... *coherently alien*
  - Color palette: Deep gray, soft neon, sandlight blue
  - Ambient dark mode default
