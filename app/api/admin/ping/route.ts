import { NextRequest, NextResponse } from 'next/server'
import { SecurityHeadersManager } from '../../../../lib/security-headers'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('auth_session')?.value
  if (cookie !== 'ok') {
    return SecurityHeadersManager.createErrorResponse('Unauthorized', 401)
  }
  const res = NextResponse.json({ ok: true })
  SecurityHeadersManager.applyToResponse(res)
  return res
}


