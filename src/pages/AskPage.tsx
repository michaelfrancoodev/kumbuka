import { useState, useMemo } from 'react'
import { Search, MessageSquare, Zap, Bot } from 'lucide-react'
import { useRecords } from '../hooks/useRecords'
import { useLang } from '../lib/lang'
import { formatMoneyFull, formatMoneyShort } from '../lib/money'
import { timeAgo } from '../lib/dates'
import { ACTIVITY_LABELS, type ActivityType, type RecordDraft } from '../lib/types'
import { Card } from '../components/ui/Card'
import { isWebMVPAvailable } from '../lib/webmcp'
import { clsx } from 'clsx'

interface QueryResult {
  question: string
  records: RecordDraft[]
  summary: string
}

export function AskPage() {
  const { t, lang } = useLang()
  const { records } = useRecords()
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const webmcpReady = isWebMVPAvailable()

  const sampleQuestions = lang === 'sw'
    ? ['Nilipa Juma kiasi kipii mwezi huu?', 'Matumizi ya usafiri yote?', 'Mauzo yote wiki hii?', 'Nani nilimpaga zaidi?']
    : ['How much did I pay Juma this month?', 'Total transport costs?', 'All sales this week?', 'Who did I pay the most?']

  const handleSearch = (q?: string) => {
    const query = q || question
    if (!query.trim()) return
    setLoading(true)

    const lower = query.toLowerCase()
    const filtered = records.filter(r => {
      if (r.person && lower.includes(r.person.toLowerCase())) return true
      if (lower.includes('usafiri') || lower.includes('transport')) return r.type === 'transport'
      if (lower.includes('malipo') || lower.includes('payment') || lower.includes('paid')) return r.type === 'payment'
      if (lower.includes('mauzo') || lower.includes('sale')) return r.type === 'sale'
      if (lower.includes('ununuzi') || lower.includes('purchase') || lower.includes('bought')) return r.type === 'purchase'
      return false
    })

    const totalAmount = filtered.reduce((acc, r) => acc + (r.amount || 0), 0)
    let summary: string

    if (filtered.length === 0) {
      summary = lang === 'sw' ? 'Sikupata rekodi inayofanana na swali lako.' : 'No records matching your question.'
    } else if (lower.includes('kiasi') || lower.includes('how much') || lower.includes('total')) {
      summary = lang === 'sw'
        ? `Rekodi ${filtered.length}, jumla ${formatMoneyFull(totalAmount)}`
        : `${filtered.length} records, total ${formatMoneyFull(totalAmount)}`
    } else {
      const typeCount: Record<string, number> = {}
      filtered.forEach(r => { typeCount[r.type] = (typeCount[r.type] || 0) + 1 })
      const breakdown = Object.entries(typeCount).map(([type, count]) => {
        const labels = ACTIVITY_LABELS[type as ActivityType]
        return `${lang === 'sw' ? labels.sw : labels.en}: ${count}`
      }).join(', ')
      summary = lang === 'sw' ? `Nimepata rekodi ${filtered.length} (${breakdown})` : `Found ${filtered.length} records (${breakdown})`
    }

    setTimeout(() => {
      setResult({ question: query, records: filtered, summary })
      setLoading(false)
    }, 300)
  }

  return (
    <div className="min-h-screen pb-32 pt-8 px-4 max-w-lg mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-ink-50">{t('ask')}</h1>
        <p className="text-sm text-ink-300 mt-1">
          {lang === 'sw' ? 'Uliza kuhusu rekodi zako' : 'Ask about your records'}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-ink-800/50 rounded-xl border border-ink-600/30">
        <div className={clsx('w-2 h-2 rounded-full', webmcpReady ? 'bg-moss-400 animate-pulse-gold' : 'bg-ink-400')} />
        <span className="text-xs text-ink-300">
          {webmcpReady ? t('webmcpActive') : t('webmcpStatus')}
        </span>
        <div className="ml-auto flex items-center gap-1 text-ink-400">
          <Bot className="w-3.5 h-3.5" />
          <span className="text-xs">WebMCP</span>
        </div>
      </div>

      <Card className="mb-4 animate-slide-up">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-ink-400 shrink-0" />
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={t('askPlaceholder')}
            className="flex-1 bg-transparent text-ink-50 placeholder-ink-400 text-sm outline-none"
          />
          <button
            onClick={() => handleSearch()}
            disabled={!question.trim() || loading}
            className="px-3 py-1.5 bg-gold-500/20 text-gold-300 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-gold-500/30 transition-all"
          >
            {lang === 'sw' ? 'Tafuta' : 'Search'}
          </button>
        </div>
      </Card>

      {!result && !loading && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-xs text-ink-400 px-1">{lang === 'sw' ? 'Maulizo yanayoweza kukusaidia:' : 'Try asking:'}</p>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => { setQuestion(q); handleSearch(q) }}
              className="w-full text-left p-3 bg-ink-800/40 hover:bg-ink-800/70 border border-ink-600/30 hover:border-gold-500/30 rounded-xl text-sm text-ink-200 transition-all duration-200 flex items-center gap-2 group"
            >
              <MessageSquare className="w-4 h-4 text-ink-400 group-hover:text-gold-400 transition-colors" />
              {q}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-3 animate-fade-in">
          <div className="h-20 bg-ink-800/40 rounded-2xl animate-pulse" />
          <div className="h-20 bg-ink-800/40 rounded-2xl animate-pulse" />
        </div>
      )}

      {result && !loading && (
        <div className="space-y-3 animate-slide-up">
          <Card className="border-gold-500/20 bg-gold-500/5">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-ink-100 font-medium mb-1">"{result.question}"</p>
                <p className="text-sm text-gold-300">{result.summary}</p>
              </div>
            </div>
          </Card>

          <div className="text-xs text-ink-400 px-1">{t('evidence')}</div>

          {result.records.length > 0 ? (
            result.records.map((record, idx) => {
              const labels = ACTIVITY_LABELS[record.type]
              return (
                <Card key={record.id} className="animate-slide-up" style={{ animationDelay: `${idx * 30}ms` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink-50">
                      {lang === 'sw' ? labels.sw : labels.en}
                    </span>
                    <span className="text-xs text-ink-400">{timeAgo(record.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-ink-300">
                      {record.person && <span>{record.person} · </span>}
                      {record.item && <span>{record.item}</span>}
                    </div>
                    {record.amount && (
                      <span className="text-sm font-semibold text-gold-400">{formatMoneyShort(record.amount)}</span>
                    )}
                  </div>
                </Card>
              )
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-ink-300">{t('noResults')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
