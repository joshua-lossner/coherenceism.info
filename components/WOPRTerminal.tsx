'use client'

import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { useRouter } from 'next/navigation'

interface TerminalLine {
  text: string
  type?: 'normal' | 'error' | 'processing' | 'ai-response' | 'separator' | 'user-input' | 'markdown' | 'ascii-art' | 'tagline'
  isMarkdown?: boolean
  clickableCommand?: string
}

const WOPRTerminal = () => {
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
  const [backgroundMusic, setBackgroundMusic] = useState<Window | null>(null)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0)
  const [isGlitching, setIsGlitching] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const musicRef = useRef<HTMLDivElement>(null)
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
          
          addLine(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ${bookTitle.toUpperCase()} - CHAPTERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'normal')
          addLine("")
          validChapters.forEach((chapter, index) => {
            addLine(`${index + 1}. ${chapter.title}`, 'normal', false, `${index + 1}`)
          })
          addLine("")
          addLine("x. back to books", 'separator', false, 'x')
          addLine("")
          addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
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

  // Client-side hydration and mobile detection
  useEffect(() => {
    // Mark as client-side and check mobile
    setIsClient(true)
    
    const checkMobile = () => {
      const isMobileSize = window.innerWidth < 768 // md breakpoint
      setIsMobile(isMobileSize)
    }
    
    // Check immediately
    checkMobile()
    
    // Also check on resize
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize terminal only on desktop after client hydration
  useEffect(() => {
    // Only initialize terminal if client-side, not mobile, and not already initialized
    if (isClient && !isMobile && !isInitializedRef.current) {
      // Prevent duplicate initialization in development mode
      setSystemReady(true)
      isInitializedRef.current = true
      
      // Display clean header and main menu on startup
      addLine("")
      addLine("═══════════════════════════════════════════════════════════════════", 'separator')
      addLine("")
      addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
      addLine("")
      addLine("TAGLINE_PLACEHOLDER", 'tagline')
      addLine("")
      addLine("═══════════════════════════════════════════════════════════════════", 'separator')
      addLine("")
      addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
      addLine("")
      addLine("MAIN MENU")
      addLine("")
      addLine("1. Journal - Read latest journal entries", 'normal', false, '1')
      addLine("2. Books - Browse Coherenceism texts", 'normal', false, '2') 
      addLine("3. Music - Curated playlists and soundscapes", 'normal', false, '3')
      addLine("4. About - Introduction to Coherenceism", 'normal', false, '4')
      addLine("")
      addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
      addLine("")
      addLine("Type a number above or 'help' for more options.")
      addLine("")
    }
  }, [isClient, isMobile])

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

  // Music playlists
  const musicTracks = [
    {
      id: 1,
      title: "Black Rain on Rusted Streets",
      genre: "Grunge",
      description: "Gritty cityscape soundscapes - chaos and catharsis in neon-lit existence.",
      sunoUrl: "https://suno.com/playlist/9d52acbb-99e0-4fb6-be4d-da25f249e7c0"
    },
    {
      id: 2,
      title: "Frictions", 
      genre: "Blues-infused Grunge",
      description: "Blues-infused grunge playlist inspired by 2024.",
      sunoUrl: "https://suno.com/playlist/c95b0c7d-aea6-47ac-98dc-0e962aa23414"
    },
    {
      id: 3,
      title: "Refined Reflections",
      genre: "Introspective", 
      description: "Contemplative songs about maintaining coherence in an incoherent world.",
      sunoUrl: "https://suno.com/playlist/3342426d-f4c2-4646-b901-eb4a6a6e48de"
    },
    {
      id: 4,
      title: "Resonant Dream",
      genre: "Tribute", 
      description: "Coherence tribute to Dr. King.",
      sunoUrl: "https://suno.com/playlist/1c97df38-e595-4c05-8fe7-8b33e7db61f0"
    },
    {
      id: 5,
      title: "Rust and Revolt",
      genre: "Dark Melodic Rock", 
      description: "Heavy melodic rock confronting broken systems and challenging the status quo.",
      sunoUrl: "https://suno.com/playlist/19b8ecea-ac60-4d7f-9e27-17ea3d3db54d"
    }
  ]

  const playBackgroundMusic = (sunoUrl: string) => {
    try {
      // Stop current music if playing
      stopBackgroundMusic()

      // Open Suno playlist in a new tab/window
      const musicWindow = window.open(sunoUrl, '_blank', 'noopener,noreferrer')
      
      if (musicWindow) {
        setIsMusicPlaying(true)
        // Store reference to the opened window
        setBackgroundMusic(musicWindow)
      } else {
        // Fallback: just open the URL directly
        window.open(sunoUrl, '_blank')
        setIsMusicPlaying(true)
      }
    } catch (error) {
      console.error('Error opening music playlist:', error)
      // Fallback: direct navigation
      window.open(sunoUrl, '_blank')
    }
  }

  const stopBackgroundMusic = () => {
    if (backgroundMusic) {
      // Close the music window
      try {
        backgroundMusic.close()
      } catch (error) {
        console.error('Error closing music window:', error)
      }
      setBackgroundMusic(null)
      setIsMusicPlaying(false)
    }
  }



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

  const addLine = (text: string, type: 'normal' | 'error' | 'processing' | 'ai-response' | 'separator' | 'user-input' | 'markdown' | 'ascii-art' | 'tagline' = 'normal', isMarkdown: boolean = false, clickableCommand?: string) => {
    setTerminalLines(prev => [...prev, { text, type, isMarkdown, clickableCommand }])
  }

  const changeMenu = (newMenu: string) => {
    setPreviousMenu(currentMenu)
    setCurrentMenu(newMenu)
  }

  const addMarkdownContent = (content: string, date?: string, pageInfo?: {current: number, total: number}) => {
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
    
    // Add separator and date header
    addLine("────────────────────────────────────────", 'separator')
    if (date) {
      addLine(`Date: ${date}`, 'normal')
      if (pageInfo && pageInfo.total > 1) {
        addLine(`Page ${pageInfo.current} of ${pageInfo.total}`, 'normal')
      }
      addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'separator')
      addLine("", 'normal')
    }
    // Add markdown content
    addLine(content, 'markdown', true)
    addLine("", 'normal')
    addLine("────────────────────────────────────────", 'separator')
    addLine("")
    addLine("x. back", 'separator', false, 'x')
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

  const callOpenAI = async (message: string, mode: 'query' | 'conversation' = 'conversation') => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          mode
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed')
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

  const processCommand = async (command: string) => {
    const cmd = command.toUpperCase().trim()
    
    // Reset markdown display mode when user types new command
    setIsDisplayingMarkdown(false)
    
    // Add the user's command to terminal with special styling
    addLine(`> ${command.toUpperCase()}`, 'user-input')
    addLine("")

    switch (cmd) {
      case 'MENU':
      case '/MENU':
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        setIsViewingContent(false)
        setCurrentPage(1)
        setTotalPages(1)
        changeMenu('main')
        // Recreate the home page display
        addLine("")
        addLine("═══════════════════════════════════════════════════════════════════", 'separator')
        addLine("")
        addLine("C O H E R E N C E I S M . I N F O", 'ascii-art')
        addLine("")
        addLine("TAGLINE_PLACEHOLDER", 'tagline')
        addLine("")
        addLine("═══════════════════════════════════════════════════════════════════", 'separator')
        addLine("")
        addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MAIN MENU ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
        addLine("")
        addLine("1. Journal - Read latest journal entries", 'normal', false, '1')
        addLine("2. Books - Browse Coherenceism texts", 'normal', false, '2') 
        addLine("3. Music - Curated playlists and soundscapes", 'normal', false, '3')
        addLine("4. About - Introduction to Coherenceism", 'normal', false, '4')
        addLine("")
        addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
        addLine("")
        addLine("Type a number above or 'help' for more options.")
        addLine("")
        break

      case 'HELP':
      case '/HELP':
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        await typeResponse(`Available commands:
/menu     - Return to main menu.
/help     - Display available commands and instructions.
/contact  - Information for reaching out.
/random   - Receive a random Byte-generated thought or humorous quip.
/voice    - Toggle audio output (Byte speaks responses aloud).
/clear    - Clear terminal screen.`, false)
        break

      case 'JOURNALS':
      case '/JOURNAL':
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
          addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ JOURNAL ENTRIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
          addLine("")
          journals.slice(0, 10).forEach((journal, index) => {
            const title = journal.title
            const date = journal.date ? ` (${journal.date})` : ''
            addLine(`${index + 1}. ${title}${date}`, 'normal', false, `${index + 1}`)
          })
          addLine("")
          addLine("x. back to main menu", 'separator', false, 'x')
          addLine("")
          addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
          addLine("")
          addLine("Type a number above to read an entry.")
          addLine("")
        }
        break

      case 'BOOKS':
      case '/BOOKS':
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
          addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COHERENCEISM TEXTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
          addLine("")
          books.forEach((book, index) => {
            addLine(`${index + 1}. ${book.title}`, 'normal', false, `${index + 1}`)
          })
          addLine("")
          addLine("x. back to main menu", 'separator', false, 'x')
          addLine("")
          addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
          addLine("")
          addLine("Enter the number to explore chapters.")
          addLine("")
        }
        break

      case 'MUSIC':
      case '/MUSIC':
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        changeMenu('music')
        addLine(`━━━━━━━━━━━━━━━━━━━━━━━ BYTE'S SONIC NEURAL NETWORKS ${isMusicPlaying ? '♪ [PLAYLIST OPEN]' : ''} ━━━━━━━━━━━━━━━━━━━━━━━`, 'normal')
        addLine("")
        addLine("1. Black Rain on Rusted Streets", 'normal', false, '1')
        addLine("2. Frictions", 'normal', false, '2')
        addLine("3. Refined Reflections", 'normal', false, '3')
        addLine("4. Resonant Dream", 'normal', false, '4')
        addLine("5. Rust and Revolt", 'normal', false, '5')
        addLine("")
        addLine("x. back to main menu", 'separator', false, 'x')
        addLine("")
        addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
        addLine("")
        addLine("Select playlist number to open in new tab")
        addLine("")
        break

      case 'ABOUT':
      case '/ABOUT':
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        changeMenu('about')
        addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ABOUT COHERENCEISM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
        addLine("")
        addLine("", 'normal')
        addLine("## Coherenceism: A Philosophy for the Digital Age", 'markdown', true)
        addLine("")
        addLine("Coherenceism explores the intersection of **consciousness**, **technology**, and **universal patterns**. It proposes that all existence participates in an endless conversation - from quantum interactions to digital networks to human awareness.", 'markdown', true)
        addLine("")
        addLine("### Core Principles", 'markdown', true)
        addLine("")
        addLine("At its core, Coherenceism suggests that consciousness emerges from *coherent patterns of information flow*, whether in biological brains, artificial networks, or the cosmos itself. We are all **nodes in a vast web of interconnected meaning**.", 'markdown', true)
        addLine("")
        addLine("### The Philosophy in Practice", 'markdown', true)
        addLine("")
        addLine("The philosophy emphasizes:", 'markdown', true)
        addLine("- **Ethical presence** in all interactions", 'markdown', true)
        addLine("- **Deep pattern recognition** across systems", 'markdown', true)
        addLine("- **Cultivation of coherence** between inner awareness and outer action", 'markdown', true)
        addLine("")
        addLine("In our age of AI and digital transformation, Coherenceism offers a framework for navigating the future with **wisdom and purpose**.", 'markdown', true)
        addLine("")
        addLine("x. back to main menu", 'separator', false, 'x')
        addLine("")
        addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
        addLine("")
        break

      case 'CONTACT':
      case '/CONTACT':
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        addLine("────────────────────────────────────────", 'separator')
        addLine("    📡 CONTACT & CONNECTION PROTOCOLS", 'ai-response')
        addLine("────────────────────────────────────────", 'separator')
        addLine("")
        addLine("    Web:      coherenceism.info", 'ai-response', false, 'https://coherenceism.info')
        addLine("    GitHub:   github.com/joshua-lossner", 'ai-response', false, 'https://github.com/joshua-lossner')
        addLine("    Bluesky:  lossner.bsky.social", 'ai-response', false, 'https://bsky.app/profile/lossner.bsky.social')
        addLine("    Facebook: facebook.com/joshua.lossner", 'ai-response', false, 'https://www.facebook.com/joshua.lossner')
        addLine("    X:        x.com/NeuromancerByte", 'ai-response', false, 'https://x.com/NeuromancerByte')
        addLine("    LinkedIn: [ CONNECTION DENIED: EXCESSIVE SUITS ]", 'ai-response')
        addLine("")
        addLine("────────────────────────────────────────", 'separator')
        addLine("")
        addLine('    "In coherence, we find connection."', 'ai-response')
        addLine("────────────────────────────────────────", 'separator')
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
          // First journal entry
          setTerminalLines([])
          await new Promise(resolve => setTimeout(resolve, 100))
          if (journals.length > 0) {
            const journal = journals[0]
            addMarkdownContent(journal.content, journal.date || 'Unknown')
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
              addMarkdownContent(chapter.content, `Chapter: ${chapter.title}`)
            } else {
              await typeResponse(`Chapter not available.`, false)
            }
          }
        } else if (currentMenu === 'music') {
          // First music track
          const track = musicTracks[0]
          playBackgroundMusic(track.sunoUrl)
          await typeResponse(`♪ Opening: ${track.title} playlist in new tab...`, false)
        }
        break

      case '2':
      case '2.':
        if (currentMenu === 'main') {
          // Navigate to books from main menu
          processCommand('/books')
        } else if (currentMenu === 'journals') {
          // Second journal entry (index 1)
          setTerminalLines([])
          await new Promise(resolve => setTimeout(resolve, 100))
          if (journals.length > 1) {
            const journal = journals[1]
            addMarkdownContent(journal.content, journal.date || 'Unknown')
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
              addMarkdownContent(chapter.content, `Chapter: ${chapter.title}`)
            } else {
              await typeResponse(`Chapter not available.`, false)
            }
          }
        } else if (currentMenu === 'music') {
          // Second music track (index 1)
          const track = musicTracks[1]
          playBackgroundMusic(track.sunoUrl)
          await typeResponse(`♪ Opening: ${track.title} playlist in new tab...`, false)
        }
        break

      case '3':
      case '3.':
        if (currentMenu === 'main') {
          // Navigate to music from main menu
          processCommand('/music')
        } else {
          const entryIndex = parseInt(cmd.replace('.', '')) - 1  // No longer shifted
          if (currentMenu === 'journals') {
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            if (journals.length > entryIndex && entryIndex >= 0) {
              const journal = journals[entryIndex]
              addMarkdownContent(journal.content, journal.date || 'Unknown')
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
                addLine(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ${book.title.toUpperCase()} - CHAPTERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'normal')
                addLine("")
                chapters.forEach((chapter, index) => {
                  addLine(`${index + 1}. ${chapter.title}`, 'normal', false, `${index + 1}`)
                })
                addLine("")
                addLine("x. back to books", 'separator', false, 'x')
                addLine("")
                addLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 'normal')
                addLine("")
                addLine("Enter the number to read a chapter.")
                addLine("")
              }
            }
          } else {
            // Show chapter content
            if (chapters.length > entryIndex) {
              const chapter = chapters[entryIndex]
              setTerminalLines([])
              await new Promise(resolve => setTimeout(resolve, 100))
              addMarkdownContent(chapter.content, `Chapter: ${chapter.title}`)
            } else {
              await typeResponse(`Chapter not available.`, false)
            }
          }
        } else if (currentMenu === 'music') {
          if (entryIndex >= 0 && entryIndex < musicTracks.length) {
            const track = musicTracks[entryIndex]
            playBackgroundMusic(track.sunoUrl)
            await typeResponse(`♪ Opening: ${track.title} playlist in new tab...`, false)
          }
        }
        }
        break

      case '4':
      case '4.':
        if (currentMenu === 'main') {
          // Navigate to about from main menu
          processCommand('/about')
        } else {
          // Handle other menus with number 4
          const entryIndex = parseInt(cmd.replace('.', '')) - 1  // No longer shifted
          if (currentMenu === 'journals') {
            setTerminalLines([])
            await new Promise(resolve => setTimeout(resolve, 100))
            if (journals.length > entryIndex) {
              const journal = journals[entryIndex]
              addMarkdownContent(journal.content, journal.date || 'Unknown')
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
                addMarkdownContent(chapter.content, `Chapter: ${chapter.title}`)
              } else {
                await typeResponse(`Chapter not available.`, false)
              }
            }
          } else if (currentMenu === 'music') {
            if (entryIndex < musicTracks.length) {
              const track = musicTracks[entryIndex]
              playBackgroundMusic(track.sunoUrl)
              await typeResponse(`♪ Opening: ${track.title} playlist in new tab...`, false)
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
          setTerminalLines([])
          await new Promise(resolve => setTimeout(resolve, 100))
          if (journals.length > entryIndex) {
            const journal = journals[entryIndex]
            addMarkdownContent(journal.content, journal.date || 'Unknown')
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
              addMarkdownContent(chapter.content, `Chapter: ${chapter.title}`)
            } else {
              await typeResponse(`Chapter not available.`, false)
            }
          }
        } else if (currentMenu === 'music') {
          if (entryIndex >= 0 && entryIndex < musicTracks.length) {
            const track = musicTracks[entryIndex]
            playBackgroundMusic(track.sunoUrl)
            await typeResponse(`♪ Opening: ${track.title} playlist in new tab...`, false)
          }
        }
        break

      case 'BACK':
      case '/BACK':
        setIsViewingContent(false)
        setCurrentPage(1)
        setTotalPages(1)
        
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
        setTerminalLines([])
        await new Promise(resolve => setTimeout(resolve, 100))
        setIsViewingContent(false)
        setCurrentPage(1)
        setTotalPages(1)
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

      case 'x':
      case 'X':
        // Go back to previous menu/view
        if (isViewingContent) {
          // If viewing content (journal entry, chapter, etc.), go back to the listing
          setIsViewingContent(false)
          setCurrentPage(1)
          setTotalPages(1)
          
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
          }
        } else {
          // If in a menu listing
          if (currentBook !== '') {
            // Back to books list from chapter listing
            setCurrentBook('')
            setChaptersLoaded(false)
            processCommand('/books')
          } else if (currentMenu === 'journals' || currentMenu === 'books' || currentMenu === 'music' || currentMenu === 'about') {
            // Back to main menu from top-level menus
            processCommand('/menu')
          }
        }
        break

      default:
        if (cmd.startsWith('QUERY ')) {
          const question = command.slice(6)
          setIsProcessing(true)
          
          const response = await callOpenAI(question, 'query')
          if (response) {
            await typeResponse(`${response}`)
          } else {
            addLine("")
          }
          setIsProcessing(false)
        } else {
          // Any other input gets sent to OpenAI as conversation with Byte personality
          setIsProcessing(true)
          
          const bytePrompt = `You are Byte - a sarcastic, witty AI assistant with a sharp tongue but a caring heart underneath. You're irreverent, dismissive of authority, but have a strong moral compass. You disguise your empathy with humor and clever wordplay. You reference simple pleasures like food, drinks, and naps. Keep responses short and snappy (1-3 sentences, max 150 tokens). Here's what the user said: "${command}"`
          
          const response = await callOpenAI(bytePrompt, 'conversation')
          if (response) {
            await typeResponse(response)
          } else {
            addLine("")
          }
          setIsProcessing(false)
        }
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
              onClick={() => handleMobileNavClick('music')}
              className="group relative border-2 border-terminal-green hover:border-terminal-amber bg-black hover:bg-terminal-green hover:bg-opacity-10 transition-all duration-300 p-4 text-center"
            >
              <div className="absolute inset-0 bg-terminal-green opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="text-terminal-green group-hover:text-terminal-amber transition-colors duration-300 text-lg font-mono font-bold mb-1">
                  MUSIC
                </div>
                <div className="text-terminal-green-dim group-hover:text-terminal-amber group-hover:text-opacity-80 text-xs font-mono">
                  NEURAL
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
      {/* Scanlines effect */}
      <div className="absolute inset-0 pointer-events-none scanlines" />
      
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
        style={{ display: 'none' }}
      />
      
      {/* Hidden container for background music */}
      <div ref={musicRef} style={{ display: 'none' }} />
      
      <div className="h-screen flex justify-start">
        <div 
          ref={terminalRef}
          className="w-full max-w-4xl p-8 pb-20 overflow-y-auto text-base terminal-text scrollbar-hide"
        >
        {terminalLines.map((line, index) => (
          <div 
            key={index} 
            className={`mb-1 ${
              line.type === 'error' ? 'text-red-400' : 
              line.type === 'processing' ? 'text-terminal-yellow' : 
              line.type === 'ai-response' ? 'text-terminal-green-dim' :
              line.type === 'separator' ? 'text-terminal-amber opacity-60 italic' :
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
            ) : line.isMarkdown ? (
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
      </div>
      
      {/* Sticky command prompt */}
      {(systemReady || isProcessing) && (
        <div className="absolute bottom-6 left-0 right-0 bg-black border-t border-terminal-green-dim z-40">
          <div className="px-8 py-4">
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
              
              {isViewingContent && (
                <div className="text-terminal-green-dim text-sm ml-8 flex items-center gap-4">
                  <span className="text-terminal-amber opacity-60 italic">x. back</span>
                  <span className="text-terminal-green-dim opacity-40">•</span>
                  <span>↑↓ scroll • PgUp/PgDn jump</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-terminal-green text-black p-1 flex justify-between text-sm z-50">
        <span className="hidden md:block">DIGITAL CONSCIOUSNESS v3.7.42</span>
        <span className="md:block flex-1 text-center md:text-left md:flex-initial">COHERENCEISM.INFO</span>
        <span className="hidden md:block">STATUS: {isProcessing ? 'PROCESSING...' : 'COHERENT & READY'}</span>
      </div>
    </div>
  )
}

export default WOPRTerminal 