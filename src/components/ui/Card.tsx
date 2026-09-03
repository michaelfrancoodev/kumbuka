import { clsx } from 'clsx'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'glass-card p-4 transition-all duration-300',
        hover && 'hover:border-gold-500/30 hover:bg-ink-800/80 cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
