export type ActivityType = 'payment' | 'purchase' | 'sale' | 'transport' | 'labour' | 'equipment' | 'expense' | 'income'

export interface RecordDraft {
  id: string
  type: ActivityType
  person?: string
  amount?: number
  unit?: string
  item?: string
  note?: string
  rawSentence: string
  createdAt: number
  confirmed: boolean
  confirmToken?: string
}

export interface Term {
  id: string
  term: string
  meaning: string
  recordId?: string
  createdAt: number
}

export interface ParsedActivity {
  type: ActivityType
  person?: string
  amount?: number
  unit?: string
  item?: string
  note?: string
}

export interface ParseResult {
  activities: ParsedActivity[]
  unknownTerms: string[]
}

export const ACTIVITY_LABELS: Record<ActivityType, { sw: string; en: string; icon: string }> = {
  payment: { sw: 'Malipo', en: 'Payment', icon: 'hand-coins' },
  purchase: { sw: 'Ununuzi', en: 'Purchase', icon: 'shopping-cart' },
  sale: { sw: 'Mauzo', en: 'Sale', icon: 'trending-up' },
  transport: { sw: 'Usafiri', en: 'Transport', icon: 'truck' },
  labour: { sw: 'Kazi', en: 'Labour', icon: 'hard-hat' },
  equipment: { sw: 'Vifaa', en: 'Equipment', icon: 'wrench' },
  expense: { sw: 'Matumizi', en: 'Expense', icon: 'minus-circle' },
  income: { sw: 'Mapato', en: 'Income', icon: 'plus-circle' },
}
