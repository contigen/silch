'use client'

import { CheckCircle2, Copy } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type ZKProofCardProps = {
  proof: {
    transactionHash: string
    timestamp: string
    amount: string
    token: string
    status: 'completed' | 'verified' | 'pending'
    proofJson: Record<string, unknown>
  }
}

export function ZKProofCard({ proof }: ZKProofCardProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const copyProof = () => {
    navigator.clipboard.writeText(JSON.stringify(proof.proofJson, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const proofJsonString = JSON.stringify(proof.proofJson, null, 2)

  function downloadProof() {
    const blob = new Blob([proofJsonString], { type: `application/json` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'zkReceiptProof.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className='bg-white border border-border rounded-xl p-8 space-y-6'>
      <div className='flex items-start justify-between'>
        <div className='flex items-start gap-3'>
          <div>
            <h3 className='font-bold text-foreground mb-1'>
              ZK Proof of Payment
            </h3>
            <p className='text-xs text-foreground/60'>
              Zero-knowledge verified transaction receipt
            </p>
          </div>
        </div>
        <span className='px-3 py-1 rounded-md bg-foreground/10 text-foreground text-xs font-medium border border-foreground/20 flex items-center gap-1.5'>
          <CheckCircle2 className='w-3 h-3' />
          Verified
        </span>
      </div>
      <div className='grid grid-cols-2 gap-4 py-4 border-y border-border'>
        <div>
          <p className='text-xs text-foreground/50 uppercase tracking-wide mb-1'>
            Amount
          </p>
          <p className='font-mono text-sm font-semibold text-foreground'>
            {proof.amount} {proof.token}
          </p>
        </div>
        <div>
          <p className='text-xs text-foreground/50 uppercase tracking-wide mb-1'>
            Timestamp
          </p>
          <p className='font-mono text-sm text-foreground/80'>
            {proof.timestamp}
          </p>
        </div>
      </div>
      <div className='space-y-2'>
        <p className='text-xs text-foreground/50 uppercase tracking-wide'>
          Transaction
        </p>
        <div className='flex items-center gap-2 p-3 bg-muted rounded-sm border border-border/50'>
          <code className='text-xs text-foreground/70 flex-1 break-all font-mono'>
            {proof.transactionHash}
          </code>
          <button
            type='button'
            onClick={() => {
              navigator.clipboard.writeText(proof.transactionHash)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className='shrink-0 p-2 hover:bg-muted/80 rounded transition-colors'
            title='Copy transaction hash'
          >
            <Copy className='w-4 h-4 text-foreground/50' />
          </button>
        </div>
      </div>
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <p className='text-xs text-foreground/50 uppercase tracking-wide'>
            Zero-Knowledge Proof
          </p>
          <button
            type='button'
            onClick={() => setExpanded(!expanded)}
            className='text-xs text-foreground/60 hover:text-foreground transition-colors'
          >
            {expanded ? 'Hide' : 'Show'} JSON
          </button>
        </div>
        {expanded && (
          <div className='p-4 bg-muted rounded-sm border border-border/50 overflow-x-auto'>
            <pre className='text-xs text-foreground/80 whitespace-pre-wrap wrap-break-word font-mono'>
              {proofJsonString}
            </pre>
          </div>
        )}
      </div>
      <div className='flex gap-3 pt-2'>
        <Button
          onClick={copyProof}
          className='flex-1 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-sm'
        >
          {copied ? 'Copied!' : 'Copy Proof'}
        </Button>
        <Button
          variant='outline'
          className='flex-1 rounded-sm bg-transparent'
          onClick={downloadProof}
        >
          Download
        </Button>
      </div>
      <p className='text-xs text-foreground/50 pt-2'>
        This proof can be shared to verify payment occurred without revealing
        sensitive wallet or amount details.
      </p>
    </div>
  )
}
