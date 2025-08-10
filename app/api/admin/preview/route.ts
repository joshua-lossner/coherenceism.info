import { NextRequest, NextResponse } from 'next/server'
import { SecurityHeadersManager } from '../../../../lib/security-headers'
import { readMarkdown, CONTENT_DIR } from '../../../../lib/content/fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('admin_token')?.value
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

  // Ensure path stays within CONTENT_DIR
  const resolved = path.resolve(absPath)
  const base = path.resolve(CONTENT_DIR)
  if (!(resolved === base || resolved.startsWith(base + path.sep))) {
    return SecurityHeadersManager.createErrorResponse('Invalid path', 400)
  }

  try {
    const data = await readMarkdown(resolved)
    const res = NextResponse.json(data)
    SecurityHeadersManager.applyToResponse(res)
    return res
  } catch (e: any) {
    return SecurityHeadersManager.createErrorResponse(e?.message || 'Read failed', 500)
  }
}


