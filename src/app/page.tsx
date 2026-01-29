'use client'

import { AlertCircle, Copy, QrCode } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { createEphemeralIntent, createPaymentLink } from '@/actions'
import { Header } from '@/components/header'
import { PaymentForm } from '@/components/payment-form'
import { Stepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [state, setState] = useState<'form' | 'loading' | 'success'>('form')
  const [loadingStep, setLoadingStep] = useState(0)
  const [paymentUrl, setPaymentUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleFormSubmit (data: {
    token: string
    amount: string
    expiry: string
    note: string
  }) {
    try {
      setError(null)
      setState('loading')
      setTimeout(() => setLoadingStep(1), 500)
      const lamports = BigInt(
        Math.floor(parseFloat(data.amount) * 1_000_000_000),
      )
      setTimeout(() => setLoadingStep(2), 500)
      const intent = await createEphemeralIntent(lamports, 15)
      setLoadingStep(3)
      const link = await createPaymentLink(intent.id)
      setPaymentUrl(link)
        setState('success')
        toast.success('Payment link created successfully')
    
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create payment link'
      setError(message)
      setState('form')
      toast.error(message)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentUrl)
    toast.success('Link copied to clipboard')
  }

  const steps = [
    'Creating shielded address',
    'Encrypting ephemeral account',
    'Finalising payment link on Solana',
  ]

  return (
    <div className='min-h-screen bg-background'>
      <Header />
      <main className='max-w-4xl mx-auto px-6 py-12 md:py-20'>
        {state === 'form' && (
          <div className='flex flex-col items-center'>
            {error && (
              <div className='flex flex-col items-center mb-8'>
                <div className='bg-red-50 border border-red-200 rounded-lg p-4 w-full max-w-md'>
                  <div className='flex gap-3'>
                    <AlertCircle className='w-5 h-5 text-red-600 shrink-0 mt-0.5' />
                    <div>
                      <p className='font-semibold text-red-900'>Error</p>
                      <p className='text-sm text-red-800'>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className='mb-12 text-center'>
              <h1 className='text-5xl md:text-6xl font-bold text-foreground mb-4 text-balance leading-tight'>
                Create Private Payment Link
              </h1>
              <p className='text-base text-foreground/65 max-w-2xl mx-auto font-light'>
                Send and receive payments while preserving complete privacy on
                Solana
              </p>
            </div>
            <PaymentForm onSubmit={handleFormSubmit} />
          </div>
        )}

        {state === 'loading' && (
          <div className='flex flex-col items-center'>
            <div className='mb-12 text-center'>
              <h1 className='text-4xl font-bold text-foreground mb-2'>
                Generating secure link...
              </h1>
              <p className='text-foreground/60'>
                Your payment link is being prepared with full encryption
              </p>
            </div>
            <div className='w-full max-w-md bg-card rounded-xl border border-border p-8'>
              <Stepper steps={steps} currentStep={loadingStep} />
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className='flex flex-col items-center'>
            <div className='mb-8 text-center'>
              <h1 className='text-3xl font-bold text-foreground mb-2'>
                Payment Link Generated
              </h1>
              <p className='text-foreground/60'>
                Share this link to receive payment privately
              </p>
            </div>

            <div className='w-full max-w-md space-y-6'>
              <div className='flex justify-center mb-8'>
                <div className='w-48 h-48 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center'>
                  <QrCode className='w-12 h-12 text-foreground/40' />
                </div>
              </div>
              <div className='space-y-3 mb-8'>
                <p className='text-sm text-foreground/60'>
                  Your secure payment link:
                </p>
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={paymentUrl}
                    readOnly
                    className='flex-1 px-4 py-3 text-sm border rounded-lg bg-muted text-foreground/80 border-border font-mono'
                  />
                  <button
                    type='button'
                    onClick={copyToClipboard}
                    className='p-3 transition-colors border rounded-lg bg-muted hover:bg-muted/80 border-border'
                  >
                    <Copy className='w-4 h-4 text-foreground/60' />
                  </button>
                </div>
              </div>

              <div className='flex gap-3'>
                <Button
                  onClick={() => {
                    setState('form')
                    setPaymentUrl('')
                    setError(null)
                  }}
                  variant='outline'
                  className='flex-1 h-11'
                >
                  Create Another
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
