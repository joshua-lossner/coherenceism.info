import { NextRequest, NextResponse } from 'next/server'
import { SecurityHeadersManager } from '../../../../lib/security-headers'
import matter from 'gray-matter'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('auth_session')?.value
  if (cookie !== 'ok') {
    return SecurityHeadersManager.createErrorResponse('Unauthorized', 401)
  }

  const type = request.nextUrl.searchParams.get('type') || 'news'
  const ghToken = process.env.GITHUB_TOKEN

  // Prefer GitHub listing in remote environments; fallback to FS if token missing
  if (ghToken) {
    try {
      const repo = 'joshua-lossner/coherenceism.content'
      const ref = process.env.CONTENT_REF || 'main'
      const basePath = `content/generated/${type}`

      // Recursively list with Contents API
      const headers = {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'coherenceism-admin'
      } as const

      const listDir = async (dir: string): Promise<string[]> => {
        const resp = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(dir)}?ref=${encodeURIComponent(ref)}`, {
          headers,
          cache: 'no-store'
        })
        if (!resp.ok) return []
        const arr: any[] = await resp.json()
        const files: string[] = []
        for (const entry of arr) {
          if (entry.type === 'file' && /(\.md|\.mdx|\.markdown)$/i.test(entry.name)) {
            files.push(entry.path as string)
          } else if (entry.type === 'dir') {
            const sub = await listDir(entry.path as string)
            files.push(...sub)
          }
        }
        return files
      }

      const mdPaths = await listDir(basePath)

      const results = await Promise.all(
        mdPaths.map(async (p) => {
          const fileResp = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(p)}?ref=${encodeURIComponent(ref)}`, {
            headers,
            cache: 'no-store'
          })
          if (!fileResp.ok) return null
          const fileData: any = await fileResp.json()
          const enc = fileData?.encoding
          const contentB64 = fileData?.content
          if (enc !== 'base64' || !contentB64) return null
          const raw = Buffer.from(contentB64, 'base64').toString('utf8')
          const parsed = matter(raw)
          const fm = parsed.data || {}
          if (fm?.published === true) return null
          const id = Buffer.from(p).toString('base64')
          return { id, title: fm?.title, date: fm?.date, confidence: fm?.confidence, tags: fm?.tags }
        })
      )

      const items = results.filter(Boolean) as Array<{ id: string; title?: string; date?: string; confidence?: number; tags?: any }>
      items.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0
        const db = b.date ? new Date(b.date).getTime() : 0
        return db - da
      })

      const res = NextResponse.json(items)
      SecurityHeadersManager.applyToResponse(res)
      return res
    } catch (e: any) {
      return SecurityHeadersManager.createErrorResponse(e?.message || 'GitHub listing failed', 502)
    }
  }

  // Fallback: legacy FS listing
  const { listGenerated } = await import('../../../../lib/content/fs')
  const items = await listGenerated(type as any)
  const res = NextResponse.json(items)
  SecurityHeadersManager.applyToResponse(res)
  return res
}


