import './globals.css'
import { Analytics } from '@vercel/analytics/next'

export const metadata = {
  title: 'WOPR COHERENCE ARCHIVE v3.7.42',
  description: 'Neural Terminal Interface - Coherenceism Archive System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
} 