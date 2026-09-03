import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
}

export function Button({ variant = 'primary', size = 'md', full, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:active:scale-100',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3.5 text-base',
        variant === 'primary' && 'bg-gold-500 hover:bg-gold-400 text-ink-900 font-semibold shadow-lg shadow-gold-500/20',
        variant === 'ghost' && 'text-ink-200 hover:text-ink-50 hover:bg-ink-700/50',
        variant === 'danger' && 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
        variant === 'outline' && 'border border-ink-500/50 text-ink-100 hover:border-gold-500/50 hover:bg-ink-700/30',
        full && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
