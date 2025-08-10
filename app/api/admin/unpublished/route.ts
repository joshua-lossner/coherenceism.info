import { NextRequest, NextResponse } from 'next/server'
import { SecurityHeadersManager } from '../../../../lib/security-headers'
import { listGenerated } from '../../../../lib/content/fs'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('admin_token')?.value
  if (cookie !== 'ok') {
    return SecurityHeadersManager.createErrorResponse('Unauthorized', 401)
  }

  const type = request.nextUrl.searchParams.get('type') || 'news'
  const items = await listGenerated(type as any)

  const res = NextResponse.json(items)
  SecurityHeadersManager.applyToResponse(res)
  return res
}


