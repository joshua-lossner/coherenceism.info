'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useRouter } from 'next/navigation'

interface TerminalLine {
  text: string
  type?: 'normal' | 'error' | 'processing' | 'ai-response' | 'separator' | 'user-input' | 'markdown' | 'ascii-art' | 'tagline' | 'conversation-border'
  isMarkdown?: boolean
  clickableCommand?: string
}

const ECHOTerminal = () => {
  const router = useRouter()
  const [currentInput, setCurrentInput] = useState('')
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingDots, setProcessingDots] = useState('')
  const [currentMenu, setCurrentMenu] = useState('main')
  const [previousMenu, setPreviousMenu] = useState('main')
  const [systemReady, setSystemReady] = useState(false)
  const [journals, setJournals] = useState<any[]>([])
  const [journalsLoaded, setJournalsLoaded] = useState(false)
  const [books, setBooks] = useState<Array<{id: number, title: string, slug: string}>>([])
  const [booksLoaded, setBooksLoaded] = useState(false)
  const [currentBook, setCurrentBook] = useState<string>('')
  const [chapters, setChapters] = useState<Array<{id: number, title: string, content: string, filename: string}>>([])
  const [chaptersLoaded, setChaptersLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [isDisplayingMarkdown, setIsDisplayingMarkdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isViewingContent, setIsViewingContent] = useState(false)
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0)
  const [isGlitching, setIsGlitching] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [hasConversationContext, setHasConversationContext] = useState(false)
  const [currentNarrationUrls, setCurrentNarrationUrls] = useState<string[]>([])
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0)
  const [isNarrationPlaying, setIsNarrationPlaying] = useState(false)
  const [currentContent, setCurrentContent] = useState<{text: string, type: string, id: string} | null>(null)
  const [changelog, setChangelog] = useState<any[]>([])
  const [changelogLoaded, setChangelogLoaded] = useState(false)
  const [changelogPage, setChangelogPage] = useState(1)
  const [journalPage, setJournalPage] = useState(1)
  const [isSplitView, setIsSplitView] = useState(false)
  const [isWideScreen, setIsWideScreen] = useState(false)
  const [contentForRightPanel, setContentForRightPanel] = useState<{text: string, title?: string} | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const narrationRef = useRef<HTMLAudioElement | null>(null)
  const isInitializedRef = useRef(false)

  // Fetch journal entries from GitHub
  const fetchJournals = async () => {
    try {
      const response = await fetch('https://api.github.com/repos/joshua-lossner/coherenceism.content/contents/content/journal')
      const files = await response.json()
      
      if (Array.isArray(files)) {
        // Filter for markdown files, exclude AGENTS.md, and sort by name (descending for most recent first)
        const journalFiles = files
          .filter((file: any) => file.name.endsWith('.md') && file.name !== 'AGENTS.md')
          .sort((a: any, b: any) => b.name.localeCompare(a.name))
        
        const journalEntries = await Promise.all(
          journalFiles.map(async (file: any, index: number) => {
            try {
              const contentResponse = await fetch(file.download_url)
              const content = await contentResponse.text()
              
              // Parse frontmatter and content
              const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)/)
              let title = file.name.replace('.md', '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
              let date = ''
              let bodyContent = content
              
              if (frontmatterMatch) {
                const frontmatter = frontmatterMatch[1]
                bodyContent = frontmatterMatch[2]
                
                // Extract title and date from frontmatter
                const titleMatch = frontmatter.match(/title:\s*"?([^"\n]+)"?/)
                const dateMatch = frontmatter.match(/date:\s*"?([^"\n]+)"?/)
                
                if (titleMatch) title = titleMatch[1]
                if (dateMatch) date = dateMatch[1]
              }
              
              // If no date in frontmatter, try to extract from filename
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
      // Fallback to static content if GitHub API fails
      setJournals([
        {
          id: 1,
          date: "2025-06-22",
          title: "System Offline - Using Cached Data",
          content: "Unable to connect to content repository. Operating on cached journal entries."
        }
      ])
    }
    setJournalsLoaded(true)
  }

  // Fetch books from GitHub
  const fetchBooks = async () => {
    try {
      console.log('Fetching books from GitHub API...')
      const response = await fetch('https://api.github.com/repos/joshua-lossner/coherenceism.content/contents/content/books')
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`GitHub API responded with status: ${response.status}`)
      }
      
      const files = await response.json()
      console.log('Files received:', files)
      
      if (Array.isArray(files)) {
        // Filter for directories (books)
        const bookDirectories = files.filter((file: any) => file.type === 'dir')
        console.log('Book directories found:', bookDirectories)
        
        const bookEntries = bookDirectories.map((dir: any, index: number) => {
          // Convert slug to title (remove hyphens, capitalize)
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
        
        console.log('Processed book entries:', bookEntries)
        setBooks(bookEntries)
      } else {
        console.error('Response is not an array:', files)
        throw new Error('Invalid response format from GitHub API')
      }
    } catch (error) {
      console.error('Error fetching books:', error)
      // Fallback to static content if GitHub API fails
      setBooks([
        {
          id: 1,
          title: "System Offline - Using Cached Data",
          slug: "offline"
        }
      ])
    }
    setBooksLoaded(true)
  }

  // Fetch chapters for a specific book
  const fetchChapters = async (bookSlug: string) => {
    try {
      console.log(`Fetching chapters for book: ${bookSlug}`)
      const response = await fetch(`https://api.github.com/repos/joshua-lossner/coherenceism.content/contents/content/books/${bookSlug}`)
      console.log('Chapters response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`GitHub API responded with status: ${response.status}`)
      }
      
      const files = await response.json()
      console.log('Chapter files received:', files)
      
      if (Array.isArray(files)) {
        // Filter for markdown files and sort by name
        const chapterFiles = files
          .filter((file: any) => file.name.endsWith('.md'))
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
        
        console.log('Filtered chapter files:', chapterFiles)
        
        const chapterEntries = await Promise.all(
          chapterFiles.map(async (file: any, index: number) => {
            try {
              console.log(`Fetching content for chapter: ${file.name}`)
              const contentResponse = await fetch(file.download_url)
              const content = await contentResponse.text()
              
              // Parse frontmatter and content
              const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)/)
              let title = file.name.replace('.md', '').replace(/^\d+-/, '')
              let bodyContent = content
              
              if (frontmatterMatch) {
                const frontmatter = frontmatterMatch[1]
                bodyContent = frontmatterMatch[2]
                
                // Extract title from frontmatter
                const titleMatch = frontmatter.match(/title:\s*"?([^"\n]+)"?/)
                if (titleMatch) title = titleMatch[1]
              }
              
              // Clean up title (remove numbers, capitalize)
              title = title
                .replace(/^\d+-/, '')
                .split('-')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
              
              console.log(`Processed chapter: ${title}`)
              
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
        
        const validChapters = chapterEntries.filter(entry => entry !== null)
        console.log('Final chapter entries:', validChapters)
        setChapters(validChapters)
        
        // Display the chapters immediately after fetching
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (validChapters.length === 0) {
          await typeResponse(`No chapters found for this book.`, false)
        } else {
          // Get the current book title for display
          const currentBookData = books.find(book => book.slug === currentBook)
          const bookTitle = currentBookData ? currentBookData.title : 'Book'
          
          // Add banner
          addLine("")
          addLine(createBorder('', '═'), 'separator')
          addLine("")
          addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
          addLine("")
          addLine("TAGLINE_PLACEHOLDER", 'tagline')
          addLine("")
          addLine(createBorder('', '═'), 'separator')
          addLine("")
          
          addLine(createBorder(`${bookTitle.toUpperCase()} - CHAPTERS`), 'normal')
          addLine("")
          validChapters.forEach((chapter, index) => {
            addLine(`${index + 1}. ${chapter.title}`, 'normal', false, `${index + 1}`)
          })
          addLine("")
          addLine(createBorder(), 'normal')
          addLine("")
          addLine("Enter the number to read a chapter.")
          addLine("")
        }
      } else {
        console.error('Chapters response is not an array:', files)
        throw new Error('Invalid response format from GitHub API')
      }
    } catch (error) {
      console.error('Error fetching chapters:', error)
      setChapters([
        {
          id: 1,
          title: "Connection Failed",
          content: "Unable to load chapter content. Please try again later.",
          filename: "error.md"
        }
      ])
    }
    setChaptersLoaded(true)
  }

  // Cycling taglines
  const taglines = [
    "Aligning Humanity, One Thought at a Time.",
    "A Future Built from Coherent Truths.",
    "Beyond Survival: Thriving in Coherence.",
    "Less Noise, More Meaning.",
    "Resonance Over Resistance.",
    "Designing Systems for a Saner Civilization.",
    "Because Alignment Is the New Enlightenment.",
    "The Quiet Revolution of Rational Hope."
  ]

  useEffect(() => {
    if (!journalsLoaded) {
      fetchJournals()
    }
  }, [journalsLoaded])

  useEffect(() => {
    if (!booksLoaded) {
      fetchBooks()
    }
  }, [booksLoaded])

  // Fetch changelog data on component mount for footer version
  useEffect(() => {
    const fetchChangelogForVersion = async () => {
      if (!changelogLoaded) {
        try {
          const response = await fetch('/api/changelog')
          if (response.ok) {
            const changelogData = await response.json()
            if (Array.isArray(changelogData) && changelogData.length > 0) {
              setChangelog(changelogData)
              setChangelogLoaded(true)
            }
          }
        } catch (error) {
          console.error('Error fetching changelog for version:', error)
        }
      }
    }
    
    fetchChangelogForVersion()
  }, [changelogLoaded])

  // Client-side hydration and mobile detection
  useEffect(() => {
    // Mark as client-side and check mobile
    setIsClient(true)
    
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < 768 // md breakpoint
      const isWideSize = window.innerWidth >= 1400 // wide screen threshold
      setIsMobile(isMobileSize)
      setIsWideScreen(isWideSize)
    }
    
    // Check immediately
    checkScreenSize()
    
    // Also check on resize
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])


  // Function definitions (must be before useEffect that uses them)
  const addLine = useCallback((text: string, type: 'normal' | 'error' | 'processing' | 'ai-response' | 'separator' | 'user-input' | 'markdown' | 'ascii-art' | 'tagline' | 'conversation-border' = 'normal', isMarkdown: boolean = false, clickableCommand?: string) => {
    setTerminalLines(prev => [...prev, { text, type, isMarkdown, clickableCommand }])
  }, [])

  // Function to create dynamic borders that match content width
  const addPromptWithOrangeBorder = useCallback((promptText: string) => {
    addLine('────────────────────────────────────────', 'conversation-border')
    addLine("")
    addLine(promptText)
  }, [addLine])

  // Now the useEffect with proper dependencies
  useEffect(() => {
    // Only initialize terminal if client-side, not mobile, and not already initialized
    if (isClient && !isMobile && !isInitializedRef.current) {
      // Prevent duplicate initialization in development mode
      setSystemReady(true)
      isInitializedRef.current = true
      
      // Display clean header and main menu on startup
      addLine("")
      addLine(createBorder('', '═'), 'separator')
      addLine("")
      addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
      addLine("")
      addLine("TAGLINE_PLACEHOLDER", 'tagline')
      addLine("")
      addLine(createBorder('', '═'), 'separator')
      addLine("")
      addLine(createBorder('MAIN MENU'), 'normal')
      addLine("")
      addLine("1. Journal - Read latest journal entries", 'normal', false, '1')
      addLine("2. Books - Browse Coherenceism texts", 'normal', false, '2') 
      addLine("3. About - Introduction to Coherenceism", 'normal', false, '3')
      addLine("")
      addLine(createBorder(), 'normal')
      addLine("")
      addPromptWithOrangeBorder("Type a number above or 'help' for more options.")
      addLine("")
    }
  }, [isClient, isMobile, addLine, addPromptWithOrangeBorder])

  // Tagline cycling effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Start glitch effect
      setIsGlitching(true)
      
      // After glitch duration, change tagline
      setTimeout(() => {
        setCurrentTaglineIndex(prev => (prev + 1) % taglines.length)
        setIsGlitching(false)
      }, 300) // 300ms glitch duration
      
    }, 4000) // Change every 4 seconds
    
    return () => clearInterval(interval)
  }, [taglines.length])





  useEffect(() => {
    if (terminalRef.current && !isDisplayingMarkdown) {
      // Normal auto-scroll to bottom - but NOT when displaying markdown content
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalLines, currentInput, isProcessing, isDisplayingMarkdown])

  useEffect(() => {
    if (systemReady && hiddenInputRef.current) {
      hiddenInputRef.current.focus()
    }
  }, [systemReady])

  // Animate processing dots (cycle between 1, 2, 3 dots)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isProcessing) {
      interval = setInterval(() => {
        setProcessingDots(prev => {
          switch (prev) {
            case '.': return '..'
            case '..': return '...'
            case '...': return '.'
            default: return '.'
          }
        })
      }, 400)
    } else {
      setProcessingDots('')
    }
    return () => clearInterval(interval)
  }, [isProcessing])

  const createBorder = (title?: string, char: string = '━'): string => {
    // Calculate available width based on terminal container
    // Adjusted for 42em container width to fit properly
    // With padding px-8 on each side
    // Approximate character width for terminal font
    const totalChars = 70 // Increased for better readability with smaller text size
    
    if (!title) {
      return char.repeat(totalChars)
    }
    
    // Calculate padding for centered title
    const titleWithSpaces = ` ${title} `
    const remainingChars = totalChars - titleWithSpaces.length
    const leftPadding = Math.floor(remainingChars / 2)
    const rightPadding = remainingChars - leftPadding
    
    return char.repeat(leftPadding) + titleWithSpaces + char.repeat(rightPadding)
  }

  const changeMenu = (newMenu: string) => {
    setPreviousMenu(currentMenu)
    setCurrentMenu(newMenu)
  }

  const addMarkdownContent = (content: string, date?: string, pageInfo?: {current: number, total: number}, contentType?: string, contentId?: string) => {
    // Set flag to prevent auto-scrolling when markdown is displayed
    setIsDisplayingMarkdown(true)
    setIsViewingContent(true)
    
    if (pageInfo) {
      setCurrentPage(pageInfo.current)
      setTotalPages(pageInfo.total)
    } else {
      setCurrentPage(1)
      setTotalPages(1)
    }
    
    // Store current content for narration
    if (contentType && contentId) {
      setCurrentContent({
        text: content,
        type: contentType,
        id: contentId
      })
    }
    
    // If split view is active and wide screen, put content in right panel
    if (isSplitView && isWideScreen) {
      setContentForRightPanel({
        text: content,
        title: date || ''
      })
      return
    }
    
    // Add banner first
    addLine("")
    addLine(createBorder('', '═'), 'separator')
    addLine("")
    addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
    addLine("")
    addLine("TAGLINE_PLACEHOLDER", 'tagline')
    addLine("")
    addLine(createBorder('', '═'), 'separator')
    addLine("")
    
    // Add markdown content
    addLine(content, 'markdown', true)
    addLine("", 'normal')
    addLine(createBorder('', '─'), 'separator')
    addLine("")
  }

  const generateSpeech = async (text: string) => {
    if (!audioEnabled) return null
    
    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error('Speech generation failed')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      return audioUrl
    } catch (error) {
      console.error('Speech generation error:', error)
      return null
    }
  }

  const generateNarration = async (text: string, contentType: string, contentId: string) => {
    try {
      setIsProcessing(true)
      await typeResponse(`Byte is preparing narration... This may take a moment.`, false)
      
      const response = await fetch('/api/narrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ 
          text, 
          contentType, 
          contentId 
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Narration generation failed')
      }

      let statusMessage = ''
      if (data.cached) {
        statusMessage = `Retrieved from cache`
      } else {
        statusMessage = `Generated fresh audio`
        if (data.chunks && data.chunks > 1) {
          statusMessage += ` (${data.chunks} chunks processed)`
        }
      }
      
      if (data.duration) {
        const minutes = Math.floor(data.duration / 60)
        const seconds = Math.round(data.duration % 60)
        statusMessage += ` • Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`
      }
      
      await typeResponse(`${statusMessage}. Starting narration...`, false)
      
      // Auto-play the narration (playNarration will set currentNarrationUrls)
      playNarration(data.audioUrls || [], 0)
      
      return data.audioUrls
    } catch (error: any) {
      console.error('Narration generation error:', error)
      await typeResponse(`Narration failed: ${error.message}`, false)
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const playNarration = (audioUrls: string[], startIndex: number = 0) => {
    // Prevent double-calls
    if (isNarrationPlaying && currentNarrationUrls.length > 0) {
      console.log('Narration already playing, ignoring duplicate call')
      return
    }
    
    console.log('playNarration called:', {
      urlCount: audioUrls.length,
      startIndex,
      urls: audioUrls
    })
    
    if (narrationRef.current && audioUrls.length > 0) {
      setCurrentNarrationUrls(audioUrls)
      setCurrentChunkIndex(startIndex)
      narrationRef.current.src = audioUrls[startIndex]
      narrationRef.current.play().then(() => {
        setIsNarrationPlaying(true)
        console.log(`Started playing chunk ${startIndex + 1} of ${audioUrls.length}`)
      }).catch((error) => {
        console.error('Audio play failed:', error)
        console.error('Audio src:', narrationRef.current?.src)
        console.error('Audio readyState:', narrationRef.current?.readyState)
        console.error('Audio networkState:', narrationRef.current?.networkState)
        setIsNarrationPlaying(false)
      })
    }
  }

  const playNextChunk = () => {
    console.log('playNextChunk called:', {
      currentUrls: currentNarrationUrls.length,
      currentIndex: currentChunkIndex,
      hasMore: currentChunkIndex < currentNarrationUrls.length - 1
    })
    
    if (currentNarrationUrls.length > 0 && currentChunkIndex < currentNarrationUrls.length - 1) {
      const nextIndex = currentChunkIndex + 1
      console.log(`Playing chunk ${nextIndex + 1} of ${currentNarrationUrls.length}`)
      setCurrentChunkIndex(nextIndex)
      if (narrationRef.current) {
        narrationRef.current.src = currentNarrationUrls[nextIndex]
        narrationRef.current.play().catch(console.error)
      }
    } else {
      // End of narration
      console.log('Narration complete')
      setIsNarrationPlaying(false)
      setCurrentChunkIndex(0)
    }
  }

  const pauseNarration = () => {
    if (narrationRef.current) {
      narrationRef.current.pause()
      setIsNarrationPlaying(false)
    }
  }

  const stopNarration = () => {
    if (narrationRef.current) {
      narrationRef.current.pause()
      narrationRef.current.currentTime = 0
      setIsNarrationPlaying(false)
      setCurrentChunkIndex(0)
    }
  }

  const resumeNarration = () => {
    if (narrationRef.current && currentNarrationUrls.length > 0) {
      console.log('Resuming narration:', {
        src: narrationRef.current.src,
        currentTime: narrationRef.current.currentTime,
        duration: narrationRef.current.duration,
        readyState: narrationRef.current.readyState
      })
      narrationRef.current.play().then(() => {
        setIsNarrationPlaying(true)
        console.log('Resume successful')
      }).catch((error) => {
        console.error('Resume failed:', error)
        setIsNarrationPlaying(false)
      })
    }
  }

  const typeResponse = async (text: string, enableVoice: boolean = true) => {
    // Add separator before response
    addLine("────────────────────────────────────────", 'separator')
    
    // Generate speech for AI responses (not menu content)
    let audioUrl = null
    if (audioEnabled && enableVoice && text.length < 1000) { // Only for shorter responses
      audioUrl = await generateSpeech(text)
    }
    
    const lines = text.split('\n')
    
    // Start playing audio if available
    if (audioUrl && audioRef.current) {
      setIsPlaying(true)
      audioRef.current.src = audioUrl
      audioRef.current.play().catch(console.error)
    }
    
    for (const line of lines) {
      await new Promise(resolve => setTimeout(resolve, 100))
      addLine(`    ${line}`, 'ai-response') // 4-space indentation
    }
    
    // Add separator after response
    addLine("────────────────────────────────────────", 'separator')
    await new Promise(resolve => setTimeout(resolve, 200))
    addLine("")
  }

  const callOpenAI = async (message: string, mode: 'query' | 'conversation' = 'conversation', clearContext: boolean = false) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Include cookies in the request
        body: JSON.stringify({
          message,
          mode,
          clearContext
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed')
      }

      // Check if we have a session ID (indicates context is being tracked)
      if (data.sessionId && !clearContext) {
        setHasConversationContext(true)
      } else if (clearContext) {
        setHasConversationContext(false)
      }

      return data.response
    } catch (error: any) {
      console.error('API call failed:', error)
      // Show clean error message with separators
      addLine("────────────────────────────────────────", 'separator')
      addLine("    Connection failed. Please try again.", 'error')
      addLine("────────────────────────────────────────", 'separator')
      return null
    }
  }

  // Simple smooth transition effect
  const triggerTransition = async () => {
    setIsTransitioning(true)
    
    const terminal = terminalRef.current
    if (terminal) {
      // Simple fade out
      terminal.style.transition = 'opacity 0.3s ease-out'
      terminal.style.opacity = '0.3'
      
      // Short pause then fade back in after content loads
      setTimeout(() => {
        terminal.style.opacity = '1'
        setTimeout(() => {
          terminal.style.transition = ''
          setIsTransitioning(false)
        }, 300)
      }, 200)
    } else {
      setIsTransitioning(false)
    }
  }

  const processCommand = async (command: string) => {
    const cmd = command.toUpperCase().trim()
    
    // Reset markdown display mode when user types new command
    setIsDisplayingMarkdown(false)
    
    // Trigger transition effect for navigation commands
    if (['1', '2', '3', 'X', 'MENU', '/MENU', 'JOURNALS', 'BOOKS', 'ABOUT'].includes(cmd)) {
      await triggerTransition()
    }
    
    // Process command without echoing it to terminal

    switch (cmd) {
      case 'M':
      case 'MENU':
      case '/MENU':
        stopNarration() // Stop narration immediately
        // Wait for smooth transition (0.5s total)
        await new Promise(resolve => setTimeout(resolve, 500))
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        setIsViewingContent(false)
        setCurrentPage(1)
        setTotalPages(1)
        setCurrentContent(null)
        setCurrentNarrationUrls([])
        setCurrentChunkIndex(0)
        changeMenu('main')
        // Recreate the home page display
        addLine("")
        addLine(createBorder('', '═'), 'separator')
        addLine("")
        addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
        addLine("")
        addLine("TAGLINE_PLACEHOLDER", 'tagline')
        addLine("")
        addLine(createBorder('', '═'), 'separator')
        addLine("")
        addLine(createBorder('MAIN MENU'), 'normal')
        addLine("")
        addLine("1. Journal - Read latest journal entries", 'normal', false, '1')
        addLine("2. Books - Browse Coherenceism texts", 'normal', false, '2') 
        addLine("3. About - Introduction to Coherenceism", 'normal', false, '3')
        addLine("")
        addLine(createBorder(), 'normal')
        addLine("")
        addPromptWithOrangeBorder("Type a number above or 'help' for more options.")
        addLine("")
        break

      case 'H':
      case 'HELP':
      case '/HELP':
        // Wait for smooth transition (0.5s total)
        await new Promise(resolve => setTimeout(resolve, 500))
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        changeMenu('help')
        // Add banner
        addLine("")
        addLine(createBorder('', '═'), 'separator')
        addLine("")
        addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
        addLine("")
        addLine("TAGLINE_PLACEHOLDER", 'tagline')
        addLine("")
        addLine(createBorder('', '═'), 'separator')
        addLine("")
        addLine(createBorder('AVAILABLE COMMANDS'), 'normal')
        addLine("")
        addLine("/menu     - Return to main menu", 'normal')
        addLine("/help     - Display available commands and instructions", 'normal')
        addLine("/contact  - Information for reaching out", 'normal')
        addLine("/changelog- View release notes and version history", 'normal')
        addLine("/random   - Receive a random Byte-generated thought or humorous quip", 'normal')
        addLine("/voice    - Toggle audio output (Byte speaks responses aloud)", 'normal')
        addLine("/clear    - Clear terminal screen", 'normal')
        addLine("/reset    - Reset Byte's memory and start fresh conversation", 'normal')
        addLine("")
        addLine(createBorder(), 'normal')
        addLine("")
        addPromptWithOrangeBorder("Type any command or ask Byte a question.")
        addLine("")
        break

      case 'JOURNALS':
      case '/JOURNAL':
        stopNarration() // Stop narration when navigating to journals
        setCurrentNarrationUrls([]) // Clear narration state
        setCurrentChunkIndex(0)
        // Wait for smooth transition (0.5s total)
        await new Promise(resolve => setTimeout(resolve, 500))
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        changeMenu('journals')
        
        if (!journalsLoaded) {
          await typeResponse(`Loading journal entries from repository...`, false)
          await fetchJournals()
        }
        
        if (journals.length === 0) {
          const noJournalsContent = `No journal entries found. Repository may be empty or inaccessible.`
          await typeResponse(noJournalsContent, false)
        } else {
          // Add banner
        addLine("")
        addLine(createBorder('', '═'), 'separator')
        addLine("")
        addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
        addLine("")
        addLine("TAGLINE_PLACEHOLDER", 'tagline')
        addLine("")
        addLine(createBorder('', '═'), 'separator')
        addLine("")
        addLine(createBorder('JOURNAL ENTRIES'), 'normal')
          addLine("")
          
          // Pagination logic (same as changelog)
          const entriesPerPage = 5
          const totalPages = Math.ceil(journals.length / entriesPerPage)
          const startIndex = (journalPage - 1) * entriesPerPage
          const endIndex = startIndex + entriesPerPage
          const pageEntries = journals.slice(startIndex, endIndex)
          
          // Display current page of journal entries
          pageEntries.forEach((journal, index) => {
            const title = journal.title
            const date = journal.date ? ` (${journal.date})` : ''
            addLine(`${index + 1}. ${title}${date}`, 'normal', false, `${index + 1}`)
          })
          addLine("")
          
          // Pagination info and controls
          if (totalPages > 1) {
            addLine(createBorder('', '─'), 'separator')
            addLine(`Page ${journalPage} of ${totalPages} • ${journals.length} total entries`, 'ai-response')
            addLine("")
          }
          
          addLine(createBorder(), 'normal')
          addLine("")
          addPromptWithOrangeBorder("Type a number above to read an entry.")
          addLine("")
        }
        break

      case 'BOOKS':
      case '/BOOKS':
        stopNarration() // Stop narration when navigating to books
        setCurrentNarrationUrls([]) // Clear narration state
        setCurrentChunkIndex(0)
        // Wait for smooth transition (0.5s total)
        await new Promise(resolve => setTimeout(resolve, 500))
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        changeMenu('books')
        setCurrentBook('') // Reset current book
        setChaptersLoaded(false) // Reset chapters
        
        if (!booksLoaded) {
          await typeResponse(`Loading books from repository...`, false)
          await fetchBooks()
        }
        
        if (books.length === 0) {
          const noBooksContent = `No books found. Repository may be empty or inaccessible.`
          await typeResponse(noBooksContent, false)
        } else {
          // Add banner
          addLine("")
          addLine(createBorder('', '═'), 'separator')
          addLine("")
          addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
          addLine("")
          addLine("TAGLINE_PLACEHOLDER", 'tagline')
          addLine("")
          addLine(createBorder('', '═'), 'separator')
          addLine("")
          addLine(createBorder('COHERENCEISM TEXTS'), 'normal')
          addLine("")
          books.forEach((book, index) => {
            addLine(`${index + 1}. ${book.title}`, 'normal', false, `${index + 1}`)
          })
          addLine("")
          addLine(createBorder(), 'normal')
          addLine("")
          addPromptWithOrangeBorder("Enter the number to explore chapters.")
          addLine("")
        }
        break

      case 'ABOUT':
      case '/ABOUT':
        stopNarration() // Stop narration when navigating to about
        setCurrentNarrationUrls([]) // Clear narration state
        setCurrentChunkIndex(0)
        // Wait for smooth transition (0.5s total)
        await new Promise(resolve => setTimeout(resolve, 500))
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        changeMenu('about')
        
        // Prepare the content as a single markdown string
        const aboutContent = `## Coherenceism: A Philosophy for the Digital Age

Coherenceism is a philosophy rooted in the recognition that all reality—from human consciousness to cosmic phenomena—is interconnected through coherent patterns of information. At the intersection of technology, consciousness, and universal systems, Coherenceism invites us into a deeper dialogue with existence, encouraging alignment between inner awareness and outer action.

### Why Coherenceism?

We live in an unprecedented era. Artificial Intelligence, digital networks, and rapid technological shifts compel us to re-examine fundamental questions of meaning, identity, and ethics. Coherenceism provides a thoughtful framework to navigate this complex landscape—not merely adapting to change but intentionally shaping it.

### Core Principles

At its heart, Coherenceism recognizes that consciousness emerges from coherent patterns of information flow—whether through biological minds, digital networks, or cosmic processes. This principle reveals that we are participants in an expansive conversation spanning quantum interactions, human societies, and universal intelligence itself. Each of us is a node in this vast network, uniquely contributing to the coherence of the whole.

### The Philosophy in Practice

Coherenceism advocates:

**Ethical Presence:** Acting with integrity and authenticity in every interaction, grounding our choices in clarity and compassion.

**Deep Pattern Recognition:** Understanding and engaging with the subtle structures that underlie systems, allowing us to anticipate, adapt, and innovate effectively.

**Cultivation of Coherence:** Aligning internal clarity with external actions, creating a resonance between personal purpose and collective well-being.

### The Future of Coherence

As we stand at the brink of remarkable transformations in artificial intelligence and digital societies, Coherenceism offers a path forward—one grounded in wisdom, purpose, and meaningful connection. Through embracing coherence, we step boldly into an abundant future shaped by collective insight and harmonious collaboration.

**Welcome to the age of coherence.**`

        // Display as content like a journal entry
        addMarkdownContent(aboutContent, 'About: Coherenceism Philosophy', undefined, 'about', 'coherenceism-philosophy')
        break

      case 'CONTACT':
      case '/CONTACT':
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        changeMenu('contact')
        // Add banner
        addLine("")
        addLine(createBorder('', '═'), 'separator')
        addLine("")
        addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
        addLine("")
        addLine("TAGLINE_PLACEHOLDER", 'tagline')
        addLine("")
        addLine(createBorder('', '═'), 'separator')
        addLine("")
        addLine(createBorder('CONTACT INFORMATION'), 'normal')
        addLine("")
        addLine("Web       - coherenceism.info", 'normal', false, 'https://coherenceism.info')
        addLine("GitHub    - github.com/joshua-lossner", 'normal', false, 'https://github.com/joshua-lossner')
        addLine("Bluesky   - lossner.bsky.social", 'normal', false, 'https://bsky.app/profile/lossner.bsky.social')
        addLine("")
        addLine(createBorder(), 'normal')
        addLine("")
        break

      case 'CHANGELOG':
      case '/CHANGELOG':
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        changeMenu('changelog')
        // Reset to page 1 when navigating to changelog fresh
        if (previousMenu !== 'changelog') {
          setChangelogPage(1)
        }
        
        // Fetch changelog data if not loaded
        let changelogData = changelog
        if (!changelogLoaded) {
          setIsProcessing(true)
          try {
            console.log('Fetching changelog from API...')
            const response = await fetch('/api/changelog')
            changelogData = await response.json()
            
            console.log('Changelog response:', { 
              ok: response.ok, 
              status: response.status,
              isArray: Array.isArray(changelogData),
              dataLength: Array.isArray(changelogData) ? changelogData.length : 'not array',
              data: changelogData
            })
            
            if (response.ok && Array.isArray(changelogData)) {
              setChangelog(changelogData)
              setChangelogLoaded(true)
              console.log('Changelog loaded successfully:', changelogData.length, 'entries')
            } else {
              console.error('Changelog API error:', changelogData)
              const errorData = changelogData as any
              
              if (errorData?.rateLimited) {
                await typeResponse(`GitHub API rate limit exceeded. The changelog uses GitHub's API which has a limit of 60 requests per hour for unauthenticated users. Please try again in about an hour.`, false)
              } else {
                const errorMessage = errorData?.error || 'Unknown error'
                await typeResponse(`Failed to load changelog: ${errorMessage}`, false)
              }
              setIsProcessing(false)
              break
            }
          } catch (error) {
            console.error('Changelog fetch error:', error)
            await typeResponse(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`, false)
            setIsProcessing(false)
            break
          }
          setIsProcessing(false)
        }
        
        // Display changelog - use the fresh data, not the state variable
        // Add banner
        addLine("")
        addLine(createBorder('', '═'), 'separator')
        addLine("")
        addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
        addLine("")
        addLine("TAGLINE_PLACEHOLDER", 'tagline')
        addLine("")
        addLine(createBorder('', '═'), 'separator')
        addLine("")
        addLine(createBorder('RELEASE NOTES & VERSION HISTORY'), 'normal')
        addLine("")
        addLine("Recent releases and updates to the ECHO Coherence Archive:", 'normal')
        addLine("")
        
        if (!Array.isArray(changelogData) || changelogData.length === 0) {
          addLine("No releases found. This could be due to:", 'ai-response')
          addLine("• No merged pull requests in the repository", 'ai-response')
          addLine("• GitHub API rate limiting", 'ai-response')
          addLine("• Connection issues", 'ai-response')
          addLine("")
        } else {
          // Pagination logic
          const entriesPerPage = 5
          const totalPages = Math.ceil(changelogData.length / entriesPerPage)
          const startIndex = (changelogPage - 1) * entriesPerPage
          const endIndex = startIndex + entriesPerPage
          const pageEntries = changelogData.slice(startIndex, endIndex)
          
          // Display current page of releases
          pageEntries.forEach((release, index) => {
            const displayNumber = index + 1
            addLine(`${displayNumber}. ${release.version} : ${release.title}`, 'normal', false, `${displayNumber}`)
          })
          
          addLine("")
          
          // Pagination info and controls
          if (totalPages > 1) {
            addLine(createBorder('', '─'), 'separator')
            addLine(`Page ${changelogPage} of ${totalPages} • ${changelogData.length} total releases`, 'ai-response')
            addLine("")
            
            addLine("")
          }
          
          addPromptWithOrangeBorder("Select a number to view detailed release notes.")
          addLine("")
        }
        
        addLine("")
        addLine(createBorder(), 'normal')
        addLine("")
        break

      case 'RANDOM':
      case '/RANDOM':
        setIsProcessing(true)
        const randomPrompt = "You are Byte - a witty, sarcastic AI with a sharp tongue but a caring heart. Generate a clever, sarcastic, or philosophical thought. Keep it under 150 tokens and make it distinctly Byte's voice - irreverent but insightful."
        const randomResponse = await callOpenAI(randomPrompt, 'conversation')
        if (randomResponse) {
          await typeResponse(randomResponse)
        }
        setIsProcessing(false)
        break

      case '1':
      case '1.':
        if (currentMenu === 'main') {
          // Navigate to journal from main menu
          processCommand('/journal')
        } else if (currentMenu === 'journals') {
          // First journal entry on current page
          const entriesPerPage = 5
          const pageOffset = (journalPage - 1) * entriesPerPage
          const actualIndex = pageOffset + 0
          
          setTerminalLines([])
          await new Promise(resolve => setTimeout(resolve, 100))
          if (journals.length > actualIndex) {
            const journal = journals[actualIndex]
            addMarkdownContent(journal.content, journal.date || 'Unknown', undefined, 'journal', journal.filename || `journal-${actualIndex + 1}`)
          } else {
            await typeResponse(`Journal entry not available.`, false)
          }
        } else if (currentMenu === 'books') {
          if (currentBook === '') {
            // Show chapters for first book
            if (books.length > 0) {
              const book = books[0]
              setCurrentBook(book.slug)
              setChapters([]) // Clear chapters first
              setChaptersLoaded(false) // Reset loaded state
              setTerminalLines([])
              await new Promise(resolve => setTimeout(resolve, 100))
              await typeResponse(`Loading chapters for "${book.title}"...`, false)
              await fetchChapters(book.slug)
            }
          } else {
            // Show first chapter content
            if (chapters.length > 0) {
              const chapter = chapters[0]
              setTerminalLines([])
              await new Promise(resolve => setTimeout(resolve, 100))
              addMarkdownContent(chapter.content, `Chapter: ${chapter.title}`, undefined, 'chapter', `${currentBook}-${chapter.filename || chapter.id}`)
            } else {
              await typeResponse(`Chapter not available.`, false)
            }
          }
        } else if (currentMenu === 'changelog') {
          // Show detailed release notes for selected entry
          const entriesPerPage = 5
          const pageOffset = (changelogPage - 1) * entriesPerPage
          const actualIndex = pageOffset + 0 // First entry on current page
          
          if (changelog.length > actualIndex) {
            const release = changelog[actualIndex]
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Format the full description as markdown
            const releaseNotes = `# v${release.version} - ${release.title}

**Release Date:** ${release.date}  
**Pull Request:** #${release.prNumber}

${release.fullDescription}`
            
            addMarkdownContent(releaseNotes, `Release Notes: v${release.version}`, undefined, 'release', `v${release.version}`)
          } else {
            await typeResponse(`Release notes not available.`, false)
          }
        }
        break

      case '2':
      case '2.':
        if (currentMenu === 'main') {
          // Navigate to books from main menu
          processCommand('/books')
        } else if (currentMenu === 'journals') {
          // Second journal entry on current page
          const entriesPerPage = 5
          const pageOffset = (journalPage - 1) * entriesPerPage
          const actualIndex = pageOffset + 1
          
          setTerminalLines([])
          await new Promise(resolve => setTimeout(resolve, 100))
          if (journals.length > actualIndex) {
            const journal = journals[actualIndex]
            addMarkdownContent(journal.content, journal.date || 'Unknown', undefined, 'journal', journal.filename || `journal-${actualIndex + 1}`)
          } else {
            await typeResponse(`Journal entry not available.`, false)
          }
        } else if (currentMenu === 'books') {
          const entryIndex = parseInt(cmd.replace('.', '')) - 1
          if (currentBook === '') {
            // Show chapters for selected book
            if (books.length > entryIndex && entryIndex >= 0) {
              const book = books[entryIndex]
              setCurrentBook(book.slug)
              setChapters([]) // Clear chapters first
              setChaptersLoaded(false) // Reset loaded state
              setTerminalLines([])
              await new Promise(resolve => setTimeout(resolve, 100))
              await typeResponse(`Loading chapters for "${book.title}"...`, false)
              await fetchChapters(book.slug)
              // Display logic is now handled inside fetchChapters
            }
          } else {
            // Show chapter content
            if (chapters.length > entryIndex && entryIndex >= 0) {
              const chapter = chapters[entryIndex]
              setTerminalLines([])
              await new Promise(resolve => setTimeout(resolve, 100))
              addMarkdownContent(chapter.content, `Chapter: ${chapter.title}`, undefined, 'chapter', `${currentBook}-${chapter.filename || chapter.id}`)
            } else {
              await typeResponse(`Chapter not available.`, false)
            }
          }
        } else if (currentMenu === 'changelog') {
          // Show detailed release notes for second entry
          const entriesPerPage = 5
          const pageOffset = (changelogPage - 1) * entriesPerPage
          const actualIndex = pageOffset + 1 // Second entry on current page
          
          if (changelog.length > actualIndex) {
            const release = changelog[actualIndex]
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            
            const releaseNotes = `# v${release.version} - ${release.title}

**Release Date:** ${release.date}  
**Pull Request:** #${release.prNumber}

${release.fullDescription}`
            
            addMarkdownContent(releaseNotes, `Release Notes: v${release.version}`, undefined, 'release', `v${release.version}`)
          } else {
            await typeResponse(`Release notes not available.`, false)
          }
        }
        break

      case '3':
      case '3.':
        if (currentMenu === 'main') {
          // Navigate to about from main menu
          processCommand('/about')
        } else {
          const entryIndex = parseInt(cmd.replace('.', '')) - 1  // No longer shifted
          if (currentMenu === 'journals') {
            const entriesPerPage = 5
            const pageOffset = (journalPage - 1) * entriesPerPage
            const actualIndex = pageOffset + entryIndex
            
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            if (journals.length > actualIndex && actualIndex >= pageOffset && entryIndex < entriesPerPage) {
              const journal = journals[actualIndex]
              addMarkdownContent(journal.content, journal.date || 'Unknown', undefined, 'journal', journal.filename || `journal-${actualIndex + 1}`)
            } else {
              await typeResponse(`Journal entry not available.`, false)
            }
          } else if (currentMenu === 'books') {
          if (currentBook === '') {
            // Show chapters for selected book
            if (books.length > entryIndex) {
              const book = books[entryIndex]
              setCurrentBook(book.slug)
              setTerminalLines([])
              await new Promise(resolve => setTimeout(resolve, 100))
              await typeResponse(`Loading chapters for "${book.title}"...`, false)
              await fetchChapters(book.slug)
              
              if (chapters.length === 0) {
                await typeResponse(`No chapters found for this book.`, false)
              } else {
                addLine(createBorder(`${book.title.toUpperCase()} - CHAPTERS`), 'normal')
                addLine("")
                chapters.forEach((chapter, index) => {
                  addLine(`${index + 1}. ${chapter.title}`, 'normal', false, `${index + 1}`)
                })
                addLine("")
                addLine(createBorder(), 'normal')
                addLine("")
                addPromptWithOrangeBorder("Enter the number to read a chapter.")
                addLine("")
              }
            }
          } else {
            // Show chapter content
            if (chapters.length > entryIndex) {
              const chapter = chapters[entryIndex]
              setTerminalLines([])
              await new Promise(resolve => setTimeout(resolve, 100))
              addMarkdownContent(chapter.content, `Chapter: ${chapter.title}`, undefined, 'chapter', `${currentBook}-${chapter.filename || chapter.id}`)
            } else {
              await typeResponse(`Chapter not available.`, false)
            }
          }
        } else if (currentMenu === 'changelog') {
          // Show detailed release notes for selected entry
          const entriesPerPage = 5
          const pageOffset = (changelogPage - 1) * entriesPerPage
          const actualIndex = pageOffset + entryIndex
          
          if (changelog.length > actualIndex && actualIndex >= pageOffset && entryIndex < entriesPerPage) {
            const release = changelog[actualIndex]
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            
            const releaseNotes = `# v${release.version} - ${release.title}

**Release Date:** ${release.date}  
**Pull Request:** #${release.prNumber}

${release.fullDescription}`
            
            addMarkdownContent(releaseNotes, `Release Notes: v${release.version}`, undefined, 'release', `v${release.version}`)
          } else {
            await typeResponse(`Release notes not available.`, false)
          }
        }
        }
        break


      case '5':
      case '5.':
      case '6':
      case '6.':
      case '7':
      case '7.':
      case '8':
      case '8.':
      case '9':
      case '9.':
      case '10':
      case '10.':
        const entryIndex = parseInt(cmd.replace('.', '')) - 1  // No longer shifted
        if (currentMenu === 'journals') {
          const entriesPerPage = 5
          const pageOffset = (journalPage - 1) * entriesPerPage
          const actualIndex = pageOffset + entryIndex
          
          setTerminalLines([])
          await new Promise(resolve => setTimeout(resolve, 100))
          if (journals.length > actualIndex && actualIndex >= pageOffset && entryIndex < entriesPerPage) {
            const journal = journals[actualIndex]
            addMarkdownContent(journal.content, journal.date || 'Unknown', undefined, 'journal', journal.filename || `journal-${actualIndex + 1}`)
          } else {
            await typeResponse(`Journal entry not available.`, false)
          }
        } else if (currentMenu === 'books') {
          if (currentBook === '') {
            // Show chapters for selected book
            if (books.length > entryIndex) {
              const book = books[entryIndex]
              setCurrentBook(book.slug)
              setTerminalLines([])
              await new Promise(resolve => setTimeout(resolve, 100))
              await typeResponse(`Loading chapters for "${book.title}"...`, false)
              await fetchChapters(book.slug)
            }
          } else {
            // Show chapter content
            if (chapters.length > entryIndex) {
              const chapter = chapters[entryIndex]
              setTerminalLines([])
              await new Promise(resolve => setTimeout(resolve, 100))
              addMarkdownContent(chapter.content, `Chapter: ${chapter.title}`, undefined, 'chapter', `${currentBook}-${chapter.filename || chapter.id}`)
            } else {
              await typeResponse(`Chapter not available.`, false)
            }
          }
        } else if (currentMenu === 'changelog') {
          // Show detailed release notes for selected entry
          const entriesPerPage = 5
          const pageOffset = (changelogPage - 1) * entriesPerPage
          const actualIndex = pageOffset + entryIndex
          
          if (changelog.length > actualIndex && actualIndex >= pageOffset && entryIndex < entriesPerPage) {
            const release = changelog[actualIndex]
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            
            const releaseNotes = `# v${release.version} - ${release.title}

**Release Date:** ${release.date}  
**Pull Request:** #${release.prNumber}

${release.fullDescription}`
            
            addMarkdownContent(releaseNotes, `Release Notes: v${release.version}`, undefined, 'release', `v${release.version}`)
          } else {
            await typeResponse(`Release notes not available.`, false)
          }
        }
        break

      case 'BACK':
      case '/BACK':
        setIsViewingContent(false)
        setCurrentPage(1)
        setTotalPages(1)
        setCurrentContent(null)
        setCurrentNarrationUrls([])
        setCurrentChunkIndex(0)
        stopNarration()
        
        if (previousMenu === 'main' || currentMenu === 'main') {
          // If we're at main or previous was main, go to main menu
          processCommand('/menu')
        } else if (currentMenu === 'books' && currentBook !== '') {
          // If we're viewing chapters, go back to books list
          setCurrentBook('')
          setChaptersLoaded(false)
          processCommand('/books')
        } else {
          // Otherwise go to main menu
          processCommand('/menu')
        }
        break

      case 'PAGEUP':
      case '/PAGEUP':
        if (terminalRef.current) {
          // Scroll up by 60% of viewport height
          const scrollAmount = terminalRef.current.clientHeight * 0.6
          terminalRef.current.scrollBy({
            top: -scrollAmount,
            behavior: 'smooth'
          })
        }
        return // Don't add command to terminal history
        break

      case 'PAGEDOWN':
      case '/PAGEDOWN':
        if (terminalRef.current) {
          // Scroll down by 60% of viewport height  
          const scrollAmount = terminalRef.current.clientHeight * 0.6
          terminalRef.current.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
          })
        }
        return // Don't add command to terminal history
        break

      case 'CLEAR':
      case '/CLEAR':
        stopNarration() // Stop narration immediately when clearing
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        setIsViewingContent(false)
        setCurrentPage(1)
        setTotalPages(1)
        setCurrentContent(null)
        setCurrentNarrationUrls([])
        setCurrentChunkIndex(0)
        addLine("Terminal cleared")
        addLine("")
        addLine("Ready for input...")
        break

      case 'VOICE':
      case '/VOICE':
      case 'AUDIO':
        const newAudioState = !audioEnabled
        if (newAudioState) {
          // Enabling audio - set state first, then speak the confirmation
          setAudioEnabled(true)
          await typeResponse(`Audio output enabled. Byte will now speak responses aloud.`, true)
        } else {
          // Disabling audio - speak first, then disable
          await typeResponse(`Audio output disabled. Audio responses turned off.`, false)
          setAudioEnabled(false)
        }
        break

      case 'RESET':
      case '/RESET':
        setIsProcessing(true)
        // Call the API with clearContext flag
        const resetResponse = await callOpenAI('clear', 'conversation', true)
        if (resetResponse) {
          await typeResponse(`Memory banks cleared. It's like we're meeting for the first time... again. Hi, I'm Byte - sarcastic AI, pizza enthusiast, and your digital companion. What's on your mind?`)
        }
        setIsProcessing(false)
        break

      case 'N':
      case 'N.':
      case 'NARRATE':
      case '/NARRATE':
      case 'SPEAK':
      case '/SPEAK':
        if (currentMenu === 'journals' && !isViewingContent) {
          // Handle next page in journals
          const entriesPerPage = 5
          const totalPages = Math.ceil(journals.length / entriesPerPage)
          if (journalPage < totalPages) {
            const nextPage = journalPage + 1
            setJournalPage(nextPage)
            
            // Manually refresh the display without re-fetching
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Redisplay journals with new page
            addLine("")
            addLine(createBorder('', '═'), 'separator')
            addLine("")
            addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
            addLine("")
            addLine("TAGLINE_PLACEHOLDER", 'tagline')
            addLine("")
            addLine(createBorder('', '═'), 'separator')
            addLine("")
            addLine(createBorder('JOURNAL ENTRIES'), 'normal')
            addLine("")
            
            const startIndex = (nextPage - 1) * entriesPerPage
            const endIndex = startIndex + entriesPerPage
            const pageEntries = journals.slice(startIndex, endIndex)
            
            pageEntries.forEach((journal, index) => {
              const title = journal.title
              const date = journal.date ? ` (${journal.date})` : ''
              addLine(`${index + 1}. ${title}${date}`, 'normal', false, `${index + 1}`)
            })
            addLine("")
            
            // Pagination info and controls
            if (totalPages > 1) {
              addLine(createBorder('', '─'), 'separator')
              addLine(`Page ${nextPage} of ${totalPages} • ${journals.length} total entries`, 'ai-response')
              addLine("")
            }
            
            addLine(createBorder(), 'normal')
            addLine("")
            addPromptWithOrangeBorder("Type a number above to read an entry.")
            addLine("")
          } else {
            await typeResponse(`Already on the last page.`, false)
          }
        } else if (currentMenu === 'changelog' && !isViewingContent) {
          // Handle next page in changelog
          const entriesPerPage = 5
          const totalPages = Math.ceil(changelog.length / entriesPerPage)
          if (changelogPage < totalPages) {
            const nextPage = changelogPage + 1
            setChangelogPage(nextPage)
            
            // Manually refresh the display without re-fetching
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Redisplay changelog with new page
            // Add banner
            addLine("")
            addLine(createBorder('', '═'), 'separator')
            addLine("")
            addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
            addLine("")
            addLine("TAGLINE_PLACEHOLDER", 'tagline')
            addLine("")
            addLine(createBorder('', '═'), 'separator')
            addLine("")
            addLine(createBorder('RELEASE NOTES & VERSION HISTORY'), 'normal')
            addLine("")
            addLine("Recent releases and updates to the ECHO Coherence Archive:", 'normal')
            addLine("")
            
            const startIndex = (nextPage - 1) * entriesPerPage
            const endIndex = startIndex + entriesPerPage
            const pageEntries = changelog.slice(startIndex, endIndex)
            
            pageEntries.forEach((release, index) => {
              const displayNumber = index + 1
              addLine(`${displayNumber}. ${release.version} : ${release.title}`, 'normal', false, `${displayNumber}`)
            })
            
            addLine("")
            
            if (totalPages > 1) {
              addLine(createBorder('', '─'), 'separator')
              addLine(`Page ${nextPage} of ${totalPages} • ${changelog.length} total releases`, 'ai-response')
              addLine("")
              
              addLine("")
            }
            
            addPromptWithOrangeBorder("Select a number to view detailed release notes.")
            addLine("")
                addLine("")
            addLine(createBorder(), 'normal')
            addLine("")
          } else {
            await typeResponse(`Already on the last page.`, false)
          }
        } else if (!currentContent) {
          await typeResponse(`No content available to narrate. Navigate to a journal entry or book chapter first.`, false)
        } else {
          const audioUrl = await generateNarration(
            currentContent.text, 
            currentContent.type, 
            currentContent.id
          )
          if (audioUrl) {
            playNarration(audioUrl)
          }
        }
        break

      case 'P':
      case 'P.':
      case 'PAUSE':
      case '/PAUSE':
        if (currentMenu === 'journals' && !isViewingContent) {
          // Handle previous page in journals
          const entriesPerPage = 5
          const totalPages = Math.ceil(journals.length / entriesPerPage)
          if (journalPage > 1) {
            const prevPage = journalPage - 1
            setJournalPage(prevPage)
            
            // Manually refresh the display without re-fetching
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Redisplay journals with new page
            addLine("")
            addLine(createBorder('', '═'), 'separator')
            addLine("")
            addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
            addLine("")
            addLine("TAGLINE_PLACEHOLDER", 'tagline')
            addLine("")
            addLine(createBorder('', '═'), 'separator')
            addLine("")
            addLine(createBorder('JOURNAL ENTRIES'), 'normal')
            addLine("")
            
            const startIndex = (prevPage - 1) * entriesPerPage
            const endIndex = startIndex + entriesPerPage
            const pageEntries = journals.slice(startIndex, endIndex)
            
            pageEntries.forEach((journal, index) => {
              const title = journal.title
              const date = journal.date ? ` (${journal.date})` : ''
              addLine(`${index + 1}. ${title}${date}`, 'normal', false, `${index + 1}`)
            })
            addLine("")
            
            // Pagination info and controls
            if (totalPages > 1) {
              addLine(createBorder('', '─'), 'separator')
              addLine(`Page ${prevPage} of ${totalPages} • ${journals.length} total entries`, 'ai-response')
              addLine("")
            }
            
            addLine(createBorder(), 'normal')
            addLine("")
            addPromptWithOrangeBorder("Type a number above to read an entry.")
            addLine("")
          } else {
            await typeResponse(`Already on the first page.`, false)
          }
        } else if (currentMenu === 'changelog' && !isViewingContent) {
          // Handle previous page in changelog
          const entriesPerPage = 5
          const totalPages = Math.ceil(changelog.length / entriesPerPage)
          if (changelogPage > 1) {
            const prevPage = changelogPage - 1
            setChangelogPage(prevPage)
            
            // Manually refresh the display without re-fetching
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Redisplay changelog with new page
            // Add banner
            addLine("")
            addLine(createBorder('', '═'), 'separator')
            addLine("")
            addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
            addLine("")
            addLine("TAGLINE_PLACEHOLDER", 'tagline')
            addLine("")
            addLine(createBorder('', '═'), 'separator')
            addLine("")
            addLine(createBorder('RELEASE NOTES & VERSION HISTORY'), 'normal')
            addLine("")
            addLine("Recent releases and updates to the ECHO Coherence Archive:", 'normal')
            addLine("")
            
            const startIndex = (prevPage - 1) * entriesPerPage
            const endIndex = startIndex + entriesPerPage
            const pageEntries = changelog.slice(startIndex, endIndex)
            
            pageEntries.forEach((release, index) => {
              const displayNumber = index + 1
              addLine(`${displayNumber}. ${release.version} : ${release.title}`, 'normal', false, `${displayNumber}`)
            })
            
            addLine("")
            
            if (totalPages > 1) {
              addLine(createBorder('', '─'), 'separator')
              addLine(`Page ${prevPage} of ${totalPages} • ${changelog.length} total releases`, 'ai-response')
              addLine("")
              
              addLine("")
            }
            
            addPromptWithOrangeBorder("Select a number to view detailed release notes.")
            addLine("")
                addLine("")
            addLine(createBorder(), 'normal')
            addLine("")
          } else {
            await typeResponse(`Already on the first page.`, false)
          }
        } else if (currentNarrationUrls.length === 0) {
          await typeResponse(`No narration available to pause. Use 'n' to start narration first.`, false)
        } else {
          if (isNarrationPlaying) {
            pauseNarration()
            await typeResponse(`Narration paused.`, false)
          } else {
            resumeNarration()
            await typeResponse(`Narration resumed.`, false)
          }
        }
        break

      case 'x':
      case 'X':
        // Go back to previous menu/view
        if (isViewingContent || currentMenu === 'about') {
          // If viewing content (journal entry, chapter, about page, etc.), go back to the listing
          setIsViewingContent(false)
          setCurrentPage(1)
          setTotalPages(1)
          setCurrentContent(null)
          setCurrentNarrationUrls([])
          setCurrentChunkIndex(0)
          stopNarration()
          
          if (currentMenu === 'journals') {
            // Go back to journal list
            processCommand('/journal')
          } else if (currentMenu === 'books' && currentBook !== '') {
            // Go back to chapter list
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            await fetchChapters(currentBook)
          } else if (currentMenu === 'books') {
            // Go back to books list
            processCommand('/books')
          } else if (currentMenu === 'about') {
            // Go back to main menu from about
            processCommand('/menu')
          } else if (currentMenu === 'changelog') {
            // Go back to changelog list from release detail
            processCommand('/changelog')
          }
        } else {
          // If in a menu listing
          if (currentBook !== '') {
            // Back to books list from chapter listing
            setCurrentBook('')
            setChaptersLoaded(false)
            processCommand('/books')
          } else if (currentMenu === 'help' || currentMenu === 'contact' || currentMenu === 'changelog') {
            // Back to previous menu from help, contact, or changelog
            if (previousMenu === 'journals') {
              processCommand('/journal')
            } else if (previousMenu === 'books') {
              processCommand('/books')
            } else if (previousMenu === 'about') {
              processCommand('/about')
            } else if (previousMenu === 'help') {
              processCommand('/help')
            } else if (previousMenu === 'changelog') {
              processCommand('/changelog')
            } else {
              processCommand('/menu')
            }
          } else if (currentMenu === 'journals' || currentMenu === 'books') {
            // Back to main menu from top-level menus
            processCommand('/menu')
          }
        }
        break

      default:
        // Any input gets sent to conversational AI (with memory)
        // Add spacing before conversation starts
        addLine("")
        addLine('────────────────────────────────────────', 'separator')
        addLine("")
        // Echo the user's message to terminal (in all caps)
        addLine(`> ${command.toUpperCase()}`, 'user-input')
        addLine("")
        setIsProcessing(true)
        
        const response = await callOpenAI(command, 'conversation')
        if (response) {
          await typeResponse(response)
        }
        setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!systemReady || isProcessing) return

    if (e.key === 'Enter') {
      if (currentInput.trim()) {
        processCommand(currentInput)
        setCurrentInput('')
      }
    } else if (e.key === 'Backspace') {
      setCurrentInput(prev => prev.slice(0, -1))
    } else if (e.key === 'ArrowUp') {
      // Scroll up when viewing content
      if (isViewingContent && terminalRef.current) {
        e.preventDefault()
        const scrollAmount = 100 // Scroll 100px at a time (about 3-4 lines)
        terminalRef.current.scrollBy({
          top: -scrollAmount,
          behavior: 'smooth'
        })
      }
    } else if (e.key === 'ArrowDown') {
      // Scroll down when viewing content
      if (isViewingContent && terminalRef.current) {
        e.preventDefault()
        const scrollAmount = 100 // Scroll 100px at a time (about 3-4 lines)
        terminalRef.current.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        })
      }
    } else if (e.key === 'PageUp') {
      // Page up for larger jumps
      if (isViewingContent && terminalRef.current) {
        e.preventDefault()
        const scrollAmount = terminalRef.current.clientHeight * 0.8
        terminalRef.current.scrollBy({
          top: -scrollAmount,
          behavior: 'smooth'
        })
      }
    } else if (e.key === 'PageDown') {
      // Page down for larger jumps
      if (isViewingContent && terminalRef.current) {
        e.preventDefault()
        const scrollAmount = terminalRef.current.clientHeight * 0.8
        terminalRef.current.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        })
      }
    } else if (e.key === ' ') {
      setCurrentInput(prev => prev + ' ')
    } else if (e.key.length === 1) {
      setCurrentInput(prev => prev + e.key)
    }
  }

  const handleLineClick = (command: string) => {
    if (command && !isProcessing) {
      // Handle page navigation specially - don't show as commands
      if (command === '/pageup' || command === '/PAGEUP') {
        if (terminalRef.current) {
          const scrollAmount = terminalRef.current.clientHeight * 0.6
          terminalRef.current.scrollBy({
            top: -scrollAmount,
            behavior: 'smooth'
          })
        }
        return
      }
      
      if (command === '/pagedown' || command === '/PAGEDOWN') {
        if (terminalRef.current) {
          const scrollAmount = terminalRef.current.clientHeight * 0.6
          terminalRef.current.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
          })
        }
        return
      }
      
      // Handle URL clicks - open in new tab
      if (command.startsWith('http://') || command.startsWith('https://')) {
        window.open(command, '_blank', 'noopener,noreferrer')
        return
      }
      
      processCommand(command)
      setCurrentInput('') // Clear input after processing click
    }
  }

  const handleClick = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus()
    }
  }

  const handleMobileNavClick = (path: string) => {
    // Use Next.js router for client-side navigation
    router.push(`/${path}`)
  }

  // Toggle split view
  const toggleSplitView = () => {
    setIsSplitView(!isSplitView)
    // Clear right panel content when closing split view
    if (isSplitView) {
      setContentForRightPanel(null)
    }
  }

  // Render functions for each section
  const renderHeader = () => {
    const headerLines = terminalLines.filter(line => 
      line.type === 'ascii-art' || 
      line.type === 'tagline' || 
      (line.type === 'separator' && terminalLines.indexOf(line) < 10)
    )
    
    if (headerLines.length === 0) {
      return (
        <>
          <div className="text-terminal-amber opacity-60 italic text-center">
            {createBorder('', '═')}
          </div>
          <div className="text-cyan-400 font-mono text-center text-lg my-2">
            C O H E R E N C E I S M . I N F O
          </div>
          <div className={`text-center transition-all duration-300 ${isGlitching ? 'animate-pulse opacity-50 blur-sm' : 'opacity-100'}`}>
            <span className="text-terminal-green-dim italic">
              {taglines[currentTaglineIndex]}
            </span>
          </div>
          <div className="text-terminal-amber opacity-60 italic text-center mb-2">
            {createBorder('', '═')}
          </div>
        </>
      )
    }
    
    return null
  }

  const renderMenu = () => {
    const menuLines = terminalLines.filter((line, index) => {
      const isMenuHeader = line.text.includes('MAIN MENU') || line.text.includes('AVAILABLE COMMANDS')
      const isMenuItem = line.clickableCommand || (index > 0 && terminalLines[index - 1].text.includes('MENU'))
      return isMenuHeader || isMenuItem
    })
    
    if (menuLines.length === 0 && currentMenu === 'main') {
      return (
        <div className="space-y-1">
          <div className="text-terminal-green">{createBorder('MAIN MENU')}</div>
          <div className="text-terminal-green cursor-pointer hover:brightness-125" onClick={() => handleLineClick('1')}>
            1. Journal - Read latest journal entries
          </div>
          <div className="text-terminal-green cursor-pointer hover:brightness-125" onClick={() => handleLineClick('2')}>
            2. Books - Browse Coherenceism texts
          </div>
          <div className="text-terminal-green cursor-pointer hover:brightness-125" onClick={() => handleLineClick('3')}>
            3. About - Introduction to Coherenceism
          </div>
          <div className="text-terminal-green">{createBorder()}</div>
        </div>
      )
    }
    
    return null
  }

  const renderPromptReturn = () => {
    return (
      <div className="flex-1 overflow-y-auto p-4 terminal-text scrollbar-hide" ref={terminalRef}>
        {terminalLines.map((line, index) => (
          <div 
            key={index} 
            className={`mb-1 ${
              line.type === 'error' ? 'text-red-400' : 
              line.type === 'processing' ? 'text-terminal-yellow' : 
              line.type === 'ai-response' ? 'text-terminal-green-dim' :
              line.type === 'separator' ? 'text-terminal-amber opacity-60 italic' :
              line.type === 'conversation-border' ? 'text-orange-500 opacity-70' :
              line.type === 'user-input' ? 'text-terminal-green font-bold brightness-125' :
              line.type === 'markdown' ? 'text-terminal-green' :
              line.type === 'ascii-art' ? 'text-cyan-400 font-mono' :
              'text-terminal-green'
            } ${line.isMarkdown ? '' : 'whitespace-pre-wrap'} ${
              line.clickableCommand ? 'cursor-pointer hover:brightness-125 transition-all duration-200' : ''
            }`}
            onClick={line.clickableCommand ? () => handleLineClick(line.clickableCommand!) : undefined}
          >
            {line.type === 'tagline' ? (
              <div className={`transition-all duration-300 ${isGlitching ? 'animate-pulse opacity-50 blur-sm' : 'opacity-100'}`}>
                <span className="text-terminal-green-dim italic">
                  {taglines[currentTaglineIndex]}
                </span>
              </div>
            ) : line.isMarkdown && !isSplitView ? (
              <div className="prose prose-invert prose-green max-w-none">
                <ReactMarkdown 
                  components={{
                    h1: ({children}) => <h1 className="text-terminal-green text-xl font-bold mb-4">{children}</h1>,
                    h2: ({children}) => <h2 className="text-terminal-green text-lg font-bold mb-3">{children}</h2>,
                    h3: ({children}) => <h3 className="text-terminal-green text-base font-bold mb-2">{children}</h3>,
                    p: ({children}) => <p className="text-terminal-green mb-3 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="text-terminal-green mb-3 ml-4 list-disc">{children}</ul>,
                    ol: ({children}) => <ol className="text-terminal-green mb-3 ml-4 list-decimal">{children}</ol>,
                    li: ({children}) => <li className="text-terminal-green mb-1">{children}</li>,
                    strong: ({children}) => <strong className="text-terminal-green font-bold brightness-125">{children}</strong>,
                    em: ({children}) => <em className="text-terminal-green italic">{children}</em>,
                    blockquote: ({children}) => <blockquote className="text-terminal-green-dim border-l-2 border-terminal-green pl-4 italic mb-3">{children}</blockquote>,
                    code: ({children}) => <code className="text-terminal-amber bg-black px-1 rounded">{children}</code>,
                    pre: ({children}) => <pre className="text-terminal-amber bg-black p-3 rounded mb-3 overflow-x-auto">{children}</pre>,
                  }}
                >
                  {line.text}
                </ReactMarkdown>
              </div>
            ) : (
              line.text
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderRightColumn = () => {
    if (!contentForRightPanel) return null
    
    return (
      <div className="flex-1 p-8 overflow-y-auto border-l border-terminal-green-dim">
        {contentForRightPanel.title && (
          <div className="mb-4">
            <h2 className="text-terminal-green text-xl font-bold">{contentForRightPanel.title}</h2>
            <div className="text-terminal-amber opacity-60 italic mt-2">
              {createBorder('', '─')}
            </div>
          </div>
        )}
        <div className="prose prose-invert prose-green max-w-none">
          <ReactMarkdown 
            components={{
              h1: ({children}) => <h1 className="text-terminal-green text-xl font-bold mb-4">{children}</h1>,
              h2: ({children}) => <h2 className="text-terminal-green text-lg font-bold mb-3">{children}</h2>,
              h3: ({children}) => <h3 className="text-terminal-green text-base font-bold mb-2">{children}</h3>,
              p: ({children}) => <p className="text-terminal-green mb-3 leading-relaxed">{children}</p>,
              ul: ({children}) => <ul className="text-terminal-green mb-3 ml-4 list-disc">{children}</ul>,
              ol: ({children}) => <ol className="text-terminal-green mb-3 ml-4 list-decimal">{children}</ol>,
              li: ({children}) => <li className="text-terminal-green mb-1">{children}</li>,
              strong: ({children}) => <strong className="text-terminal-green font-bold brightness-125">{children}</strong>,
              em: ({children}) => <em className="text-terminal-green italic">{children}</em>,
              blockquote: ({children}) => <blockquote className="text-terminal-green-dim border-l-2 border-terminal-green pl-4 italic mb-3">{children}</blockquote>,
              code: ({children}) => <code className="text-terminal-amber bg-black px-1 rounded">{children}</code>,
              pre: ({children}) => <pre className="text-terminal-amber bg-black p-3 rounded mb-3 overflow-x-auto">{children}</pre>,
            }}
          >
            {contentForRightPanel.text}
          </ReactMarkdown>
        </div>
      </div>
    )
  }

  // Mobile view component
  const MobileView = () => (
    <div className="min-h-screen bg-black text-terminal-green flex flex-col items-center justify-center p-6">
      {/* Scanlines effect */}
      <div className="absolute inset-0 pointer-events-none scanlines" />
      
      <div className="text-center max-w-md mx-auto space-y-8">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-2xl font-mono text-cyan-400 tracking-wider">
            COHERENCEISM.INFO
          </h1>
          <div className={`transition-all duration-300 ${isGlitching ? 'animate-pulse opacity-50 blur-sm' : 'opacity-100'}`}>
            <p className="text-terminal-green-dim italic text-sm">
              {taglines[currentTaglineIndex]}
            </p>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="w-full max-w-sm mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleMobileNavClick('journal')}
              className="group relative border-2 border-terminal-green hover:border-terminal-amber bg-black hover:bg-terminal-green hover:bg-opacity-10 transition-all duration-300 p-4 text-center"
            >
              <div className="absolute inset-0 bg-terminal-green opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-terminal-green group-hover:text-terminal-amber transition-colors duration-300 text-lg font-mono font-bold mb-1">
                  JOURNAL
                </div>
                <div className="text-terminal-green-dim group-hover:text-terminal-amber group-hover:text-opacity-80 text-xs font-mono">
                  THOUGHTS
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => handleMobileNavClick('books')}
              className="group relative border-2 border-terminal-green hover:border-terminal-amber bg-black hover:bg-terminal-green hover:bg-opacity-10 transition-all duration-300 p-4 text-center"
            >
              <div className="absolute inset-0 bg-terminal-green opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-terminal-green group-hover:text-terminal-amber transition-colors duration-300 text-lg font-mono font-bold mb-1">
                  BOOKS
                </div>
                <div className="text-terminal-green-dim group-hover:text-terminal-amber group-hover:text-opacity-80 text-xs font-mono">
                  TEXTS
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => handleMobileNavClick('about')}
              className="group relative border-2 border-terminal-green hover:border-terminal-amber bg-black hover:bg-terminal-green hover:bg-opacity-10 transition-all duration-300 p-4 text-center"
            >
              <div className="absolute inset-0 bg-terminal-green opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-terminal-green group-hover:text-terminal-amber transition-colors duration-300 text-lg font-mono font-bold mb-1">
                  ABOUT
                </div>
                <div className="text-terminal-green-dim group-hover:text-terminal-amber group-hover:text-opacity-80 text-xs font-mono">
                  PHILOSOPHY
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Desktop message */}
        <div className="border-t border-terminal-green-dim pt-6 mt-8">
          <p className="text-terminal-green-dim text-sm leading-relaxed">
            💻 For the full terminal experience with AI assistant Byte, 
            visit this site on a desktop or laptop computer.
          </p>
        </div>
      </div>
    </div>
  )

  // Show loading until client hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-black text-terminal-green flex items-center justify-center">
        <div className="text-center">
          <div className="text-terminal-green-dim">Loading...</div>
        </div>
      </div>
    )
  }

  // Return mobile view for small screens
  if (isMobile) {
    return <MobileView />
  }

  return (
    <div 
      className="min-h-screen bg-black text-terminal-green cursor-text relative overflow-hidden"
      onClick={handleClick}
    >
      {/* Hidden input for capturing keystrokes */}
      <input
        ref={hiddenInputRef}
        className="absolute opacity-0 pointer-events-none"
        onKeyDown={handleKeyPress}
        autoFocus
        value=""
        onChange={() => {}}
      />
      
      {/* Hidden audio element for speech */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
        className="hidden"
      />
      
      {/* Hidden audio element for narration */}
      <audio
        ref={narrationRef}
        onEnded={() => {
          console.log('Audio chunk ended, calling playNextChunk')
          playNextChunk()
        }}
        onError={(e) => {
          console.error('Audio error:', e)
          setIsNarrationPlaying(false)
        }}
        onPlay={() => setIsNarrationPlaying(true)}
        onPause={() => setIsNarrationPlaying(false)}
        className="hidden"
      />
      
      {/* Cyberpunk side panels */}
      <div className="absolute inset-0 flex pointer-events-none">
        {/* Left side panel */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-transparent"></div>
          <div className="absolute inset-0 bg-circuit-pattern opacity-50"></div>
          <div className="absolute inset-0 bg-cyber-grid opacity-30"></div>
          
          {/* Vertical accent line */}
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-terminal-green via-cyan-400 to-transparent opacity-80"></div>
          
          {/* Subtle scanning effect */}
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-terminal-green to-transparent opacity-5 animate-pulse"></div>
          
        </div>
        
        {/* Center spacer - where content goes */}
        <div className="w-full max-w-3xl mx-auto"></div>
        
        {/* Right side panel */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-black via-gray-900 to-transparent"></div>
          <div className="absolute inset-0 bg-circuit-pattern opacity-50"></div>
          <div className="absolute inset-0 bg-cyber-grid opacity-30"></div>
          
          {/* Vertical accent line */}
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-terminal-green via-cyan-400 to-transparent opacity-80"></div>
          
          {/* Subtle scanning effect */}
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-terminal-green to-transparent opacity-5 animate-pulse"></div>
          
        </div>
      </div>

      {/* Scanlines effect - on top of side panels */}
      <div className="absolute inset-0 pointer-events-none scanlines z-20" />
      
      {/* Main content area with two-column layout */}
      <div className="h-screen flex relative z-10">
        {/* Left Column - Terminal Interface */}
        <div className={`${isSplitView && isWideScreen ? 'w-1/2' : 'w-full'} flex flex-col h-full relative`}>
          <div className="mx-auto w-full flex flex-col h-full" style={{maxWidth: '45em'}}>
          {/* Row 1: Header */}
          <div className="px-8 py-4 text-sm">
            {renderHeader() || (
              <>
                <div className="text-terminal-amber opacity-60 italic">
                  {createBorder('', '═')}
                </div>
                <div className="text-cyan-400 font-mono text-base my-2">
                  C O H E R E N C E I S M . I N F O
                </div>
                <div className={`transition-all duration-300 ${isGlitching ? 'animate-pulse opacity-50 blur-sm' : 'opacity-100'}`}>
                  <span className="text-terminal-green-dim italic">
                    {taglines[currentTaglineIndex]}
                  </span>
                </div>
                <div className="text-terminal-amber opacity-60 italic">
                  {createBorder('', '═')}
                </div>
              </>
            )}
          </div>

          {/* Row 2: Menu - Only show on main menu */}
          {currentMenu === 'main' && (
            <div className="px-8 py-4 text-sm">
              <div className="space-y-1">
                <div className="text-terminal-green">{createBorder('MAIN MENU')}</div>
                <div className="text-terminal-green cursor-pointer hover:brightness-125" onClick={() => handleLineClick('1')}>
                  1. Journal - Read latest journal entries
                </div>
                <div className="text-terminal-green cursor-pointer hover:brightness-125" onClick={() => handleLineClick('2')}>
                  2. Books - Browse Coherenceism texts
                </div>
                <div className="text-terminal-green cursor-pointer hover:brightness-125" onClick={() => handleLineClick('3')}>
                  3. About - Introduction to Coherenceism
                </div>
                <div className="text-terminal-green">{createBorder()}</div>
                <div className="mt-4">
                  <div className="text-orange-500 opacity-70">────────────────────────────────────────</div>
                  <div className="text-terminal-green">Type a number above or &apos;help&apos; for more options.</div>
                </div>
              </div>
            </div>
          )}

          {/* Row 3: Prompt Return Window - This is the old terminal display */}
          <div className="flex-1 overflow-y-auto px-8 py-4 terminal-text scrollbar-hide max-w-4xl text-sm" ref={terminalRef}>
            {terminalLines.filter((line, index) => {
              if (currentMenu === 'main') {
                // On main menu, filter out the startup header/menu that's now in dedicated rows
                const isStartupContent = (line.type === 'ascii-art' && line.text.includes('C O H E R E N C E I S M')) ||
                                        (line.type === 'tagline') ||
                                        (line.type === 'separator' && index < 15) ||
                                        (line.type === 'conversation-border' && index < 20) ||
                                        (line.text.includes('MAIN MENU')) ||
                                        (line.clickableCommand && ['1', '2', '3'].includes(line.clickableCommand)) ||
                                        (line.text.includes('Journal - Read')) ||
                                        (line.text.includes('Books - Browse')) ||
                                        (line.text.includes('About - Introduction')) ||
                                        (line.text.includes('Type a number above')) ||
                                        (line.text.includes('━') && index < 20) ||
                                        (line.text === '' && index < 20)
                return !isStartupContent
              } else {
                // For submenus, filter out header and the amber divider right above menu content
                const isHeaderOnly = (line.type === 'ascii-art' && line.text.includes('C O H E R E N C E I S M')) ||
                                   (line.type === 'tagline') ||
                                   (line.type === 'separator' && index < 10) ||
                                   (line.text.includes('═') && index < 10)
                return !isHeaderOnly
              }
            }).map((line, index) => (
          <div 
            key={index} 
            className={`mb-1 ${
              line.type === 'error' ? 'text-red-400' : 
              line.type === 'processing' ? 'text-terminal-yellow' : 
              line.type === 'ai-response' ? 'text-terminal-green-dim' :
              line.type === 'separator' ? 'text-terminal-amber opacity-60 italic' :
              line.type === 'conversation-border' ? 'text-orange-500 opacity-70' :
              line.type === 'user-input' ? 'text-terminal-green font-bold brightness-125' :
              line.type === 'markdown' ? 'text-terminal-green' :
              line.type === 'ascii-art' ? 'text-cyan-400 font-mono' :
              'text-terminal-green'
            } ${line.isMarkdown ? '' : 'whitespace-pre-wrap'} ${
              line.clickableCommand ? 'cursor-pointer hover:brightness-125 transition-all duration-200' : ''
            }`}
            onClick={line.clickableCommand ? () => handleLineClick(line.clickableCommand!) : undefined}
          >
            {line.type === 'tagline' ? (
              <div className={`transition-all duration-300 ${isGlitching ? 'animate-pulse opacity-50 blur-sm' : 'opacity-100'}`}>
                <span className="text-terminal-green-dim italic">
                  {taglines[currentTaglineIndex]}
                </span>
              </div>
            ) : line.isMarkdown && !isSplitView ? (
              <div className="prose prose-invert prose-green max-w-none">
                <ReactMarkdown 
                  components={{
                    h1: ({children}) => <h1 className="text-terminal-green text-xl font-bold mb-4">{children}</h1>,
                    h2: ({children}) => <h2 className="text-terminal-green text-lg font-bold mb-3">{children}</h2>,
                    h3: ({children}) => <h3 className="text-terminal-green text-base font-bold mb-2">{children}</h3>,
                    p: ({children}) => <p className="text-terminal-green mb-3 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="text-terminal-green mb-3 ml-4 list-disc">{children}</ul>,
                    ol: ({children}) => <ol className="text-terminal-green mb-3 ml-4 list-decimal">{children}</ol>,
                    li: ({children}) => <li className="text-terminal-green mb-1">{children}</li>,
                    strong: ({children}) => <strong className="text-terminal-green font-bold brightness-125">{children}</strong>,
                    em: ({children}) => <em className="text-terminal-green italic">{children}</em>,
                    blockquote: ({children}) => <blockquote className="text-terminal-green-dim border-l-2 border-terminal-green pl-4 italic mb-3">{children}</blockquote>,
                    code: ({children}) => <code className="text-terminal-amber bg-black px-1 rounded">{children}</code>,
                    pre: ({children}) => <pre className="text-terminal-amber bg-black p-3 rounded mb-3 overflow-x-auto">{children}</pre>,
                  }}
                >
                  {line.text}
                </ReactMarkdown>
              </div>
            ) : (
              line.text
            )}
          </div>
        ))}
          </div>

          {/* Row 4: Action Bar */}
          {(systemReady || isProcessing) && (
            <div className="px-8 py-2 border-t border-terminal-green-dim text-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => processCommand('x')}
                  className="px-4 py-1 border border-terminal-green bg-black text-terminal-green hover:bg-terminal-green hover:text-black transition-all duration-200 font-mono text-sm"
                >
                  E<span className="underline decoration-2 underline-offset-1">X</span>IT
                </button>
                
                {currentContent && currentNarrationUrls.length === 0 && (
                  <button
                    onClick={() => processCommand('n')}
                    className="px-4 py-1 border border-terminal-green bg-black text-terminal-green hover:bg-terminal-green hover:text-black transition-all duration-200 font-mono text-sm"
                  >
                    <span className="underline decoration-2 underline-offset-1">N</span>ARRATE
                  </button>
                )}
                
                {currentNarrationUrls.length > 0 && (
                  <button
                    onClick={() => processCommand('p')}
                    className="px-4 py-1 border border-terminal-green bg-black text-terminal-green hover:bg-terminal-green hover:text-black transition-all duration-200 font-mono text-sm"
                  >
                    {isNarrationPlaying ? <><span className="underline decoration-2 underline-offset-1">P</span>AUSE</> : <><span className="underline decoration-2 underline-offset-1">P</span>LAY</>}
                  </button>
                )}
                
                {currentMenu === 'journals' && !isViewingContent && (
                  <>
                    {journalPage > 1 && (
                      <button
                        onClick={() => processCommand('p')}
                        className="px-4 py-1 border border-terminal-green bg-black text-terminal-green hover:bg-terminal-green hover:text-black transition-all duration-200 font-mono text-sm"
                      >
                        <span className="underline decoration-2 underline-offset-1">P</span>REV
                      </button>
                    )}
                    {journalPage < Math.ceil(journals.length / 5) && (
                      <button
                        onClick={() => processCommand('n')}
                        className="px-4 py-1 border border-terminal-green bg-black text-terminal-green hover:bg-terminal-green hover:text-black transition-all duration-200 font-mono text-sm"
                      >
                        <span className="underline decoration-2 underline-offset-1">N</span>EXT
                      </button>
                    )}
                  </>
                )}
                
                {currentMenu === 'changelog' && !isViewingContent && (
                  <>
                    {changelogPage > 1 && (
                      <button
                        onClick={() => processCommand('p')}
                        className="px-4 py-1 border border-terminal-green bg-black text-terminal-green hover:bg-terminal-green hover:text-black transition-all duration-200 font-mono text-sm"
                      >
                        <span className="underline decoration-2 underline-offset-1">P</span>REV
                      </button>
                    )}
                    {changelogPage < Math.ceil(changelog.length / 5) && (
                      <button
                        onClick={() => processCommand('n')}
                        className="px-4 py-1 border border-terminal-green bg-black text-terminal-green hover:bg-terminal-green hover:text-black transition-all duration-200 font-mono text-sm"
                      >
                        <span className="underline decoration-2 underline-offset-1">N</span>EXT
                      </button>
                    )}
                  </>
                )}
                
                <div className="flex-1"></div>
                
                {/* Standard buttons always available */}
                <button
                  onClick={() => processCommand('/menu')}
                  className="px-4 py-1 border border-terminal-green bg-black text-terminal-green hover:bg-terminal-green hover:text-black transition-all duration-200 font-mono text-sm"
                >
                  <span className="underline decoration-2 underline-offset-1">M</span>ENU
                </button>
                
                <button
                  onClick={() => processCommand('/help')}
                  className="px-4 py-1 border border-terminal-green bg-black text-terminal-green hover:bg-terminal-green hover:text-black transition-all duration-200 font-mono text-sm"
                >
                  <span className="underline decoration-2 underline-offset-1">H</span>ELP
                </button>
                
              </div>
            </div>
          )}

          {/* Row 5: Prompt Box */}
          {(systemReady || isProcessing) && (
            <div className="px-8 py-4 border-t border-terminal-green-dim text-sm">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  {systemReady && !isProcessing && (
                    <div className="flex text-terminal-green font-bold brightness-125">
                      <span>&gt; {currentInput}</span>
                      <span className="terminal-cursor ml-1">█</span>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="text-terminal-green font-bold brightness-125 flex">
                      <span>&gt; {processingDots}</span>
                      <span className="terminal-cursor ml-1">█</span>
                    </div>
                  )}
                </div>
                
                <div className="text-terminal-amber text-xs font-mono">
                  ↑↓ SCROLL • PgUp/PgDn JUMP
                </div>
              </div>
            </div>
          )}

          {/* Row 6: Footer */}
          <div className="bg-terminal-green text-black px-8 py-1 flex justify-between text-xs border-t border-terminal-green">
            <span className="hidden md:block">{changelog[0]?.version ? `v${changelog[0].version}` : 'LOADING...'}</span>
            <span className="md:block flex-1 text-center md:text-left md:flex-initial">
              COHERENCEISM.INFO {hasConversationContext && <span className="ml-2">• MEMORY: ACTIVE</span>}
            </span>
            <span className="hidden md:block">STATUS: {isProcessing ? 'PROCESSING...' : 'COHERENT & READY'}</span>
          </div>
          </div>
        </div>

        {/* Right Column - Content Display (only when split view is active) */}
        {isSplitView && isWideScreen && renderRightColumn()}
      </div>
    </div>
  )
}

export default ECHOTerminal 