import { NextRequest, NextResponse } from 'next/server'
import { InputValidator } from '../../../../lib/validation'
import { SecurityHeadersManager } from '../../../../lib/security-headers'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Validate method
  const methodValidation = InputValidator.validateMethod(request, ['POST'])
  if (!methodValidation.isValid) {
    return SecurityHeadersManager.createErrorResponse(methodValidation.error!, 405)
  }

  // Validate content type
  const contentTypeValidation = InputValidator.validateContentType(request)
  if (!contentTypeValidation.isValid) {
    return SecurityHeadersManager.createErrorResponse(contentTypeValidation.error!, 400)
  }

  const { password } = await request.json().catch(() => ({ password: undefined }))
  const token = process.env.ADMIN_TOKEN
  if (!token) {
    return SecurityHeadersManager.createErrorResponse('ADMIN_TOKEN not configured', 500)
  }

  if (typeof password !== 'string') {
    return SecurityHeadersManager.createErrorResponse('Invalid password', 400)
  }

  if (password.trim() === token) {
    const res = NextResponse.json({ ok: true }, { status: 200 })
    res.cookies.set('admin_token', 'ok', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })
    SecurityHeadersManager.applyToResponse(res)
    return res
  }

  return SecurityHeadersManager.createErrorResponse('Unauthorized', 401)
}


