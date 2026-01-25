'use client'

import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

type StepperProps = {
  steps: string[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className='space-y-3'>
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isCompleted = index < currentStep

        return (
          <div key={step} className='flex items-center gap-3'>
            <div className='flex-shrink-0'>
              {isCompleted && <CheckCircle2 className='w-5 h-5 text-primary' />}
              {isActive && (
                <Loader2 className='w-5 h-5 text-primary animate-spin' />
              )}
              {!isCompleted && !isActive && (
                <Circle className='w-5 h-5 text-border' />
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                isCompleted || isActive
                  ? 'text-foreground'
                  : 'text-foreground/40'
              }`}
            >
              {step}
            </span>
          </div>
        )
      })}
    </div>
  )
}
