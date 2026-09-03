import { clsx } from 'clsx'

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-lg bg-ink-800 border border-ink-600/50 rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto no-scrollbar animate-slide-up safe-bottom"
        onClick={e => e.stopPropagation()}
      >
        {title && <h3 className="font-display text-lg font-semibold text-ink-50 mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('bg-ink-700/40 rounded-lg animate-pulse', className)} />
}

export function StatusDot({ active, label }: { active: boolean; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={clsx('w-2 h-2 rounded-full', active ? 'bg-moss-400 animate-pulse-gold' : 'bg-ink-400')} />
      {label && <span className="text-xs text-ink-200">{label}</span>}
    </div>
  )
}
