import { NextRequest, NextResponse } from 'next/server'

interface GitHubPR {
  number: number
  title: string
  body: string
  merged_at: string
  merge_commit_sha: string
  base: {
    ref: string
  }
  head: {
    ref: string
  }
}

interface ChangelogEntry {
  version: string
  date: string
  prNumber: number
  title: string
  description: string
  fullDescription: string
}

// Cache for changelog data
let changelogCache: ChangelogEntry[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    console.log('Changelog API called')
    const { searchParams } = new URL(request.url)
    const prNumber = searchParams.get('pr')
    
    // Check cache first
    const now = Date.now()
    if (changelogCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Using cached data:', changelogCache.length, 'entries')
      if (prNumber) {
        const entry = changelogCache.find(e => e.prNumber === parseInt(prNumber))
        return NextResponse.json(entry || { error: 'Release not found' })
      }
      return NextResponse.json(changelogCache)
    }

    console.log('Fetching from GitHub API...')
    
    // Build headers with optional authentication
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'coherenceism-changelog',
    }
    
    // Add GitHub token if available (increases rate limit from 60 to 5000 requests/hour)
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
      console.log('Using GitHub authentication')
    } else {
      console.log('No GitHub token found - using unauthenticated requests (60/hour limit)')
    }
    
    // Fetch merged PRs from GitHub
    const response = await fetch(
      'https://api.github.com/repos/joshua-lossner/coherenceism.info/pulls?state=closed&per_page=100',
      { headers }
    )

    console.log('GitHub API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub API error:', response.status, errorText)
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`)
    }

    const prs: GitHubPR[] = await response.json()
    console.log('Total PRs fetched:', prs.length)
    
    // Filter merged PRs to main branch only
    const mergedPrs = prs.filter(pr => 
      pr.merged_at !== null && 
      pr.base.ref === 'main'
    )
    console.log('Merged PRs to main found:', mergedPrs.length)
    
    if (mergedPrs.length === 0) {
      console.log('No merged PRs found. Sample PRs:', prs.slice(0, 3).map(pr => ({
        number: pr.number,
        title: pr.title,
        merged_at: pr.merged_at,
        state: (pr as any).state
      })))
    }
    
    const changelog: ChangelogEntry[] = mergedPrs.map(pr => {
      const mergeDate = new Date(pr.merged_at)
      const dateStr = mergeDate.toISOString().split('T')[0] // YYYY-MM-DD format
      const version = `${dateStr}.${pr.number}`
      
      // Extract first paragraph or summary for description
      const description = pr.body 
        ? pr.body.split('\n\n')[0].replace(/^#+\s*/, '').trim()
        : pr.title
      
      return {
        version,
        date: dateStr,
        prNumber: pr.number,
        title: pr.title,
        description: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
        fullDescription: pr.body || 'No description available.'
      }
    })

    // Sort by merge date descending (most recent first)
    changelog.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    console.log('Generated changelog entries:', changelog.length)

    // Update cache
    changelogCache = changelog
    cacheTimestamp = now

    // Return specific PR if requested
    if (prNumber) {
      const entry = changelog.find(e => e.prNumber === parseInt(prNumber))
      return NextResponse.json(entry || { error: 'Release not found' })
    }

    // Return all changelog entries
    return NextResponse.json(changelog)

  } catch (error) {
    console.error('Changelog API error:', error)
    
    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes('API rate limit exceeded')) {
      return NextResponse.json(
        { 
          error: 'GitHub API rate limit exceeded', 
          details: 'Please try again later or add a GITHUB_TOKEN environment variable for higher limits',
          rateLimited: true
        },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch changelog data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}