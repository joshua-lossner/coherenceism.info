import { getEntry } from '../../../lib/content'

interface BookPageProps {
  params: { slug: string }
}

export default async function BookPage({ params }: BookPageProps) {
  const { frontmatter, content } = await getEntry('books', params.slug)
  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{frontmatter.title}</h1>
      {content}
    </main>
  )
}
