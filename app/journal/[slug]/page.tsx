interface JournalEntryPageProps {
  params: { slug: string }
}

export default function JournalEntryPage({ params }: JournalEntryPageProps) {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{params.slug}</h1>
      <p className="mt-2">This is a placeholder for the journal entry content.</p>
    </main>
  )
}
