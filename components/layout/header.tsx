import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur">
      <div className="max-w-3xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="font-bold text-xl">
          Coherenceism
        </Link>
        <nav className="space-x-4">
          <Link href="/journal">Journal</Link>
          <Link href="/books">Books</Link>
        </nav>
      </div>
    </header>
  )
}
