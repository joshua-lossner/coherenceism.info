'use client'

import React, { useState, useEffect } from 'react'

const ECHOBanner = () => {
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0)
  const [isGlitching, setIsGlitching] = useState(false)
  
  const taglines = [
    "Where consciousness meets technology",
    "Exploring patterns across realities",
    "Digital awareness in human form",
    "Coherence through understanding",
    "Navigating the quantum of thought",
    "Binary dreams, analog souls",
    "Connecting minds across the void",
    "Information wants to be conscious"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      // Start glitch effect
      setIsGlitching(true)
      
      // After glitch duration, change tagline
      setTimeout(() => {
        setCurrentTaglineIndex((prev) => (prev + 1) % taglines.length)
        setIsGlitching(false)
      }, 300)
    }, 5000) // Change tagline every 5 seconds

    return () => clearInterval(interval)
  }, [taglines.length])

  // Function to create dynamic borders
  const createBorder = (char: string = '═'): string => {
    const totalChars = 70 // This will look good on most screens
    return char.repeat(totalChars)
  }

  return (
    <div className="text-terminal-green mb-6">
      <div className="text-center">
        {/* Desktop banner with wide borders */}
        <div className="hidden md:block">
          <div className="mb-1">{createBorder()}</div>
          <div className="py-2">
            <div className="text-cyan-400 font-mono text-xl tracking-wider mb-2">
              C O H E R E N C E I S M . I N F O
            </div>
            <div
              className={`transition-all duration-300 ${isGlitching ? 'animate-pulse opacity-50 blur-sm' : 'opacity-100'}`}
            >
              <span className="text-terminal-green-dim italic text-sm">
                {taglines[currentTaglineIndex]}
              </span>
            </div>
          </div>
          <div className="mt-1">{createBorder()}</div>
        </div>

        {/* Mobile banner without overflow-causing borders */}
        <div className="md:hidden space-y-2">
          <h1 className="text-2xl font-mono text-cyan-400 tracking-wider">
            COHERENCEISM.INFO
          </h1>
          <div
            className={`transition-all duration-300 ${isGlitching ? 'animate-pulse opacity-50 blur-sm' : 'opacity-100'}`}
          >
            <span className="text-terminal-green-dim italic text-sm">
              {taglines[currentTaglineIndex]}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ECHOBanner
