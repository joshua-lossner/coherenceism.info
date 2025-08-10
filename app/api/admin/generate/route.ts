import { NextRequest, NextResponse } from 'next/server'
import { SecurityHeadersManager } from '../../../../lib/security-headers'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const cookie = request.cookies.get('admin_token')?.value
  if (cookie !== 'ok') {
    return SecurityHeadersManager.createErrorResponse('Unauthorized', 401)
  }

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    // allow empty body and default type
  }
  const type = typeof body?.type === 'string' && body.type ? String(body.type) : 'news'

  const res = NextResponse.json(
    { message: `Queued generation for '${type}' (stub). Use /unpublished to check drafts.` },
    { status: 202 }
  )
  SecurityHeadersManager.applyToResponse(res)
  return res
}


