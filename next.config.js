/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          // Prevent indexing
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, nosnippet, noarchive, noimageindex, nocache'
          },
          // Prevent AI training
          {
            key: 'X-AI-Training',
            value: 'no'
          },
          // Additional anti-crawling headers
          {
            key: 'X-No-Archive',
            value: '1'
          },
          {
            key: 'X-No-Index',
            value: '1'
          },
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig