'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { PaymentForm } from '@/components/payment-form'
import { Stepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import { Copy, QrCode, AlertCircle } from 'lucide-react'

const MOCK_PAYMENT_ID = 'link_7x9k2m4q8n'
const MOCK_PAYMENT_URL = `https://silch.vercel.app/pay/${MOCK_PAYMENT_ID}`

export default function Home() {
  const [state, setState] = useState<'form' | 'loading' | 'success'>('form')
  const [loadingStep, setLoadingStep] = useState(0)

  const handleFormSubmit = async (data: any) => {
    setState('loading')
    setLoadingStep(0)

    // Simulate steps
    setTimeout(() => setLoadingStep(1), 800)
    setTimeout(() => setLoadingStep(2), 1600)
    setTimeout(() => {
      setLoadingStep(3)
      setState('success')
    }, 2400)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(MOCK_PAYMENT_URL)
  }

  const steps = [
    'Creating shielded address',
    'Encrypting transfer',
    'Finalising on Solana',
  ]

  return (
    <div className='min-h-screen bg-background'>
      <Header />

      <main className='max-w-4xl mx-auto px-6 py-12 md:py-20'>
        {state === 'form' && (
          <div className='flex flex-col items-center'>
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
              {/* Payment Link Card */}
              <div className='bg-card rounded-xl border border-border p-8 space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-foreground/60 uppercase tracking-wide'>
                    Status
                  </span>
                  <span className='px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold'>
                    Unused
                  </span>
                </div>

                <div className='space-y-3'>
                  <label className='text-xs font-medium text-foreground/60 uppercase tracking-wide'>
                    Payment URL
                  </label>
                  <div className='flex items-center gap-2'>
                    <input
                      type='text'
                      value={MOCK_PAYMENT_URL}
                      readOnly
                      className='flex-1 px-4 py-3 rounded-lg bg-secondary text-sm text-foreground/80 border border-border'
                    />
                    <button
                      onClick={copyToClipboard}
                      className='p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-colors'
                      title='Copy to clipboard'
                    >
                      <Copy className='w-4 h-4 text-foreground/60' />
                    </button>
                  </div>
                </div>

                {/* QR Code Placeholder */}
                <div className='flex justify-center py-6 px-6 bg-secondary rounded-lg border border-border'>
                  <QrCode className='w-24 h-24 text-foreground/20' />
                </div>
              </div>

              {/* Warnings */}
              <div className='space-y-3'>
                <div className='flex gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30'>
                  <AlertCircle className='w-5 h-5 text-primary flex-shrink-0 mt-0.5' />
                  <div className='text-sm text-foreground/80'>
                    <p className='font-medium text-foreground mb-1'>
                      This link can only be used once
                    </p>
                    <p className='text-foreground/70'>
                      After payment, the link will be automatically invalidated
                    </p>
                  </div>
                </div>

                <div className='flex gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30'>
                  <AlertCircle className='w-5 h-5 text-primary flex-shrink-0 mt-0.5' />
                  <p className='text-sm text-foreground/80'>
                    Anyone with this link can complete the payment
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className='flex gap-3 pt-4'>
                <Button
                  onClick={copyToClipboard}
                  className='flex-1 bg-primary hover:bg-primary/90 text-white font-semibold'
                >
                  Copy Link
                </Button>
                <Button
                  variant='outline'
                  className='flex-1 bg-transparent'
                  onClick={() => setState('form')}
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
