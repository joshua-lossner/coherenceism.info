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
    const { searchParams } = new URL(request.url)
    const prNumber = searchParams.get('pr')
    
    // Check cache first
    const now = Date.now()
    if (changelogCache && (now - cacheTimestamp) < CACHE_DURATION) {
      if (prNumber) {
        const entry = changelogCache.find(e => e.prNumber === parseInt(prNumber))
        return NextResponse.json(entry || { error: 'Release not found' })
      }
      return NextResponse.json(changelogCache)
    }

    // Fetch merged PRs from GitHub
    const response = await fetch(
      'https://api.github.com/repos/joshua-lossner/coherenceism.info/pulls?state=closed&sort=updated&direction=desc&per_page=50',
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'coherenceism-changelog',
          // Note: GitHub API works without auth for public repos, but rate limits apply
        },
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const prs: GitHubPR[] = await response.json()
    
    // Filter merged PRs and convert to changelog entries
    const mergedPrs = prs.filter(pr => pr.merged_at !== null)
    
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
    return NextResponse.json(
      { error: 'Failed to fetch changelog data' },
      { status: 500 }
    )
  }
}