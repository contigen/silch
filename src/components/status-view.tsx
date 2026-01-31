'use client'

import {
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Shield,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { ZKProofCard } from './zk-proof-card'

type PaymentStatus = {
  receiptId: string
  receiptHash: string
  createdAt: Date
  paidAt: Date | null
  claimed: boolean
  note: string | null
}

type ProofData = {
  success: boolean
  proof?: Record<string, unknown>
  publicSignals?: Record<string, unknown>
  timestamp?: string
  error?: string
}

type StatusViewProps = {
  status: PaymentStatus
  proofData?: ProofData | null
}

export function StatusView({ status, proofData }: StatusViewProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const formatDate = (date: Date) => {
    return (
      date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' • ' +
      date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    )
  }

  return (
    <div className='min-h-screen bg-background'>
      <Header />
      <main className='max-w-4xl px-6 py-12 mx-auto md:py-20'>
        <div className='flex flex-col items-center'>
          <div className='mb-12 text-center'>
            <h1 className='mb-4 text-4xl font-bold leading-tight md:text-5xl text-foreground text-balance'>
              Payment Receipt
            </h1>
            <p className='text-base font-light text-foreground/65'>
              Your private payment confirmation and verification
            </p>
          </div>

          <div className='w-full max-w-md space-y-6'>
            <div className='p-8 space-y-6 bg-white border rounded-md border-border'>
              <div className='space-y-4'>
                <div className='flex gap-4'>
                  <div className='flex flex-col items-center'>
                    <div className='flex items-center justify-center w-8 h-8 mb-2 rounded-full bg-primary/10'>
                      <CheckCircle2 className='w-5 h-5 text-primary' />
                    </div>
                    <div className='w-0.5 h-12 bg-border' />
                  </div>
                  <div className='pt-1 pb-4'>
                    <p className='mb-1 font-semibold text-foreground'>
                      Link created
                    </p>
                    <p className='text-sm text-foreground/60'>
                      {formatDate(status.createdAt)}
                    </p>
                  </div>
                </div>

                <div className='flex gap-4'>
                  <div className='flex flex-col items-center'>
                    <div
                      className={`flex items-center justify-center w-8 h-8 mb-2 rounded-full ${
                        status.paidAt ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          status.paidAt ? 'text-primary' : 'text-foreground/40'
                        }`}
                      />
                    </div>
                    <div className='w-0.5 h-12 bg-border' />
                  </div>
                  <div className='pt-1 pb-4'>
                    <p className='mb-1 font-semibold text-foreground'>
                      Payment completed
                    </p>
                    <p className='text-sm text-foreground/60'>
                      {status.paidAt ? formatDate(status.paidAt) : 'Pending'}
                    </p>
                  </div>
                </div>
                <div className='flex gap-4'>
                  <div className='flex flex-col items-center'>
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        status.claimed ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          status.claimed ? 'text-primary' : 'text-foreground/40'
                        }`}
                      />
                    </div>
                  </div>
                  <div className='pt-1'>
                    <p className='mb-1 font-semibold text-foreground'>
                      Funds available
                    </p>
                    <p className='text-sm text-foreground/60'>
                      {status.claimed ? 'Claimed' : 'Not yet claimed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {status.note && (
              <div className='p-6 bg-white border rounded-md border-border'>
                <p className='text-xs font-medium text-foreground/60 uppercase tracking-wider mb-2'>
                  Payment Note
                </p>
                <p className='text-sm text-foreground'>{status.note}</p>
              </div>
            )}
            <div className='p-8 space-y-4 bg-white border rounded-xl border-border'>
              <h2 className='flex items-center gap-2 font-semibold text-foreground'>
                <Shield className='w-5 h-5 text-primary' />
                Privacy Summary
              </h2>
              <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 rounded-lg bg-muted'>
                  <span className='text-sm text-foreground/70'>Amount</span>
                  <span className='text-sm font-semibold text-foreground/40'>
                    ●●●●●●
                  </span>
                </div>
                <div className='flex items-center justify-between p-3 rounded-lg bg-muted'>
                  <span className='text-sm text-foreground/70'>Sender</span>
                  <span className='text-sm font-semibold text-foreground/40'>
                    Unlinkable
                  </span>
                </div>
                <div className='flex items-center justify-between p-3 rounded-lg bg-muted'>
                  <span className='text-sm text-foreground/70'>Recipient</span>
                  <span className='text-sm font-semibold text-foreground/40'>
                    Unlinkable
                  </span>
                </div>
                <div className='flex items-center justify-between p-3 rounded-lg bg-muted'>
                  <span className='text-sm text-foreground/70'>Settlement</span>
                  <span className='text-sm font-semibold text-primary'>
                    On-chain verified
                  </span>
                </div>
              </div>
            </div>
            <div className='p-8 space-y-4 bg-white border rounded-xl border-border'>
              <h2 className='font-semibold text-foreground'>Receipt Details</h2>
              <div className='space-y-3'>
                <div>
                  <label
                    htmlFor='receipt-hash'
                    className='block mb-2 text-xs font-medium text-foreground/60'
                  >
                    RECEIPT HASH
                  </label>
                  <div className='flex items-center gap-2'>
                    <input
                      id='receipt-hash'
                      type='text'
                      value={status.receiptHash}
                      readOnly
                      className='flex-1 px-4 py-3 text-xs border rounded-lg bg-muted text-foreground/80 border-border'
                    />
                    <button
                      type='button'
                      onClick={() => copyToClipboard(status.receiptHash)}
                      className='p-3 transition-colors border rounded-lg bg-muted hover:bg-muted/80 border-border'
                    >
                      <Copy className='w-4 h-4 text-foreground/60' />
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor='timestamp'
                    className='block mb-2 text-xs font-medium text-foreground/60'
                  >
                    CREATED
                  </label>
                  <div
                    id='timestamp'
                    className='flex items-center gap-2 px-4 py-3 border rounded-lg bg-muted border-border'
                  >
                    <Clock className='w-4 h-4 text-foreground/60' />
                    <span className='text-sm text-foreground/80'>
                      {formatDate(status.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <p className='pt-2 text-sm text-foreground/70'>
                This receipt proves a payment occurred without revealing sender,
                recipient, or amount.
              </p>
            </div>
            <div className='flex gap-3'>
              <Button
                onClick={() =>
                  copyToClipboard(
                    `Receipt Hash: ${status.receiptHash}\nCreated: ${formatDate(status.createdAt)}\nPaid: ${status.paidAt ? formatDate(status.paidAt) : 'Pending'}\nClaimed: ${status.claimed ? 'Yes' : 'No'}`,
                  )
                }
                className='flex-1 font-semibold text-white bg-primary hover:bg-primary/90'
              >
                Copy Receipt
              </Button>
              <Button variant='outline' className='flex-1 bg-transparent'>
                <Download className='w-4 h-4 mr-2' />
                Export
              </Button>
            </div>
            {proofData?.success &&
              proofData.proof &&
              proofData.publicSignals && (
                <ZKProofCard
                  proof={{
                    transactionHash: status.receiptHash,
                    timestamp: proofData.timestamp || '',
                    amount: '●●●●●●',
                    token: 'SOL',
                    status: 'verified',
                    proofJson: {
                      proof: proofData.proof,
                      publicSignals: proofData.publicSignals,
                    },
                  }}
                />
              )}
            <Button
              variant='ghost'
              className='w-full text-foreground/70 hover:text-foreground'
            >
              <Link href='/'>Create Another Payment Link</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

export function StatusError({ error }: { error: string }) {
  return (
    <div className='min-h-screen bg-background'>
      <Header />
      <main className='max-w-4xl px-6 py-12 mx-auto md:py-20'>
        <div className='flex flex-col items-center'>
          <div className='w-full max-w-md space-y-6'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className='flex gap-3'>
                <XCircle className='w-5 h-5 text-red-600 shrink-0 mt-0.5' />
                <p className='text-sm text-red-800'>{error}</p>
              </div>
            </div>
            <Button className='w-full bg-primary hover:bg-primary/90 text-white font-semibold'>
              <Link href='/'>Go Home</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
