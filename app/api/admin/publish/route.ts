import { NextRequest, NextResponse } from 'next/server'
import { SecurityHeadersManager } from '../../../../lib/security-headers'
import { CONTENT_DIR } from '../../../../lib/content/fs'
import path from 'path'
import matter from 'gray-matter'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get('admin_token')?.value
  if (cookie !== 'ok') {
    return SecurityHeadersManager.createErrorResponse('Unauthorized', 401)
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return SecurityHeadersManager.createErrorResponse('Invalid JSON', 400)
  }

  const { id } = body || {}
  if (!id || typeof id !== 'string') {
    return SecurityHeadersManager.createErrorResponse('Missing id', 400)
  }

  let absPath: string
  try {
    absPath = Buffer.from(id, 'base64').toString('utf8')
  } catch {
    return SecurityHeadersManager.createErrorResponse('Invalid id encoding', 400)
  }

  const resolved = path.resolve(absPath)
  const base = path.resolve(CONTENT_DIR)
  if (!(resolved === base || resolved.startsWith(base + path.sep))) {
    return SecurityHeadersManager.createErrorResponse('Invalid path', 400)
  }

  // Compute repository-relative path
  const relPathRaw = path.relative(base, resolved)
  const relPath = relPathRaw.split(path.sep).join('/') // ensure POSIX path for GitHub API

  const ghToken = process.env.GITHUB_TOKEN
  const repo = 'joshua-lossner/coherenceism.content'
  if (!ghToken) {
    return SecurityHeadersManager.createErrorResponse('GITHUB_TOKEN not configured', 500)
  }

  try {
    // 1) Fetch existing file from GitHub to get sha and content
    const getResp = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(relPath)}`, {
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json'
      },
      cache: 'no-store'
    })
    if (!getResp.ok) {
      const errText = await getResp.text().catch(() => '')
      return SecurityHeadersManager.createErrorResponse(`GitHub fetch failed (${getResp.status}): ${errText || 'Unknown error'}`, 502)
    }
    const getData = await getResp.json()
    const sha: string | undefined = getData?.sha
    const encoded: string | undefined = getData?.content
    const encoding: string | undefined = getData?.encoding
    if (!sha || !encoded || encoding !== 'base64') {
      return SecurityHeadersManager.createErrorResponse('Unexpected GitHub content format', 502)
    }

    const currentContent = Buffer.from(encoded, 'base64').toString('utf8')
    const parsed = matter(currentContent)
    const nextFrontmatter = { ...(parsed.data ?? {}), published: true }
    const output = matter.stringify(parsed.content ?? '', nextFrontmatter)
    const outputB64 = Buffer.from(output, 'utf8').toString('base64')

    // 2) Commit updated content back to GitHub
    const putResp = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(relPath)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Publish draft: ${relPath}`,
        content: outputB64,
        sha
      })
    })

    if (!putResp.ok) {
      const errText = await putResp.text().catch(() => '')
      return SecurityHeadersManager.createErrorResponse(`GitHub commit failed (${putResp.status}): ${errText || 'Unknown error'}`, 502)
    }

    const res = NextResponse.json({ ok: true })
    SecurityHeadersManager.applyToResponse(res)
    return res
  } catch (e: any) {
    return SecurityHeadersManager.createErrorResponse(e?.message || 'Publish failed', 500)
  }
}


