'use client'

import { use, useState } from 'react'
import { Header } from '@/components/header'
import { ArrowRight, Lock } from 'lucide-react'
import { connectWallet } from '@/lib/wallet'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'

export default function ConnectPage({ searchParams }: PageProps<'/connect'>) {
  const [isConnecting, setIsConnecting] = useState(false)

  const wallets = [
    { id: 'MetaMask', name: 'MetaMask', icon: '🦊' },
    { id: 'phantom', name: 'Phantom', icon: '👻' },
    { id: 'solflare', name: 'Solflare', icon: '🔥' },
    { id: 'magic-eden', name: 'Magic Eden', icon: '✨' },
  ]

  const errorParam = use(searchParams).error as string | undefined

  const router = useRouter()

  async function handleConnect() {
    setIsConnecting(true)
    const result = await connectWallet()
    setIsConnecting(false)
    if (result) {
      const { address } = result
      await signIn('credentials', {
        walletAddress: address,
      })
      toast.success('Wallet Connected', {
        description: 'Successfully connected Wallet',
      })
      router.refresh()
    } else {
      toast.error('Failed to connect wallet')
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      <Header />

      <main className='max-w-4xl mx-auto px-6 py-12 md:py-20'>
        <div className='flex flex-col items-center'>
          <div className='mb-12 text-center'>
            <h1 className='text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance leading-tight'>
              Connect Your Wallet
            </h1>
            <p
              className={`text-base text-foreground/65 max-w-md mx-auto font-light ${errorParam ? 'text-destructive' : ''}`}
            >
              {errorParam
                ? 'Authentication failed. Please try again.'
                : 'Select a wallet provider to authenticate and start creating private payment links'}
              private payment links
            </p>
          </div>

          <div className='w-full max-w-md space-y-4'>
            {wallets.map((wallet, idx) => (
              <button
                key={wallet.id}
                onClick={handleConnect}
                disabled={idx > 0}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  idx === 0
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 bg-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <span className='text-2xl'>{wallet.icon}</span>
                    <span className='font-semibold text-foreground'>
                      {wallet.name}
                    </span>
                  </div>
                  {isConnecting && idx === 0 ? (
                    <Spinner />
                  ) : (
                    <ArrowRight className='w-5 h-5 text-foreground/40' />
                  )}
                </div>
              </button>
            ))}

            <div className='mt-8 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3'>
              <div className='flex gap-2 items-start'>
                <Lock className='w-5 h-5 text-primary shrink-0 mt-0.5' />
                <div>
                  <p className='font-medium text-foreground mb-1'>
                    Secure Connection
                  </p>
                  <p className='text-sm text-foreground/70'>
                    We never store your private keys. All transactions are
                    verified on-chain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
