'use client'

import { useState } from 'react'
import type { Frontmatter } from '../lib/content'
import PostCard, { Entry } from './PostCard'
import { Button } from './ui/button'

interface Props {
  entries: Entry[]
}

export default function JournalFeed({ entries }: Props) {
  const [visible, setVisible] = useState(5)
  const shown = entries.slice(0, visible)

  return (
    <div className="space-y-4">
      {shown.map((entry) => (
        <PostCard key={entry.slug} entry={entry} />
      ))}
      {visible < entries.length && (
        <div className="flex justify-center">
          <Button onClick={() => setVisible((v) => Math.min(entries.length, v + 5))}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
