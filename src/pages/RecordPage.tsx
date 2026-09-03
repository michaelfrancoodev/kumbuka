import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Sparkles, Check, X, AlertCircle } from 'lucide-react'
import { useSpeech } from '../hooks/useSpeech'
import { parseText } from '../lib/parser'
import { useRecords } from '../hooks/useRecords'
import { useLang } from '../lib/lang'
import { issueConfirmToken, commitDraft } from '../lib/db'
import { formatMoneyFull } from '../lib/money'
import { ACTIVITY_LABELS, type ActivityType, type RecordDraft, type ParsedActivity } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { clsx } from 'clsx'

const TYPE_COLORS: Record<ActivityType, string> = {
  payment: 'text-clay-400 bg-clay-500/10 border-clay-500/20',
  purchase: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  sale: 'text-moss-400 bg-moss-500/10 border-moss-500/20',
  transport: 'text-gold-400 bg-gold-500/10 border-gold-500/20',
  labour: 'text-clay-300 bg-clay-500/10 border-clay-500/20',
  equipment: 'text-ink-100 bg-ink-600/30 border-ink-500/30',
  expense: 'text-red-400 bg-red-500/10 border-red-500/20',
  income: 'text-moss-300 bg-moss-500/10 border-moss-500/20',
}

export function RecordPage() {
  const { t, lang } = useLang()
  const { add } = useRecords()
  const { listening, transcript, start, stop, reset, supported } = useSpeech()
  const [textInput, setTextInput] = useState('')
  const [drafts, setDrafts] = useState<(ParsedActivity & { id: string })[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const fullText = transcript || textInput

  useEffect(() => {
    if (transcript) setTextInput(transcript)
  }, [transcript])

  const handleParse = () => {
    if (!fullText.trim()) return
    setError('')
    const result = parseText(fullText)
    if (result.activities.length === 0) {
      setError(lang === 'sw' ? 'Sikuelewa. Jaribu tena.' : 'Could not understand. Try again.')
      return
    }
    setDrafts(result.activities.map((a, i) => ({ ...a, id: `draft-${Date.now()}-${i}` })))
  }

  const handleSave = async (draft: ParsedActivity & { id: string }) => {
    if (!draft.amount) {
      setError(lang === 'sw' ? 'Kiasi kinahitajika' : 'Amount is required')
      return
    }
    const record: RecordDraft = {
      id: crypto.randomUUID(),
      type: draft.type,
      person: draft.person,
      amount: draft.amount,
      unit: draft.unit,
      item: draft.item,
      note: draft.note,
      rawSentence: fullText,
      createdAt: Date.now(),
      confirmed: true,
    }
    const token = issueConfirmToken(record.id)
    if (!commitDraft(record.id, token)) return
    await add(record)
    setSavedIds(prev => new Set(prev).add(draft.id))
  }

  const handleDiscard = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id))
  }

  const handleClear = () => {
    setDrafts([])
    setTextInput('')
    reset()
    setError('')
    setSavedIds(new Set())
  }

  const handleMic = () => {
    if (listening) stop()
    else start()
  }

  return (
    <div className="min-h-screen pb-32 pt-8 px-4 max-w-lg mx-auto">
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span className="text-xs font-medium text-gold-300">
            {lang === 'sw' ? 'Sema kwa lugha yako' : 'Speak in your language'}
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-ink-50 text-balance">
          {t('sayWhatHappened')}
        </h1>
        <p className="text-sm text-ink-300 mt-2">
          {lang === 'sw' ? 'Kiswahili, Kiingereza, au mchanganyiko' : 'Swahili, English, or mixed'}
        </p>
      </div>

      <Card className="mb-4 animate-slide-up">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder={t('sayWhatHappened')}
            rows={3}
            className="w-full bg-transparent text-ink-50 placeholder-ink-400 text-base resize-none outline-none"
          />
          {listening && (
            <div className="absolute top-0 right-0 flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-full">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <span className="text-xs text-red-300">{t('listening')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-ink-600/30">
          {supported && (
            <button
              onClick={handleMic}
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 active:scale-90',
                listening ? 'bg-red-500/20 text-red-400' : 'bg-ink-700/50 text-ink-200 hover:text-gold-400',
              )}
            >
              {listening ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <Button onClick={handleParse} disabled={!fullText.trim()} className="flex-1">
            <Sparkles className="w-4 h-4" />
            {t('parse')}
          </Button>
        </div>
      </Card>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-slide-down">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink-200">
              {drafts.length} {lang === 'sw' ? 'rasmi' : 'drafts'}
            </span>
            <button onClick={handleClear} className="text-xs text-ink-300 hover:text-red-400 transition-colors">
              {t('cancel')}
            </button>
          </div>
          {drafts.map((draft, idx) => {
            const saved = savedIds.has(draft.id)
            const labels = ACTIVITY_LABELS[draft.type]
            return (
              <Card
                key={draft.id}
                className="animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={clsx('inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border', TYPE_COLORS[draft.type])}>
                    {lang === 'sw' ? labels.sw : labels.en}
                  </div>
                  {saved && (
                    <div className="flex items-center gap-1 text-moss-400">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-medium">{lang === 'sw' ? 'Hifadhika' : 'Saved'}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label={t('amount')} value={draft.amount ? formatMoneyFull(draft.amount) : undefined} placeholder={t('missingAmount')} />
                  <Field label={t('person')} value={draft.person} placeholder={t('missingPerson')} />
                  <Field label={t('item')} value={draft.item} placeholder={t('missingItem')} />
                  <Field label={t('unit')} value={draft.unit} />
                </div>

                {draft.note && (
                  <div className="mb-3 px-3 py-2 bg-ink-900/40 rounded-lg border border-ink-700/30">
                    <p className="text-xs text-ink-300 italic">"{draft.note}"</p>
                  </div>
                )}

                {!saved && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSave(draft)} className="flex-1">
                      <Check className="w-4 h-4" />
                      {t('save')}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDiscard(draft.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {drafts.length === 0 && !error && (
        <div className="text-center py-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ink-800/50 border border-ink-600/30 mb-4">
            <Mic className="w-7 h-7 text-ink-400" />
          </div>
          <p className="text-sm text-ink-300 max-w-xs mx-auto">
            {lang === 'sw'
              ? 'Mfano: "Leo nimempa Juma elfu arobaini na tano ya compressor"'
              : 'Example: "Today I paid Juma 45,000 for compressor"'}
          </p>
        </div>
      )}
    </div>
  )
}
