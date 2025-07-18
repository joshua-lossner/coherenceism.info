import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of known bot/crawler user agents to block
const BLOCKED_USER_AGENTS = [
  // Search Engine Bots
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
  
  // AI/ML Training Bots
  'gptbot', 'google-extended', 'ccbot', 'anthropic-ai', 'claude-web', 'chatgpt-user',
  'openai', 'copilot', 'gemini', 'bard',
  
  // Social Media Crawlers
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'pinterest', 'whatsapp',
  
  // SEO/Analytics Crawlers
  'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'screaming frog', 'sitebulb',
  
  // Archive Crawlers
  'ia_archiver', 'archive.org_bot', 'wayback', 'memento',
  
  // Commercial/Spam Crawlers
  'megaindex', 'seznambot', 'mail.ru_bot', 'spider', 'crawler', 'scraper',
  'bot', 'wget', 'curl', 'python-requests', 'scrapy', 'selenium'
]

// List of suspicious IP ranges (data centers, VPS providers commonly used by bots)
const BLOCKED_IP_PATTERNS = [
  /^35\./, // Google Cloud
  /^34\./, // Google Cloud
  /^104\./, // AWS/DigitalOcean
  /^159\./, // DigitalOcean
  /^178\./, // Various data centers
]

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || ''
  
  // Block known bots by user agent
  const isBlockedBot = BLOCKED_USER_AGENTS.some(bot => userAgent.includes(bot))
  
  // Block suspicious IPs
  const isBlockedIP = BLOCKED_IP_PATTERNS.some(pattern => pattern.test(clientIP))
  
  // Block requests without proper user agents (likely bots)
  const hasNoUserAgent = !userAgent || userAgent.length < 10
  
  // Block requests with suspicious patterns
  const hasSuspiciousPatterns = userAgent.includes('http') || 
                               userAgent.includes('library') ||
                               userAgent.includes('framework') ||
                               /^\w+\/[\d\.]+$/.test(userAgent) // Simple bot patterns like "Bot/1.0"
  
  if (isBlockedBot || isBlockedIP || hasNoUserAgent || hasSuspiciousPatterns) {
    // Log the blocked attempt (optional - remove in production if desired)
    console.log(`Blocked request: IP=${clientIP}, UA=${userAgent}`)
    
    // Return 403 Forbidden with a clear message
    return new NextResponse('Access denied. This site does not allow automated crawling or indexing.', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
        'X-Robots-Tag': 'noindex, nofollow',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })
  }
  
  // Add anti-crawling headers to all allowed requests
  const response = NextResponse.next()
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive, noimageindex, nocache')
  response.headers.set('X-AI-Training', 'no')
  response.headers.set('X-No-Archive', '1')
  
  // Set CSP header - balanced between security and Next.js requirements
  // Note: Next.js requires 'unsafe-inline' for styles and 'unsafe-eval' for development
  // In production, consider using next/script with strategy="beforeInteractive" for critical scripts
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.github.com https://raw.githubusercontent.com;
    media-src 'self' blob:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();
  
  response.headers.set('Content-Security-Policy', cspHeader);
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}