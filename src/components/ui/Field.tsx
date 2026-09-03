import { clsx } from 'clsx'

export function Field({ label, value, placeholder, className }: { label: string; value?: string; placeholder?: string; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <span className="text-xs font-medium text-ink-300 uppercase tracking-wider">{label}</span>
      <span className={clsx('text-sm', value ? 'text-ink-50' : 'text-gold-400')}>
        {value || placeholder || '—'}
      </span>
    </div>
  )
}
