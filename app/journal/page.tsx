import { getAllEntries } from '../../lib/content'
import JournalFeed from '../../components/JournalFeed'

export default async function JournalIndexPage() {
  const entries = await getAllEntries('journal')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Journal</h1>
      <JournalFeed entries={entries} />
    </div>
  )
}
