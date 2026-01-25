import React from 'react'
import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Silch',
  description: 'Generate private, one-time payment links on Solana',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`${GeistMono.className} antialiased`}>{children}</body>
    </html>
  )
}
