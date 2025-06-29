import { NextRequest, NextResponse } from 'next/server';
import { SecurityHeadersManager } from './lib/security-headers';

export function middleware(request: NextRequest) {
  // Apply security headers to all responses
  const response = NextResponse.next();
  
  // Apply global security headers
  return SecurityHeadersManager.applyToResponse(response);
}

export const config = {
  matcher: [
    /*
     * Apply security headers only to API routes to avoid interfering with Next.js functionality
     */
    '/api/(.*)',
  ],
};