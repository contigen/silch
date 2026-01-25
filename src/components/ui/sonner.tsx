'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className='toaster group'
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-none group-[.toaster]:rounded-none group-[.toaster]:border-2 group-[.toaster]:!p-3',
          description:
            'group-[.toast]:!text-muted-foreground font-mono text-xs',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-display font-bold rounded-none',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-display font-bold rounded-none',
          success:
            'group-[.toaster]:!border-success group-[.toaster]:!text-success group-[.toaster]:!bg-success/5',
          error:
            '!group-[.toaster]:border-destructive !group-[.toaster]:text-destructive',
          info: 'group-[.toaster]:!border-primary group-[.toaster]:!text-gray-100',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
