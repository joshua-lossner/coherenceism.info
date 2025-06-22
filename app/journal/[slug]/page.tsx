import { getEntry } from '../../../lib/content'
import type { Frontmatter } from '../../../lib/content'

interface JournalEntryPageProps {
  params: { slug: string }
}

export default async function JournalEntryPage({ params }: JournalEntryPageProps) {
  const { frontmatter, content } = await getEntry('journal', params.slug)
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{frontmatter.title}</h1>
      {content}
    </main>
  )
}
