---
title: Coherenceism Chronicle – Requirements
type: reference
entry: 001
date: 2025-06-21
status: published
tags: [requirements, journal, coherenceism, site-architecture]
---

# 🪩 Coherenceism Chronicle – Requirements Document

**Purpose:**  
The site serves as a public-facing digital chronicle for the Coherenceism movement. It communicates *what we are building, why we are building it,* and how readers can follow and engage with the philosophy.

---

## 1. 🎯 Project Goals

- Serve as an **informational hub** for Coherenceism
- Host markdown-based **journal entries**, **books**, and **reference material**
- Provide a readable, shareable, and lightly designed interface with **custom styling**
- Be **version-controlled**, **content-transparent**, and **AI-collaborative**
- Support **human + agent workflows** for publishing and evolving the site

---

## 2. 🧱 Architecture Overview

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 14 App Router + React Server Components |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Hosting** | Vercel |
| **Content Source** | Markdown files in separate repo: `coherenceism.content` |
| **Agent Integration** | Codex for scaffolding, editing, and publishing |
| **Editing Workflow** | Obsidian (for human editing) + GitHub sync |

---

## 3. 📁 Site Structure

### Static Routes:
| Route | Description |
|-------|-------------|
| `/` | Landing page with project intro |
| `/journal` | List of journal entries |
| `/books` | List of longer-form publications |
| `/reference` | Index of philosophical and governance docs (e.g. ethics, governance, agents) |

### Dynamic Routes:
| Route | Description |
|-------|-------------|
| `/journal/[slug]` | Individual journal post |
| `/books/[slug]` | Long-form piece or serialized book section |
| `/reference/[slug]` | Support documents or manifestos |

---

## 4. 📦 Content Format & Rules

- Markdown files follow a strict naming and metadata convention
- Example: `journal-001-toward-the-coherenceist-os.md`
- Each file begins with **YAML frontmatter**:

```yaml
---
title: Toward the Coherenceist OS
type: journal
entry: 001
date: 2025-06-21
status: published
tags: [coherenceism, ai, os, vision]
---
```

- Must be **human-readable** and **AI-writable**
- Reside in structured folders inside `coherenceism.content`:
  - `/journal/`, `/book/`, `/reference/`

---

## 5. 🔁 Development Workflow

| Step | Who | Tool |
|------|-----|------|
| Write/Edit Markdown | Joshua + Ivy | Obsidian, Codex |
| Store content | GitHub | `coherenceism.content` repo |
| Build frontend | Codex + humans | `coherenceism.info` |
| Preview changes | Vercel (test branch) | Pull Requests |
| Push to production | Merge to `main` | Auto-deploy via Vercel |

---

## 6. 🧠 Future Features (Optional Phase 2+)

- **Search + tag filtering** for journals and books
- **Audio narration** or podcast-like playback for entries
- **Theme toggle (light/dark)** or custom fonts
- **AI commentaries** beside human-authored text
- **RSS feed or email digest**

---
