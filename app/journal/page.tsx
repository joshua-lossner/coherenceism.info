import Link from 'next/link'

const mockEntries = [
  { slug: 'entry-one', title: 'Entry One' },
  { slug: 'entry-two', title: 'Entry Two' },
]

export default function JournalIndexPage() {
  return (
    <main className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">Journal</h1>
      <ul className="list-disc list-inside">
        {mockEntries.map((entry) => (
          <li key={entry.slug}>
            <Link href={`/journal/${entry.slug}`}>{entry.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
