import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">Coherenceism</h1>
      <p className="mt-2">Welcome to Coherenceism.info.</p>
      <nav className="space-x-4">
        <Link href="/journal">Journal</Link>
        <Link href="/books">Books</Link>
      </nav>
    </main>
  )
}
