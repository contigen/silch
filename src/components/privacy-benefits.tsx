import { Eye, Lock, Shield } from 'lucide-react'

export function PrivacyBenefits() {
  const benefits = [
    {
      icon: Lock,
      title: 'No Wallet Tracking',
      description: 'Your wallet address stays private',
    },
    {
      icon: Eye,
      title: 'No Public History',
      description: "Transactions don't appear on-chain",
    },
    {
      icon: Shield,
      title: 'Zero-Knowledge Receipts',
      description: 'Proof without revealing details',
    },
  ]

  return (
    <div className='space-y-3 pt-4'>
      {benefits.map((benefit, idx) => (
        <div key={idx} className='flex gap-3 text-sm'>
          <benefit.icon className='size-4 text-foreground/60 shrink-0 mt-0.5' />
          <div>
            <p className='font-medium text-foreground/80'>{benefit.title}</p>
            <p className='text-foreground/50'>{benefit.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
