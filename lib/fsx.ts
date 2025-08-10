import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { dirname } from 'node:path'

// Tiny filesystem helpers — no external I/O beyond local FS
// TODO: extend with YAML frontmatter parsing and safe writes

export async function ensureDir(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true })
  } catch (_) {
    // no-op; mkdir with recursive handles most cases
  }
}

export async function readText(path: string): Promise<string | undefined> {
  try {
    const buf = await readFile(path)
    return buf.toString('utf8')
  } catch (_) {
    return undefined
  }
}

export async function writeText(path: string, text: string): Promise<void> {
  await ensureDir(dirname(path))
  await writeFile(path, text, 'utf8')
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}


