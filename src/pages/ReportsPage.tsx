import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, ShoppingCart, Truck, Coins } from 'lucide-react'
import { useRecords } from '../hooks/useRecords'
import { useLang } from '../lib/lang'
import { formatMoneyFull, formatMoneyShort } from '../lib/money'
import { getCurrentRange, shiftRange, type RangeType, type DateRange } from '../lib/dates'
import { ACTIVITY_LABELS, type ActivityType } from '../lib/types'
import { Card } from '../components/ui/Card'
import { clsx } from 'clsx'

export function ReportsPage() {
  const { t, lang } = useLang()
  const { records } = useRecords()
  const [rangeType, setRangeType] = useState<RangeType>('week')
  const [range, setRange] = useState<DateRange>(() => getCurrentRange('week'))

  const shift = (dir: -1 | 1) => setRange(shiftRange(range, rangeType, dir))

  const rangeRecords = useMemo(() => {
    return records.filter(r => r.createdAt >= range.start.getTime() && r.createdAt <= range.end.getTime())
  }, [records, range])

  const totals = useMemo(() => {
    const sum = (type: ActivityType) =>
      rangeRecords.filter(r => r.type === type).reduce((acc, r) => acc + (r.amount || 0), 0)
    return {
      payments: sum('payment'),
      purchases: sum('purchase'),
      sales: sum('sale'),
      transport: sum('transport'),
    }
  }, [rangeRecords])

  const net = totals.sales - totals.payments - totals.purchases - totals.transport

  const byType = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of rangeRecords) {
      map[r.type] = (map[r.type] || 0) + (r.amount || 0)
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [rangeRecords])

  const topPeople = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of rangeRecords) {
      if (r.person) map[r.person] = (map[r.person] || 0) + (r.amount || 0)
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [rangeRecords])

  const rangeTabs: { type: RangeType; label: string }[] = [
    { type: 'day', label: lang === 'sw' ? 'Siku' : 'Day' },
    { type: 'week', label: lang === 'sw' ? 'Wiki' : 'Week' },
    { type: 'month', label: lang === 'sw' ? 'Mwezi' : 'Month' },
  ]

  const statCards = [
    { label: t('totalPayments'), value: totals.payments, icon: Wallet, color: 'text-clay-400', bg: 'bg-clay-500/10' },
    { label: t('totalPurchases'), value: totals.purchases, icon: ShoppingCart, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: t('totalSales'), value: totals.sales, icon: Coins, color: 'text-moss-400', bg: 'bg-moss-500/10' },
    { label: t('totalTransport'), value: totals.transport, icon: Truck, color: 'text-gold-400', bg: 'bg-gold-500/10' },
  ]

  return (
    <div className="min-h-screen pb-32 pt-8 px-4 max-w-lg mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-ink-50">{t('reports')}</h1>
        <p className="text-sm text-ink-300 mt-1">
          {lang === 'sw' ? 'Hesabu kutoka rekodi zako' : 'Numbers from your records'}
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-ink-800/50 rounded-xl mb-4 border border-ink-600/30">
        {rangeTabs.map(tab => (
          <button
            key={tab.type}
            onClick={() => { setRangeType(tab.type); setRange(getCurrentRange(tab.type)) }}
            className={clsx(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
              rangeType === tab.type ? 'bg-gold-500/20 text-gold-300' : 'text-ink-300 hover:text-ink-100',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="mb-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <button onClick={() => shift(-1)} className="p-2 -ml-2 text-ink-300 hover:text-gold-400 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="font-display font-semibold text-ink-50">{range.label}</div>
            <div className="text-xs text-ink-300">{range.sublabel}</div>
          </div>
          <button onClick={() => shift(1)} className="p-2 -mr-2 text-ink-300 hover:text-gold-400 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </Card>

      <Card className={clsx('mb-4 animate-slide-up', net >= 0 ? 'border-moss-500/30' : 'border-red-500/30')}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-ink-300 uppercase tracking-wider">{t('netResult')}</span>
            <div className={clsx('font-display text-3xl font-bold mt-1', net >= 0 ? 'text-moss-400' : 'text-red-400')}>
              {net >= 0 ? '+' : ''}{formatMoneyFull(net)}
            </div>
          </div>
          <div className={clsx('p-3 rounded-xl', net >= 0 ? 'bg-moss-500/10' : 'bg-red-500/10')}>
            {net >= 0 ? <TrendingUp className="w-6 h-6 text-moss-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-ink-600/30">
          <p className="text-xs text-ink-300">
            {rangeRecords.length} {t('recordsCount')} {lang === 'sw' ? 'katika kipindi hiki' : 'in this period'}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className={clsx('inline-flex p-2 rounded-lg mb-2', stat.bg)}>
              <stat.icon className={clsx('w-4 h-4', stat.color)} />
            </div>
            <div className="text-xs text-ink-300 mb-0.5">{stat.label}</div>
            <div className={clsx('font-display text-lg font-semibold', stat.color)}>
              {formatMoneyShort(stat.value)}
            </div>
          </Card>
        ))}
      </div>

      {byType.length > 0 && (
        <Card className="mb-4 animate-slide-up">
          <h3 className="text-sm font-medium text-ink-200 mb-3">{t('activityBreakdown')}</h3>
          <div className="space-y-2">
            {byType.map(([type, amount]) => {
              const max = byType[0][1]
              const pct = (amount / max) * 100
              const labels = ACTIVITY_LABELS[type as ActivityType]
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs text-ink-300 w-20 shrink-0">{lang === 'sw' ? labels.sw : labels.en}</span>
                  <div className="flex-1 h-2 bg-ink-700/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gold-500/60 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-ink-100 w-16 text-right shrink-0">{formatMoneyShort(amount)}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {topPeople.length > 0 && (
        <Card className="animate-slide-up">
          <h3 className="text-sm font-medium text-ink-200 mb-3">{t('topPeople')}</h3>
          <div className="space-y-2">
            {topPeople.map(([name, amount], idx) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-ink-400">{idx + 1}</span>
                  <span className="text-sm text-ink-100">{name}</span>
                </div>
                <span className="text-sm font-medium text-gold-400">{formatMoneyShort(amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {rangeRecords.length === 0 && (
        <div className="text-center py-12 animate-fade-in">
          <p className="text-sm text-ink-300">{t('noResults')}</p>
        </div>
      )}
    </div>
  )
}
