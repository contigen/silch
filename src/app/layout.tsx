import { GeistMono } from 'geist/font/mono'
import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Silch',
  description: 'Generate private, one-time payment links on Solana',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${GeistMono.className} ${GeistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider session={session}>{children}</SessionProvider>
        <Toaster closeButton />
      </body>
    </html>
  )
}
