# AGENTS.md – Frontend & Infrastructure Guide

This file defines the responsibilities and constraints for human developers and Codex agents working within the `coherenceism.info` repository.

---

## 🎯 Purpose

This is the frontend for the Coherenceism.info site, hosted on **Vercel** and built with **Next.js 14** and **React Server Components**. It serves the markdown-based content stored in the `coherenceism.content` repo.

---

## 🧱 Stack Snapshot

| Component      | Description                             |
|----------------|-----------------------------------------|
| Framework      | Next.js 14 (App Router)                 |
| Styling        | Tailwind CSS + shadcn/ui                |
| Content        | Markdown (from external GitHub repo)    |
| Hosting        | Vercel                                  |
| Runtime        | Node.js 20.x LTS                        |
| Agents         | Codex (via GitHub connector)            |

---

## 🌱 Directory Overview

```
/app/           → Page routes & layout logic
/components/    → Shared UI components
/lib/           → Client/server utilities
/public/        → Static assets
/scripts/       → Build/setup utilities
/tests/         → Vitest suites
/cms/           → Content pipeline (from coherenceism.content)
```

---

## 🔁 Branch Workflow

- `main` → Production (auto-deployed on Vercel)
- `test` → Preview branch (manually merged from features)
- `feature/*` → Work branches for development

PRs must flow: `feature/*` → `test` → `main`

---

## 🤖 Codex Agent Protocol

Agents are allowed to:
- Scaffold new routes, components, and CMS logic
- Propose UI/layout changes based on content needs
- Maintain deployment health checks and test coverage

Agents **must not**:
- Modify Vercel config or DNS records directly
- Push to `main` or `test` without human review
- Introduce new dependencies without justification

---

## 🚀 Vercel Setup

- `main` → Production URL  
- `test` → Preview deployment  
- PRs to `test` automatically generate previews

Ensure all changes are testable before merging to `main`.

---

End of File.
