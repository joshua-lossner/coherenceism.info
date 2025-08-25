import { NextRequest, NextResponse } from 'next/server'
import { SecurityHeadersManager } from '../../../../lib/security-headers'
import { readMarkdown, CONTENT_DIR } from '../../../../lib/content/fs'
import path from 'path'
import matter from 'gray-matter'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('auth_session')?.value
  if (cookie !== 'ok') {
    return SecurityHeadersManager.createErrorResponse('Unauthorized', 401)
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return SecurityHeadersManager.createErrorResponse('Missing id', 400)
  }

  let absPath: string
  try {
    absPath = Buffer.from(id, 'base64').toString('utf8')
  } catch {
    return SecurityHeadersManager.createErrorResponse('Invalid id encoding', 400)
  }

  const ghToken = process.env.GITHUB_TOKEN
  if (ghToken) {
    try {
      // absPath here is repo-relative path when coming from GH listing
      const repo = 'joshua-lossner/coherenceism.content'
      const ref = process.env.CONTENT_REF || 'main'
      const headers = {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'coherenceism-admin'
      } as const
      const fileResp = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(absPath)}?ref=${encodeURIComponent(ref)}`, { headers, cache: 'no-store' })
      if (!fileResp.ok) {
        const err = await fileResp.text().catch(() => '')
        return SecurityHeadersManager.createErrorResponse(`GitHub fetch failed (${fileResp.status}): ${err || 'Unknown error'}`, 502)
      }
      const fileData: any = await fileResp.json()
      const enc = fileData?.encoding
      const contentB64 = fileData?.content
      if (enc !== 'base64' || !contentB64) {
        return SecurityHeadersManager.createErrorResponse('Unexpected GitHub content format', 502)
      }
      const raw = Buffer.from(contentB64, 'base64').toString('utf8')
      const parsed = matter(raw)
      const res = NextResponse.json({ frontmatter: parsed.data ?? {}, body: parsed.content ?? '' })
      SecurityHeadersManager.applyToResponse(res)
      return res
    } catch (e: any) {
      return SecurityHeadersManager.createErrorResponse(e?.message || 'GitHub preview failed', 502)
    }
  }

  try {
    // Fallback to filesystem preview
    const resolved = path.resolve(absPath)
    const base = path.resolve(CONTENT_DIR)
    if (!(resolved === base || resolved.startsWith(base + path.sep))) {
      return SecurityHeadersManager.createErrorResponse('Invalid path', 400)
    }
    const data = await readMarkdown(resolved)
    const res = NextResponse.json(data)
    SecurityHeadersManager.applyToResponse(res)
    return res
  } catch (e: any) {
    return SecurityHeadersManager.createErrorResponse(e?.message || 'Read failed', 500)
  }
}


