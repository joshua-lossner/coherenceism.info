import path from 'path'
import fs from 'fs/promises'
import matter from 'gray-matter'

// Resolve content directory; default points to sibling repo by convention
export const CONTENT_DIR = path.resolve(process.env.CONTENT_DIR ?? '../coherenceism.content')

function isPathInside(baseDirAbs: string, candidateAbs: string): boolean {
  const base = path.resolve(baseDirAbs)
  const target = path.resolve(candidateAbs)
  if (base === target) return true
  const withSep = base.endsWith(path.sep) ? base : base + path.sep
  return target.startsWith(withSep)
}

export function safeJoin(...segments: string[]): string {
  // The first segment must be CONTENT_DIR
  const resolved = path.resolve(...segments)
  if (!isPathInside(CONTENT_DIR, resolved)) {
    throw new Error('Path escapes CONTENT_DIR')
  }
  return resolved
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function listMarkdownFilesRecursively(rootDir: string): Promise<string[]> {
  const results: string[] = []
  const walk = async (dir: string) => {
    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    await Promise.all(entries.map(async entry => {
      const abs = path.resolve(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(abs)
      } else if (/\.(md|mdx|markdown)$/i.test(entry.name)) {
        results.push(abs)
      }
    }))
  }
  await walk(rootDir)
  return results
}

export async function listGenerated(type: 'news' = 'news'): Promise<Array<{
  id: string
  title?: string
  date?: string | Date
  confidence?: number
  tags?: string[] | string
}>> {
  // Repository layout: CONTENT_DIR/content/generated/{type}
  const dir = safeJoin(CONTENT_DIR, 'content', 'generated', type)

  let entries: Array<{ absPath: string; fm: any }> = []
  if (await pathExists(dir)) {
    const files = await listMarkdownFilesRecursively(dir)
    const results = await Promise.all(
      files.map(async absPath => {
        const raw = await fs.readFile(absPath, 'utf8')
        const parsed = matter(raw)
        return { absPath, fm: parsed.data ?? {} }
      })
    )
    entries.push(...results)
  }

  entries = entries.filter(r => r.fm?.published !== true)

  const items = entries
    .map(({ absPath, fm }) => ({
      absPath,
      title: fm?.title,
      date: fm?.date,
      confidence: fm?.confidence,
      tags: fm?.tags,
    }))

  items.sort((a, b) => {
    const da = a.date ? new Date(a.date as any).getTime() : 0
    const db = b.date ? new Date(b.date as any).getTime() : 0
    return db - da
  })

  return items.map(i => ({
    id: Buffer.from(i.absPath).toString('base64'),
    title: i.title,
    date: i.date,
    confidence: i.confidence,
    tags: i.tags,
  }))
}

export async function readMarkdown(absPath: string): Promise<{ frontmatter: any; body: string }> {
  const resolved = path.resolve(absPath)
  if (!isPathInside(CONTENT_DIR, resolved)) {
    throw new Error('Invalid path')
  }
  const raw = await fs.readFile(resolved, 'utf8')
  const parsed = matter(raw)
  return { frontmatter: parsed.data ?? {}, body: parsed.content ?? '' }
}

export async function writeFrontmatter(absPath: string, nextFM: any): Promise<void> {
  const resolved = path.resolve(absPath)
  if (!isPathInside(CONTENT_DIR, resolved)) {
    throw new Error('Invalid path')
  }
  const raw = await fs.readFile(resolved, 'utf8')
  const parsed = matter(raw)
  const merged = { ...(parsed.data ?? {}), ...(nextFM ?? {}) }
  const output = matter.stringify(parsed.content ?? '', merged)
  await fs.writeFile(resolved, output, 'utf8')
}


