import Link from 'next/link'
import type { Frontmatter } from '../lib/content'

export interface Entry {
  slug: string
  frontmatter: Frontmatter
}

export default function PostCard({ entry }: { entry: Entry }) {
  const href = `/${entry.frontmatter.type === 'journal' ? 'journal' : 'books'}/${entry.slug}`
  return (
    <article className="border border-border bg-card rounded-lg p-4 shadow space-y-2">
      <h2 className="text-lg font-semibold">
        <Link href={href}>{entry.frontmatter.title}</Link>
      </h2>
      <p className="text-sm text-muted-foreground">{entry.frontmatter.date}</p>
      <p>{entry.frontmatter.summary}</p>
    </article>
  )
}
