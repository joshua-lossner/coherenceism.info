import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { compileMDX } from 'next-mdx-remote/rsc'

export type Frontmatter = {
  title: string
  date: string
  tags: string[]
  summary: string
  type: string
}

const CONTENT_ROOT = path.join(process.cwd(), 'content')

export async function getEntry(type: 'journal' | 'books', slug: string) {
  const filePath = path.join(CONTENT_ROOT, type, `${slug}.mdx`)
  const source = await fs.readFile(filePath, 'utf8')
  const { data, content } = matter(source)
  const mdx = await compileMDX({ source: content })
  return { frontmatter: data as Frontmatter, content: mdx }
}

export async function getAllEntries(type: 'journal' | 'books') {
  const dir = path.join(CONTENT_ROOT, type)
  const files = await fs.readdir(dir)
  const entries = await Promise.all(
    files
      .filter((f) => f.endsWith('.mdx'))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(dir, file), 'utf8')
        const { data } = matter(raw)
        const slug = file.replace(/\.mdx$/, '')
        return { slug, frontmatter: data as Frontmatter }
      }),
  )
  entries.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime(),
  )
  return entries
}

export async function getEntriesByTag(tag: string) {
  const [journal, books] = await Promise.all([
    getAllEntries('journal'),
    getAllEntries('books'),
  ])
  return [...journal, ...books].filter((e) => e.frontmatter.tags.includes(tag))
}
