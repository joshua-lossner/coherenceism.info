import Link from 'next/link'
import { getAllEntries } from '../../lib/content'

export default async function BooksIndexPage() {
  const entries = await getAllEntries('books')
  return (
    <main className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">Books</h1>
      <ul className="list-disc list-inside">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link href={`/books/${entry.slug}`}>{entry.frontmatter.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
