'use client'

import React from 'react'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PrivacyIndicators } from './privacy-indicators'

type PaymentFormProps = {
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export function PaymentForm({ onSubmit, isLoading }: PaymentFormProps) {
  const [token, setToken] = useState('SOL')
  const [amount, setAmount] = useState('')
  const [expiry, setExpiry] = useState('24h')
  const [note, setNote] = useState('')

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault()
    onSubmit({ token, amount, expiry, note })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-6 w-full max-w-md bg-white border border-border rounded-md p-8'
    >
      <div className='space-y-3'>
        <label className='text-xs font-medium text-foreground/60 uppercase tracking-wider'>
          Select Token
        </label>
        <Select value={token} onValueChange={setToken}>
          <SelectTrigger className='w-full bg-muted border-border'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='SOL'>SOL (Solana)</SelectItem>
            <SelectItem value='USDC'>USDC</SelectItem>
            <SelectItem value='USDT'>USDT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-3'>
        <label className='text-xs font-medium text-foreground/60 uppercase tracking-wider'>
          Amount
        </label>
        <Input
          type='number'
          placeholder='0.00'
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className='w-full bg-muted border-border text-foreground placeholder:text-foreground/40'
          step='0.01'
          required
        />
        <p className='text-xs text-foreground/45'>
          Amount will be encrypted on-chain
        </p>
      </div>

      <div className='space-y-3'>
        <label className='text-xs font-medium text-foreground/60 uppercase tracking-wider'>
          Link Expiry
        </label>
        <Select value={expiry} onValueChange={setExpiry}>
          <SelectTrigger className='w-full bg-muted border-border'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='once'>One-time</SelectItem>
            <SelectItem value='1h'>1 hour</SelectItem>
            <SelectItem value='24h'>24 hours</SelectItem>
            <SelectItem value='custom'>Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-3'>
        <label className='text-xs font-medium text-foreground/60 uppercase tracking-wider'>
          Private Note (Optional)
        </label>
        <Input
          type='text'
          placeholder='Add a note...'
          value={note}
          onChange={e => setNote(e.target.value)}
          className='w-full bg-muted border-border text-foreground placeholder:text-foreground/40'
        />
      </div>

      <PrivacyIndicators />

      <Button
        type='submit'
        className='w-full h-11 bg-foreground hover:bg-foreground/90 text-white font-medium rounded-md'
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate payment link'}
      </Button>
    </form>
  )
}
