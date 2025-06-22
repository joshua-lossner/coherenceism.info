import './globals.css'
import type { ReactNode } from 'react'
import Header from '../components/layout/header'
import Footer from '../components/layout/footer'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Header />
        <main className="max-w-3xl mx-auto p-4">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
