'use client'

import type React from 'react'

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
import { PrivacyBenefits } from './privacy-benefits'

type PaymentFormProps = {
  onSubmit: (data: {
    token: string
    amount: string
    expiry: string
    note: string
  }) => void
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
        <label
          className='text-xs font-medium text-foreground/60 uppercase tracking-wider'
          htmlFor='token'
        >
          Token
        </label>
        <Select value={token} onValueChange={setToken}>
          <SelectTrigger
            className='w-full bg-muted! border-border rounded-sm'
            id='token'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='SOL'>SOL (Solana)</SelectItem>
            <SelectItem value='USDC' disabled>
              USDC
            </SelectItem>
            <SelectItem value='USDT' disabled>
              USDT
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-3'>
        <label
          className='text-xs font-medium text-foreground/60 uppercase tracking-wider'
          htmlFor='amount'
        >
          Amount
        </label>
        <Input
          type='number'
          id='amount'
          placeholder='0.00'
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className='w-full bg-muted! border-border text-foreground placeholder:text-foreground/40'
          step='0.01'
          required
        />
        <p className='text-xs text-foreground/45'>Encrypted on-chain</p>
      </div>

      <div className='space-y-3'>
        <label
          className='text-xs font-medium text-foreground/60 uppercase tracking-wider'
          htmlFor='expiry'
        >
          Expiry
        </label>
        <Select value={expiry} onValueChange={setExpiry}>
          <SelectTrigger
            className='w-full bg-muted! border-border rounded-sm'
            id='expiry'
          >
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
        <label
          className='text-xs font-medium text-foreground/60 uppercase tracking-wider'
          htmlFor='note'
        >
          Private Note (Optional)
        </label>
        <Input
          type='text'
          placeholder='Add a note...'
          value={note}
          id='note'
          onChange={e => setNote(e.target.value)}
          className='w-full bg-muted! border-border text-foreground placeholder:text-foreground/40'
        />
      </div>

      <div className='border-t border-border pt-4 -mx-8 px-8'>
        <PrivacyBenefits />
      </div>

      <Button
        type='submit'
        className='w-full h-11 bg-foreground hover:bg-foreground/90 text-background font-medium rounded-sm mt-2'
        disabled={isLoading}
      >
        {isLoading ? 'Creating link...' : 'Create link'}
      </Button>
    </form>
  )
}
