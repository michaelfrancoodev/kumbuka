import { useState } from 'react'
import { Trash2, ChevronRight, Inbox } from 'lucide-react'
import { useRecords } from '../hooks/useRecords'
import { useLang } from '../lib/lang'
import { formatMoneyShort } from '../lib/money'
import { timeAgo } from '../lib/dates'
import { ACTIVITY_LABELS, type ActivityType } from '../lib/types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Sheet } from '../components/ui/Sheet'
import { Field } from '../components/ui/Field'
import { clsx } from 'clsx'

const TYPE_DOT: Record<ActivityType, string> = {
  payment: 'bg-clay-400',
  purchase: 'bg-sky-400',
  sale: 'bg-moss-400',
  transport: 'bg-gold-400',
  labour: 'bg-clay-300',
  equipment: 'bg-ink-200',
  expense: 'bg-red-400',
  income: 'bg-moss-300',
}

export function RecordsPage() {
  const { t, lang } = useLang()
  const { records, loading, remove, clearAll } = useRecords()
  const [selected, setSelected] = useState<typeof records[0] | null>(null)
  const [filter, setFilter] = useState<ActivityType | 'all'>('all')

  const filtered = filter === 'all' ? records : records.filter(r => r.type === filter)
  const types = ['all', ...new Set(records.map(r => r.type))] as (ActivityType | 'all')[]

  return (
    <div className="min-h-screen pb-32 pt-8 px-4 max-w-lg mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-ink-50">{t('records')}</h1>
        <p className="text-sm text-ink-300 mt-1">
          {records.length} {t('recordsCount')}
        </p>
      </div>

      {records.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                filter === type
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
                  : 'bg-ink-800/50 text-ink-300 border border-ink-600/30 hover:border-ink-500/50',
              )}
            >
              {type === 'all' ? (lang === 'sw' ? 'Zote' : 'All') : lang === 'sw' ? ACTIVITY_LABELS[type as ActivityType].sw : ACTIVITY_LABELS[type as ActivityType].en}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-ink-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ink-800/50 border border-ink-600/30 mb-4">
            <Inbox className="w-7 h-7 text-ink-400" />
          </div>
          <p className="text-sm text-ink-300">{t('noRecords')}</p>
          <p className="text-xs text-ink-400 mt-1">{t('noRecordsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((record, idx) => {
            const labels = ACTIVITY_LABELS[record.type]
            return (
              <Card
                key={record.id}
                hover
                onClick={() => setSelected(record)}
                className="flex items-center gap-3 animate-slide-up"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className={clsx('w-2 h-12 rounded-full shrink-0', TYPE_DOT[record.type])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-ink-50">
                      {lang === 'sw' ? labels.sw : labels.en}
                    </span>
                    <span className="text-xs text-ink-400">·</span>
                    <span className="text-xs text-ink-300">{timeAgo(record.createdAt)}</span>
                  </div>
                  <p className="text-xs text-ink-300 truncate">
                    {record.person || record.item || '—'}
                  </p>
                </div>
                {record.amount && (
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-gold-400">{formatMoneyShort(record.amount)}</span>
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-ink-400 shrink-0" />
              </Card>
            )
          })}

          {records.length > 0 && (
            <div className="pt-4">
              <Button variant="danger" full size="sm" onClick={() => { if (confirm(t('clearAllConfirm'))) clearAll() }}>
                <Trash2 className="w-4 h-4" />
                {t('clearAll')}
              </Button>
            </div>
          )}
        </div>
      )}

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={lang === 'sw' ? 'Maelezo ya rekodi' : 'Record details'}>
        {selected && (
          <div className="space-y-4">
            <div className={clsx('inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border', TYPE_DOT[selected.type], 'bg-opacity-10')}>
              {lang === 'sw' ? ACTIVITY_LABELS[selected.type].sw : ACTIVITY_LABELS[selected.type].en}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('amount')} value={selected.amount ? formatMoneyShort(selected.amount) : '—'} />
              <Field label={t('person')} value={selected.person || '—'} />
              <Field label={t('item')} value={selected.item || '—'} />
              <Field label={t('unit')} value={selected.unit || '—'} />
            </div>
            <div>
              <span className="text-xs font-medium text-ink-300 uppercase tracking-wider">{t('originalSentence')}</span>
              <p className="text-sm text-ink-100 mt-1 italic px-3 py-2 bg-ink-900/40 rounded-lg border border-ink-700/30">
                "{selected.rawSentence}"
              </p>
            </div>
            <Button variant="danger" full onClick={() => { remove(selected.id); setSelected(null) }}>
              <Trash2 className="w-4 h-4" />
              {t('delete')}
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
