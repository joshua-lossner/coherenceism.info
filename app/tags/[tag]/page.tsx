import Link from 'next/link'
import { getEntriesByTag } from '../../../lib/content'

interface TagPageProps {
  params: { tag: string }
}

export default async function TagPage({ params }: TagPageProps) {
  const entries = await getEntriesByTag(params.tag)
  return (
    <main className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">Tag: {params.tag}</h1>
      <ul className="list-disc list-inside">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link href={`/${entry.frontmatter.type === 'journal' ? 'journal' : 'books'}/${entry.slug}`}>{entry.frontmatter.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
