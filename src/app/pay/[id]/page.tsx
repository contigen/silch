'use client'

import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import bs58 from 'bs58'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  buildPaymentTransaction,
  getEphemeralIntent,
  submitPaymentTransaction,
  subscribeToEphemeralPayment,
} from '@/actions'
import { Header } from '@/components/header'
import { Stepper } from '@/components/stepper'
import { Button, ButtonWithSpinner } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { connectWallet } from '@/lib/wallet'

type IntentData = {
  id: string
  ephemeralAddress: string
  expectedLamports: bigint
  expiresAt: string
  claimed: boolean
  note: string | null
}

export default function PaymentPage({ params }: PageProps<'/pay/[id]'>) {
  const router = useRouter()
  const intentId = use(params).id
  const [state, setState] = useState<'info' | 'loading' | 'success' | 'error'>(
    'info',
  )
  const [error, setError] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [intentData, setIntentData] = useState<IntentData | null>(null)
  const [isLoadingIntent, setIsLoadingIntent] = useState(true)

  useEffect(() => {
    async function fetchIntent() {
      try {
        const data = await getEphemeralIntent(intentId)
        if (data.success === false && data.error) {
          throw new Error(data.error)
        }
        if (data.success && data.id && data.expiresAt)
          setIntentData({
            id: data.id,
            ephemeralAddress: data.ephemeralAddress || '',
            expectedLamports: data.expectedLamports || 0n,
            expiresAt: new Date(data.expiresAt).toLocaleString(),
            claimed: data.claimed || false,
            note: data.note || null,
          })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load payment details'
        setError(message)
        setState('error')
      } finally {
        setIsLoadingIntent(false)
      }
    }

    fetchIntent()
  }, [intentId])

  async function handleConnectWallet() {
    setIsConnecting(true)
    try {
      const result = await connectWallet()
      if (!result || !result.address) {
        throw new Error('Failed to connect wallet')
      }
      setConnectedWallet(result.address)
      toast.success('Wallet connected successfully')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect wallet'
      toast.error(message)
    } finally {
      setIsConnecting(false)
    }
  }

  async function handlePayment() {
    if (!connectedWallet) {
      setError('Wallet not connected. Please connect your wallet first.')
      toast.error('Wallet not connected')
      return
    }
    if (!intentData) {
      setError('Payment details not loaded')
      toast.error('Payment details not loaded')
      return
    }
    try {
      setError(null)
      setState('loading')
      setLoadingStep(1)
      const txData = await buildPaymentTransaction(intentId)
      if (!txData) {
        throw new Error('Failed to get transaction parameters')
      }
      setLoadingStep(2)
      const provider = window.phantom?.solana
      if (!provider) {
        throw new Error('Phantom wallet not available')
      }

      // Build the transfer instruction
      const payerKey = new PublicKey(connectedWallet)
      const recipientKey = new PublicKey(txData.recipientAddress)
      console.log(
        'Payment Amount (SOL):',
        Number(txData.lamports) / 1_000_000_000,
      )
      const instruction = SystemProgram.transfer({
        fromPubkey: payerKey,
        toPubkey: recipientKey,
        lamports: Number(txData.lamports),
      })
      const transaction = new Transaction()
      transaction.recentBlockhash = txData.blockhash
      transaction.feePayer = payerKey
      transaction.add(instruction)

      const signedTransaction = await provider.signTransaction(transaction)
      const signedBuffer = signedTransaction.serialize()
      const signedBase58 = bs58.encode(signedBuffer)

      setLoadingStep(3)
      await submitPaymentTransaction(intentId, signedBase58)
      await subscribeToEphemeralPayment(intentId)
        .then(() => toast.info('Payment confirmed on-chain'))
        .catch(err => {
          console.error('Subscription error:', err)
          toast.warning('Failed to subscribe to payment confirmation')
        })
      setState('success')
      toast.success('Payment sent successfully')
      await new Promise(resolve => setTimeout(resolve, 2_000))
      router.push(`/status/${intentId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'

      if (
        message.includes('Already claimed') ||
        message.includes('already been used')
      ) {
        toast.info('This payment has already been claimed')
      } else {
        toast.error(message)
      }

      setError(message)
      setState('error')
    }
  }

  const steps = [
    'Encrypting payment',
    'Submitting private transfer',
    'Finalising on-chain',
  ]

  return (
    <div className='min-h-screen bg-background'>
      <Header />
      <main className='max-w-4xl mx-auto px-6 py-12 md:py-20'>
        {state === 'info' && (
          <div className='flex flex-col items-center'>
            <div className='mb-12 text-center'>
              <h1 className='text-5xl md:text-6xl font-bold text-foreground mb-4 text-balance leading-tight'>
                Complete Payment
              </h1>
              <p className='text-base text-foreground/65 font-light'>
                Finalise this private payment securely
              </p>
            </div>
            {isLoadingIntent ? (
              <div className='w-full max-w-md text-center'>
                <div className='text-foreground/60 flex items-center gap-2 justify-center'>
                  <Spinner /> Loading payment details...
                </div>
              </div>
            ) : error ? (
              <div className='w-full max-w-md space-y-6'>
                <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                  <div className='flex gap-3'>
                    <AlertCircle className='w-5 h-5 text-red-600 shrink-0 mt-0.5' />
                    <p className='text-sm text-red-800'>{error}</p>
                  </div>
                </div>
                <Button variant='outline' className='w-full'>
                  <Link href='/'>Go Home</Link>
                </Button>
              </div>
            ) : (
              <div className='w-full max-w-md space-y-6'>
                <div
                  className={`bg-white rounded-md border p-8 space-y-6 ${
                    intentData?.claimed
                      ? 'border-blue-500 border-2'
                      : 'border-border'
                  }`}
                >
                  {intentData?.claimed && (
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
                      <div className='flex gap-3'>
                        <Info className='w-5 h-5 text-blue-600 shrink-0 mt-0.5' />
                        <div>
                          <p className='font-semibold text-blue-900'>
                            Payment Already Claimed
                          </p>
                          <p className='text-sm text-blue-800'>
                            This payment link has already been used and the
                            funds have been claimed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {intentData?.note && (
                    <div className='p-4 rounded-lg bg-muted border border-border'>
                      <p className='text-xs font-medium text-foreground/60 uppercase tracking-wider mb-2'>
                        Payment Note
                      </p>
                      <p className='text-sm text-foreground'>
                        {intentData.note}
                      </p>
                    </div>
                  )}

                  <div className='space-y-4'>
                    <div className='flex items-center justify-between p-4 rounded-lg bg-muted'>
                      <span className='text-sm text-foreground/60 font-medium'>
                        Amount
                      </span>
                      <span className='font-semibold text-foreground'>
                        {(
                          Number(intentData?.expectedLamports || 0) /
                          1_000_000_000
                        ).toFixed(4)}{' '}
                        SOL
                      </span>
                    </div>
                    <div className='flex items-center justify-between p-4 rounded-lg bg-muted'>
                      <span className='text-sm text-foreground/60 font-medium'>
                        Recipient
                      </span>
                      <span className='text-sm text-foreground/40 font-mono'>
                        {intentData?.ephemeralAddress?.slice(0, 8)}...
                      </span>
                    </div>
                    <div className='flex items-center justify-between p-4 rounded-lg bg-muted'>
                      <span className='text-sm text-foreground/60 font-medium'>
                        Expires
                      </span>
                      <span className='text-sm text-foreground/40'>
                        {intentData?.expiresAt || 'Loading...'}
                      </span>
                    </div>
                  </div>
                  <div className='p-4 rounded-lg bg-primary/5 border border-primary/20'>
                    <p className='text-sm text-foreground/80'>
                      <span className='font-semibold text-primary'>
                        On-chain verification
                      </span>
                      <br />
                      This payment will be verified and settled on Solana
                    </p>
                  </div>
                </div>
                <div className='space-y-4'>
                  <h2 className='text-lg font-semibold text-foreground'>
                    Connect Wallet
                  </h2>
                  {connectedWallet ? (
                    <div className='w-full h-12 px-4 py-3 border border-border rounded-lg bg-muted flex items-center justify-between'>
                      <span className='text-sm font-medium text-foreground'>
                        Connected: {connectedWallet.slice(0, 8)}...
                      </span>
                      <span className='w-2 h-2 rounded-full bg-green-500' />
                    </div>
                  ) : (
                    <ButtonWithSpinner
                      variant='outline'
                      className='w-full h-12 flex items-center justify-center gap-2 border border-border hover:bg-muted! bg-white!'
                      onClick={handleConnectWallet}
                      pending={isConnecting}
                    >
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </ButtonWithSpinner>
                  )}
                </div>
                <Button
                  onClick={handlePayment}
                  className='w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={!connectedWallet || intentData?.claimed}
                >
                  {intentData?.claimed
                    ? 'Payment Already Claimed'
                    : connectedWallet
                      ? 'Pay Privately'
                      : 'Connect Wallet First'}
                </Button>

                <p className='text-center text-sm text-foreground/60'>
                  Your wallet will be required to complete this transaction
                </p>
              </div>
            )}
          </div>
        )}

        {state === 'loading' && (
          <div className='flex flex-col items-center'>
            <div className='mb-12 text-center'>
              <h1 className='text-3xl font-bold text-foreground mb-2'>
                Processing payment...
              </h1>
              <p className='text-foreground/60'>
                Your transaction is being secured on-chain
              </p>
            </div>
            <div className='w-full max-w-md bg-white rounded-xl border border-border p-8'>
              <Stepper steps={steps} currentStep={loadingStep} />
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className='flex flex-col items-center'>
            <div className='mb-12 text-center'>
              <h1 className='text-3xl font-bold text-foreground mb-2'>
                Payment Failed
              </h1>
              <p className='text-foreground/60'>
                There was an issue processing your payment
              </p>
            </div>
            <div className='w-full max-w-md space-y-6'>
              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <div className='flex gap-3'>
                  <AlertCircle className='w-5 h-5 text-red-600 shrink-0 mt-0.5' />
                  <p className='text-sm text-red-800'>{error}</p>
                </div>
              </div>
              <Button
                onClick={() => setState('info')}
                className='w-full bg-primary hover:bg-primary/90 text-white font-semibold'
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className='flex flex-col items-center'>
            <div className='mb-8 text-center'>
              <div className='flex justify-center mb-4'>
                <div className='w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center'>
                  <CheckCircle2 className='w-10 h-10 text-primary' />
                </div>
              </div>
              <h1 className='text-3xl font-bold text-foreground mb-2'>
                Payment Completed
              </h1>
              <p className='text-lg text-foreground/60'>
                Your payment was completed privately
              </p>
            </div>
            <div className='w-full max-w-md space-y-6'>
              <div className='bg-white rounded-xl border border-border p-8 space-y-4'>
                <div className='text-center space-y-2'>
                  <p className='text-sm text-foreground/60 font-medium'>
                    STATUS
                  </p>
                  <p className='text-2xl font-bold text-primary'>Confirmed</p>
                </div>
                <div className='h-px bg-border' />
                <p className='text-center text-sm text-foreground/80'>
                  No transaction hash or payment amount was revealed. Your
                  privacy is preserved.
                </p>
              </div>

              <Button className='w-full bg-primary hover:bg-primary/90 text-white font-semibold'>
                <Link href='/'>Create Another Link</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
