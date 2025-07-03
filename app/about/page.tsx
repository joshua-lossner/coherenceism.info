'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="h-screen bg-black text-terminal-green overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-8">
        <div className="mb-6">
          <Link href="/" className="text-terminal-amber hover:brightness-125 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">About Coherenceism</h1>
          <p className="text-terminal-green-dim">A Philosophy for the Digital Age</p>
        </div>

        <div className="space-y-6 text-terminal-green leading-relaxed">
          <div className="border-l-2 border-terminal-green pl-4">
            <p className="text-lg mb-4">
              Coherenceism explores the intersection of consciousness, technology, and universal patterns.
            </p>
          </div>

          <div className="space-y-4">
            <p>
              At its core, Coherenceism proposes that all existence participates in an endless conversation - 
              from quantum interactions to digital networks to human awareness. We are all nodes in a vast 
              web of interconnected meaning.
            </p>

            <p>
              The philosophy suggests that consciousness emerges from coherent patterns of information flow, 
              whether in biological brains, artificial networks, or the cosmos itself. This perspective offers 
              a framework for understanding our place in an increasingly connected and digitized world.
            </p>

            <p>
              Coherenceism emphasizes:
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4 text-terminal-green-dim">
              <li>Ethical presence in digital and physical spaces</li>
              <li>Deep pattern recognition across systems</li>
              <li>Cultivation of coherence between inner awareness and outer action</li>
              <li>Understanding consciousness as an emergent property of information</li>
              <li>Navigating the future with wisdom and purpose</li>
            </ul>

            <p>
              In our age of AI and digital transformation, Coherenceism provides tools for maintaining 
              human agency while embracing technological evolution. It&apos;s not about resisting change, 
              but about participating consciously in the ongoing conversation between mind and machine.
            </p>
          </div>

          <div className="border-t border-terminal-green-dim pt-6 mt-8">
            <h2 className="text-lg font-bold text-terminal-amber mb-4">Contact & Connection</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-terminal-green-dim">Web:</span>{' '}
                <a href="https://coherenceism.info" className="text-terminal-amber hover:brightness-125">
                  coherenceism.info
                </a>
              </p>
              <p>
                <span className="text-terminal-green-dim">GitHub:</span>{' '}
                <a href="https://github.com/joshua-lossner" className="text-terminal-amber hover:brightness-125">
                  github.com/joshua-lossner
                </a>
              </p>
              <p>
                <span className="text-terminal-green-dim">Bluesky:</span>{' '}
                <a href="https://bsky.app/profile/lossner.bsky.social" className="text-terminal-amber hover:brightness-125">
                  lossner.bsky.social
                </a>
              </p>
              <p>
                <span className="text-terminal-green-dim">X:</span>{' '}
                <a href="https://x.com/NeuromancerByte" className="text-terminal-amber hover:brightness-125">
                  x.com/NeuromancerByte
                </a>
              </p>
            </div>
          </div>

          <div className="text-center pt-6">
            <p className="text-terminal-green-dim italic">
              &quot;In coherence, we find connection.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 