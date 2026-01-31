'use client'

import { Rocket } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export function Header() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user.walletAddress
  return (
    <header className='border-b border-border sticky top-0 z-50 bg-background/98 backdrop-blur-sm'>
      <div
        className={`max-w-4xl mx-auto px-6 py-5 flex items-center ${isLoggedIn ? 'justify-center' : 'justify-between'}`}
      >
        <Link
          href='/'
          className='flex items-center gap-2 hover:opacity-70 transition-opacity'
        >
          <Rocket className='size-4 text-primary' />
          <span className='text-lg font-semibold text-foreground'>Silch</span>
        </Link>
        <div hidden={isLoggedIn}>
          <Link
            href='/connect'
            className='text-sm font-medium text-foreground/70 hover:text-foreground transition-colors'
          >
            Connect
          </Link>
        </div>
      </div>
    </header>
  )
}
