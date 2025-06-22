import './globals.css'
import type { ReactNode } from 'react'
import Header from '../components/layout/header'
import Footer from '../components/layout/footer'
import { Inter, IBM_Plex_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono' })

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable} dark`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Header />
        <main className="max-w-3xl mx-auto p-4">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
