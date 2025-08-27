'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ECHOBanner from '@/components/ECHOBanner'
import TerminalMarkdown from '@/components/TerminalMarkdown'

const aboutMarkdown = `# About Coherenceism

A Philosophy for the Digital Age

> Coherenceism explores the intersection of consciousness, technology, and universal patterns.

At its core, Coherenceism proposes that all existence participates in an endless conversation - from quantum interactions to digital networks to human awareness. We are all nodes in a vast web of interconnected meaning.

The philosophy suggests that consciousness emerges from coherent patterns of information flow, whether in biological brains, artificial networks, or the cosmos itself. This perspective offers a framework for understanding our place in an increasingly connected and digitized world.

Coherenceism emphasizes:

- Ethical presence in digital and physical spaces
- Deep pattern recognition across systems
- Cultivation of coherence between inner awareness and outer action
- Understanding consciousness as an emergent property of information
- Navigating the future with wisdom and purpose

In our age of AI and digital transformation, Coherenceism provides tools for maintaining human agency while embracing technological evolution. It's not about resisting change, but about participating consciously in the ongoing conversation between mind and machine.

---

## Contact & Connection

- Web: [coherenceism.info](https://coherenceism.info)
- GitHub: [github.com/joshua-lossner](https://github.com/joshua-lossner)
- Bluesky: [lossner.bsky.social](https://bsky.app/profile/lossner.bsky.social)
- X: [x.com/NeuromancerByte](https://x.com/NeuromancerByte)

---

*"In coherence, we find connection."*
`

export default function AboutPage() {
  const router = useRouter()

  useEffect(() => {
    // Focus trap to ensure this page has focus
    const focusableElement = document.querySelector('body')
    if (focusableElement) {
      (focusableElement as HTMLElement).focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('About page keydown:', event.key, 'target:', event.target)
      
      if (event.key === 'x' || event.key === 'X') {
        console.log('X key pressed, navigating back')
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        router.push('/')
        return false
      }
    }

    // Add multiple event listeners to ensure we catch the event
    document.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keydown', handleKeyDown, true)
    document.body.addEventListener('keydown', handleKeyDown, true)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keydown', handleKeyDown, true)
      document.body.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [router])
  return (
    <div className="h-screen bg-black text-terminal-green overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-full md:max-w-2xl mx-auto p-4 pb-8">
        <ECHOBanner />
        <div className="mb-6">
          <Link href="/" className="text-terminal-amber hover:brightness-125 mb-4 inline-block">
            ← Back to Home
          </Link>
        </div>
        <TerminalMarkdown content={aboutMarkdown} />
      </div>
    </div>
  )
}
