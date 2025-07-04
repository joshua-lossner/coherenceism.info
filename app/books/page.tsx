'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import WOPRBanner from '@/components/WOPRBanner'

interface Book {
  id: number
  title: string
  slug: string
}

interface Chapter {
  id: number
  title: string
  content: string
  filename: string
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const response = await fetch('https://api.github.com/repos/joshua-lossner/coherenceism.content/contents/content/books')
      const files = await response.json()
      
      if (Array.isArray(files)) {
        const bookDirectories = files.filter((file: any) => file.type === 'dir')
        const bookEntries = bookDirectories.map((dir: any, index: number) => {
          const title = dir.name
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          return {
            id: index + 1,
            title: title,
            slug: dir.name
          }
        })
        
        setBooks(bookEntries)
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    }
    setLoading(false)
  }

  const fetchChapters = async (bookSlug: string) => {
    try {
      const response = await fetch(`https://api.github.com/repos/joshua-lossner/coherenceism.content/contents/content/books/${bookSlug}`)
      const files = await response.json()
      
      if (Array.isArray(files)) {
        const chapterFiles = files
          .filter((file: any) => file.name.endsWith('.md'))
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
        
        const chapterEntries = await Promise.all(
          chapterFiles.map(async (file: any, index: number) => {
            try {
              const contentResponse = await fetch(file.download_url)
              const content = await contentResponse.text()
              
              const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)/)
              let title = file.name.replace('.md', '').replace(/^\d+-/, '')
              let bodyContent = content
              
              if (frontmatterMatch) {
                const frontmatter = frontmatterMatch[1]
                bodyContent = frontmatterMatch[2]
                
                const titleMatch = frontmatter.match(/title:\s*"?([^"\n]+)"?/)
                if (titleMatch) title = titleMatch[1]
              }
              
              return {
                id: index + 1,
                title: title,
                content: bodyContent.trim(),
                filename: file.name
              }
            } catch (error) {
              console.error(`Error fetching chapter ${file.name}:`, error)
              return null
            }
          })
        )
        
        setChapters(chapterEntries.filter(chapter => chapter !== null))
      }
    } catch (error) {
      console.error('Error fetching chapters:', error)
    }
  }

  const handleBookSelect = async (book: Book) => {
    setSelectedBook(book)
    setLoading(true)
    await fetchChapters(book.slug)
    setLoading(false)
  }

  if (selectedChapter) {
    return (
      <div className="h-screen bg-black text-terminal-green overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pb-8">
          <WOPRBanner />
          <div className="mb-6">
            <button 
              onClick={() => setSelectedChapter(null)}
              className="text-terminal-amber hover:brightness-125 mb-4"
            >
              ← Back to {selectedBook?.title}
            </button>
            <h1 className="text-xl font-bold text-terminal-green mb-2">{selectedChapter.title}</h1>
          </div>
          <div className="prose prose-invert prose-green max-w-none">
            <div className="whitespace-pre-wrap text-terminal-green leading-relaxed">
              {selectedChapter.content}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedBook) {
    return (
      <div className="h-screen bg-black text-terminal-green overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pb-8">
          <WOPRBanner />
          <div className="mb-6">
            <button 
              onClick={() => setSelectedBook(null)}
              className="text-terminal-amber hover:brightness-125 mb-4"
            >
              ← Back to Books
            </button>
            <h1 className="text-2xl font-bold text-cyan-400 mb-2">{selectedBook.title}</h1>
            <p className="text-terminal-green-dim">Chapters</p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-terminal-green-dim">Loading chapters...</p>
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-terminal-green-dim">No chapters found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <div 
                  key={chapter.id}
                  className="border border-terminal-green-dim p-4 cursor-pointer hover:border-terminal-green transition-colors"
                  onClick={() => setSelectedChapter(chapter)}
                >
                  <h3 className="text-terminal-green font-bold mb-2">{chapter.title}</h3>
                  <p className="text-terminal-green-dim text-sm">
                    {chapter.content.substring(0, 150)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black text-terminal-green overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-8">
        <WOPRBanner />
        <div className="mb-6">
          <Link href="/" className="text-terminal-amber hover:brightness-125 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">Coherenceism Texts</h1>
          <p className="text-terminal-green-dim">Philosophical writings and explorations</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-terminal-green-dim">Loading books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-terminal-green-dim">No books found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {books.map((book) => (
              <div 
                key={book.id}
                className="border border-terminal-green-dim p-4 cursor-pointer hover:border-terminal-green transition-colors"
                onClick={() => handleBookSelect(book)}
              >
                <h3 className="text-terminal-green font-bold mb-2">{book.title}</h3>
                <p className="text-terminal-green-dim text-sm">
                  Click to explore chapters →
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 