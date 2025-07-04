'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ECHOBanner from '@/components/ECHOBanner'

interface JournalEntry {
  id: number
  title: string
  date: string
  content: string
  filename: string
}

export default function JournalPage() {
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)

  useEffect(() => {
    fetchJournals()
  }, [])

  const fetchJournals = async () => {
    try {
      const response = await fetch('https://api.github.com/repos/joshua-lossner/coherenceism.content/contents/content/journal')
      const files = await response.json()
      
      if (Array.isArray(files)) {
        const journalFiles = files
          .filter((file: any) => file.name.endsWith('.md') && file.name !== 'AGENTS.md')
          .sort((a: any, b: any) => b.name.localeCompare(a.name))
        
        const journalEntries = await Promise.all(
          journalFiles.map(async (file: any, index: number) => {
            try {
              const contentResponse = await fetch(file.download_url)
              const content = await contentResponse.text()
              
              const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)/)
              let title = file.name.replace('.md', '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
              let date = ''
              let bodyContent = content
              
              if (frontmatterMatch) {
                const frontmatter = frontmatterMatch[1]
                bodyContent = frontmatterMatch[2]
                
                const titleMatch = frontmatter.match(/title:\s*"?([^"\n]+)"?/)
                const dateMatch = frontmatter.match(/date:\s*"?([^"\n]+)"?/)
                
                if (titleMatch) title = titleMatch[1]
                if (dateMatch) date = dateMatch[1]
              }
              
              if (!date) {
                const filenameDateMatch = file.name.match(/^(\d{4}-\d{2}-\d{2})/)
                if (filenameDateMatch) {
                  date = filenameDateMatch[1]
                }
              }
              
              return {
                id: index + 1,
                title: title,
                date: date,
                content: bodyContent.trim(),
                filename: file.name
              }
            } catch (error) {
              console.error(`Error fetching journal ${file.name}:`, error)
              return null
            }
          })
        )
        
        setJournals(journalEntries.filter(entry => entry !== null))
      }
    } catch (error) {
      console.error('Error fetching journals:', error)
    }
    setLoading(false)
  }

  if (selectedEntry) {
    return (
      <div className="h-screen bg-black text-terminal-green overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pb-8">
          <ECHOBanner />
          <div className="mb-6">
            <button 
              onClick={() => setSelectedEntry(null)}
              className="text-terminal-amber hover:brightness-125 mb-4"
            >
              ← Back to Journal List
            </button>
            <h1 className="text-xl font-bold text-terminal-green mb-2">{selectedEntry.title}</h1>
            {selectedEntry.date && (
              <p className="text-terminal-green-dim text-sm mb-4">{selectedEntry.date}</p>
            )}
          </div>
          <div className="prose prose-invert prose-green max-w-none">
            <div className="whitespace-pre-wrap text-terminal-green leading-relaxed">
              {selectedEntry.content}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
          <div className="h-screen bg-black text-terminal-green overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pb-8">
        <ECHOBanner />
        <div className="mb-6">
          <Link href="/" className="text-terminal-amber hover:brightness-125 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">Journal Entries</h1>
          <p className="text-terminal-green-dim">Thoughts and reflections on coherence</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-terminal-green-dim">Loading journal entries...</p>
          </div>
        ) : journals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-terminal-green-dim">No journal entries found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {journals.map((entry) => (
              <div 
                key={entry.id}
                className="border border-terminal-green-dim p-4 cursor-pointer hover:border-terminal-green transition-colors"
                onClick={() => setSelectedEntry(entry)}
              >
                <h3 className="text-terminal-green font-bold mb-2">{entry.title}</h3>
                {entry.date && (
                  <p className="text-terminal-green-dim text-sm mb-2">{entry.date}</p>
                )}
                <p className="text-terminal-green-dim text-sm">
                  {entry.content.substring(0, 150)}...
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 