import { Slot } from '@radix-ui/react-slot'
import { cn } from '../../lib/utils'
import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react'

export interface ButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  asChild?: boolean
}

export const Button = ({ className, asChild = false, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        'bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2',
        className,
      )}
      {...props}
    />
  )
}
