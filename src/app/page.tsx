'use client'

import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  Lock,
  QrCode,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { createEphemeralIntent, createPaymentLink } from '@/actions'
import { Header } from '@/components/header'
import { PaymentForm } from '@/components/payment-form'
import { Stepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [state, setState] = useState<
    'landing' | 'form' | 'loading' | 'success'
  >('landing')
  const [loadingStep, setLoadingStep] = useState(0)
  const [selectedPersona, setSelectedPersona] = useState<
    'creators' | 'freelancers' | 'p2p'
  >('creators')
  const [paymentUrl, setPaymentUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleFormSubmit = async (data: {
    token: string
    amount: string
    expiry: string
    note?: string
  }) => {
    try {
      setError(null)
      setState('loading')
      setLoadingStep(1)
      const lamports = BigInt(
        Math.floor(parseFloat(data.amount) * 1_000_000_000),
      )
      setLoadingStep(2)
      const intent = await createEphemeralIntent(lamports, 15, data.note)
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
    toast.success('Copied to clipboard')
  }

  const steps = [
    'Creating shielded address',
    'Encrypting transfer',
    'Finalising on Solana',
  ]

  const personas = {
    creators: {
      title: 'Independent Creators',
      use: 'Private Support Links',
      description:
        'Accept payments from supporters without revealing your financial history.',
      example: 'Buy-me-a-coffee style, anonymous supporter receipts',
      badge: 'Proof of support',
      copy: 'Get paid privately.',
    },
    freelancers: {
      title: 'Freelancers',
      use: 'Payment Proof',
      description:
        'Prove you were paid ≥ agreed amount with a ZK receipt, no financial details exposed.',
      example: 'Shareable ZK receipt, paid ≥ agreed amount badge',
      badge: 'Paid ≥ agreed amount',
      copy: 'Prove payment without revealing your financial history.',
    },
    p2p: {
      title: 'Peer-to-Peer',
      use: 'Simple Send & Receive',
      description:
        'Private payments with verifiable proof. No screenshots, no trust required.',
      example: 'Payment confirmed ZK receipt, simple flow',
      badge: 'Payment confirmed',
      copy: 'Private payments with verifiable proof.',
    },
  }

  const persona = personas[selectedPersona]

  return (
    <div className='min-h-screen bg-background'>
      <Header />
      <main className='max-w-6xl mx-auto px-6 py-12 md:py-20'>
        {state === 'landing' && (
          <div className='flex flex-col'>
            <div className='mb-16 text-center'>
              <h1 className='text-6xl md:text-7xl font-bold text-foreground mb-6 text-balance leading-tight'>
                Private Payments with Proof
              </h1>
              <p className='text-lg text-foreground/70 max-w-3xl mx-auto mb-8 font-light leading-relaxed'>
                Zero-knowledge receipts prove payment happened. No wallet
                tracking. No public transaction history. Only verifiable proof.
              </p>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12'>
                <div className='flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-md bg-muted/50'>
                  <Lock className='w-4 h-4 text-foreground' />
                  <span className='text-sm text-foreground/80'>
                    No wallet tracking
                  </span>
                </div>
                <div className='flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-md bg-muted/50'>
                  <Eye className='w-4 h-4 text-foreground' />
                  <span className='text-sm text-foreground/80'>
                    No public history
                  </span>
                </div>
                <div className='flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-md bg-muted/50'>
                  <CheckCircle2 className='w-4 h-4 text-foreground' />
                  <span className='text-sm text-foreground/80'>
                    ZK receipts
                  </span>
                </div>
              </div>
            </div>
            <div className='mb-16'>
              <h2 className='text-center text-2xl font-bold text-foreground mb-8'>
                How will you use Silch?
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                {(['creators', 'freelancers', 'p2p'] as const).map(p => (
                  <button
                    type='button'
                    key={p}
                    onClick={() => setSelectedPersona(p)}
                    className={`p-6 rounded-md border transition-all text-left ${
                      selectedPersona === p
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-white border-border hover:border-foreground/50'
                    }`}
                  >
                    <h3
                      className={`font-bold mb-2 ${selectedPersona === p ? 'text-background' : 'text-foreground'}`}
                    >
                      {personas[p].title}
                    </h3>
                    <p
                      className={`text-sm ${selectedPersona === p ? 'text-background/80' : 'text-foreground/70'}`}
                    >
                      {personas[p].use}
                    </p>
                  </button>
                ))}
              </div>
              <div className='bg-white border border-border rounded-md p-8 space-y-6'>
                <div>
                  <h3 className='text-lg font-bold text-foreground mb-2'>
                    {persona.title}
                  </h3>
                  <p className='text-foreground/70 leading-relaxed'>
                    {persona.description}
                  </p>
                </div>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-xs text-foreground/50 uppercase tracking-wide mb-1'>
                      Example
                    </p>
                    <p className='text-sm text-foreground/80'>
                      {persona.example}
                    </p>
                  </div>
                  <span className='px-3 py-1 rounded-md bg-foreground/10 text-foreground text-xs font-medium border border-foreground/20'>
                    {persona.badge}
                  </span>
                </div>
                <Button
                  onClick={() => setState('form')}
                  className='w-full bg-foreground hover:bg-foreground/90 text-background font-medium rounded-md'
                >
                  {persona.copy}
                </Button>
              </div>
            </div>
          </div>
        )}
        {state === 'form' && (
          <div className='flex flex-col items-center'>
            <div className='mb-12 text-center'>
              <h1 className='text-5xl md:text-6xl font-bold text-foreground mb-4 text-balance leading-tight'>
                Create Payment Link
              </h1>
              <p className='text-base text-foreground/65 max-w-2xl mx-auto font-light'>
                {persona.copy}
              </p>
              <button
                type='button'
                onClick={() => setState('landing')}
                className='text-sm text-foreground/50 hover:text-foreground/70 mt-4 underline'
              >
                Back to personas
              </button>
            </div>
            {error && (
              <div className='w-full max-w-md mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-sm text-red-800'>{error}</p>
              </div>
            )}
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
              <p className='text-foreground/60 text-sm'>
                Share this link to receive payment privately. No tracking. No
                history.
              </p>
            </div>
            <div className='w-full max-w-md space-y-6'>
              <div className='bg-white rounded-md border border-border p-8 space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold text-foreground/60 uppercase tracking-wide'>
                    Status
                  </span>
                  <span className='px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold'>
                    Unused
                  </span>
                </div>
                <div className='space-y-3'>
                  <label
                    className='text-xs font-medium text-foreground/60 uppercase tracking-wide'
                    htmlFor='payment_url'
                  >
                    Payment URL
                  </label>
                  <div className='flex items-center gap-2'>
                    <input
                      id='payment_url'
                      type='text'
                      value={paymentUrl}
                      readOnly
                      className='flex-1 px-4 py-3 rounded-lg bg-secondary text-sm font-mono text-foreground/80 border border-border'
                    />
                    <button
                      type='button'
                      onClick={copyToClipboard}
                      className='p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-colors'
                      title='Copy to clipboard'
                    >
                      <Copy className='w-4 h-4 text-foreground/60' />
                    </button>
                  </div>
                </div>
                <div className='flex justify-center py-6 px-6 bg-secondary rounded-lg border border-border'>
                  <QrCode className='w-24 h-24 text-foreground/20' />
                </div>
              </div>
              <div className='space-y-3'>
                <div className='flex gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30'>
                  <AlertCircle className='w-5 h-5 text-primary shrink-0 mt-0.5' />
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
                  <AlertCircle className='w-5 h-5 text-primary shrink-0 mt-0.5' />
                  <p className='text-sm text-foreground/80'>
                    Anyone with this link can complete the payment
                  </p>
                </div>
              </div>
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
                  onClick={() => {
                    setState('form')
                    setPaymentUrl('')
                    setError(null)
                  }}
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
