import type { ActivityType, ParseResult, ParsedActivity } from './types'

const UNITS: Record<string, string> = {
  'gramu': 'g',
  'gram': 'g',
  'g': 'g',
  'kilo': 'kg',
  'kilogramu': 'kg',
  'kg': 'kg',
  'tola': 'tola',
  'tub': 'tub',
  'tubi': 'tub',
  'lita': 'L',
  'liter': 'L',
  'l': 'L',
}

const NUMBER_WORDS: Record<string, number> = {
  'sifuri': 0, 'zero': 0,
  'moja': 1, 'one': 1,
  'mbili': 2, 'two': 2,
  'tatu': 3, 'three': 3,
  'nne': 4, 'four': 4,
  'tano': 5, 'five': 5,
  'sita': 6, 'six': 6,
  'saba': 7, 'seven': 7,
  'nane': 8, 'eight': 8,
  'tisa': 9, 'nine': 9,
  'kumi': 10, 'ten': 10,
  'ishirini': 20, 'twenty': 20,
  'thelathini': 30, 'thirty': 30,
  'arobaini': 40, 'forty': 40,
  'hamsini': 50, 'fifty': 50,
  'sitini': 60, 'sixty': 60,
  'sabini': 70, 'seventy': 70,
  'themini': 80, 'eighty': 80,
  'tisini': 90, 'ninety': 90,
  'mia': 100, 'hundred': 100,
  'elfu': 1000, 'thousand': 1000,
  'laki': 100000,
  'milioni': 1000000, 'million': 1000000,
}

const TYPE_KEYWORDS: Record<string, string[]> = {
  payment: ['nilipa', 'nimelipa', 'nimpaa', 'nimempa', 'alipwa', 'malipo', 'paid', 'pay', 'gave', 'nikampa'],
  purchase: ['ninanunua', 'nikanunua', 'nimenunua', 'nunua', 'bought', 'buy', 'purchased'],
  sale: ['nikauza', 'nimeuza', 'uza', ' sold', 'sell', 'sale'],
  transport: ['usafiri', 'boda', 'motorbike', 'pikipiki', 'gari', 'transport', 'nikatuma', 'nikapeleka'],
  labour: ['kazi', 'fundi', 'crew', 'wafanyakazi', 'labour', 'labor'],
  equipment: ['compressor', 'compressor', 'vifaa', 'machine', 'jackhammer', 'pump', 'generator'],
  expense: ['matumizi', 'expense', 'gharama', 'cost'],
  income: ['mapato', 'income', 'faida', 'profit'],
}

function parseNumberWords(text: string): number | null {
  const words = text.toLowerCase().split(/\s+/)
  let total = 0
  let current = 0
  let found = false

  for (const w of words) {
    const clean = w.replace(/[^a-z]/g, '')
    if (NUMBER_WORDS[clean] !== undefined) {
      found = true
      const val = NUMBER_WORDS[clean]
      if (val === 100000 || val === 1000000) {
        total += (current || 1) * val
        current = 0
      } else if (val === 100 || val === 1000) {
        current = (current || 1) * val
      } else {
        current += val
      }
    } else if (/^\d+$/.test(clean)) {
      found = true
      current += parseInt(clean)
    } else if (found && current > 0) {
      total += current
      current = 0
    }
  }
  total += current
  return found ? total : null
}

function extractDigitNumber(text: string): number | null {
  const match = text.match(/(\d[\d,]*)/)
  if (match) {
    return parseInt(match[1].replace(/,/g, ''))
  }
  return null
}

function extractAmount(text: string): number | null {
  const digit = extractDigitNumber(text)
  if (digit !== null) return digit
  return parseNumberWords(text)
}

function extractUnit(text: string): string | undefined {
  const lower = text.toLowerCase()
  for (const [word, unit] of Object.entries(UNITS)) {
    if (lower.includes(word)) return unit
  }
  return undefined
}

function detectType(text: string): string {
  const lower = text.toLowerCase()
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return type
    }
  }
  return 'expense'
}

function extractPerson(text: string): string | undefined {
  const patterns = [
    /(?:n(?:im|ilim|ikam)?pa|nikampa|alipwa|nimempa|nilipa)\s+([A-Z][a-z]+)/,
    /(?:kwa|to|from|kwa\s+ajili\s+ya)\s+([A-Z][a-z]+)/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1]
  }
  return undefined
}

function extractItem(text: string): string | undefined {
  const patterns = [
    /(?:nikanunua|ninanunua|nimenunua|nunua|bought|buy)\s+([\w\s]+?)(?:\s+kwa|\s+for|\s+at|\s*$)/,
    /(?:nikauza|nimeuza|uza|sold|sell)\s+([\w\s]+?)(?:\s+kwa|\s+for|\s+at|\s*$)/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].trim()
  }
  return undefined
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?:\.\s+|\.\s*$|,\s+na\s+|halafu\s+|then\s+|;\s+)/i)
    .map(s => s.trim())
    .filter(s => s.length > 3)
}

export function parseText(text: string): ParseResult {
  const sentences = splitSentences(text)
  const activities: ParsedActivity[] = []
  const unknownTerms: string[] = []

  if (sentences.length === 0) {
    sentences.push(text)
  }

  for (const sentence of sentences) {
    const type = detectType(sentence) as ActivityType
    const amount = extractAmount(sentence)
    const unit = extractUnit(sentence)
    const person = extractPerson(sentence)
    const item = extractItem(sentence)

    if (!amount && !person && !item) {
      continue
    }

    activities.push({
      type,
      person,
      amount: amount ?? undefined,
      unit,
      item,
      note: sentence,
    })
  }

  return { activities, unknownTerms }
}
