import Dexie, { type Table } from 'dexie'
import type { RecordDraft, Term } from './types'

class KumbukaDB extends Dexie {
  records!: Table<RecordDraft, string>
  terms!: Table<Term, string>

  constructor() {
    super('kumbuka-db')
    this.version(1).stores({
      records: 'id, type, person, createdAt, confirmed',
      terms: 'id, term, createdAt',
    })
  }
}

export const db = new KumbukaDB()

let tokenStore: Map<string, number> = new Map()

export function issueConfirmToken(recordId: string): string {
  const token = crypto.randomUUID() + '-' + Date.now().toString(36)
  tokenStore.set(token, Date.now() + 2 * 60 * 1000)
  return token
}

export function commitDraft(recordId: string, token: string): boolean {
  const expiry = tokenStore.get(token)
  if (!expiry || Date.now() > expiry) {
    tokenStore.delete(token)
    return false
  }
  tokenStore.delete(token)
  return true
}

export async function saveRecord(draft: RecordDraft): Promise<void> {
  await db.records.put(draft)
}

export async function deleteRecord(id: string): Promise<void> {
  await db.records.delete(id)
}

export async function getAllRecords(): Promise<RecordDraft[]> {
  return db.records.orderBy('createdAt').reverse().toArray()
}

export async function getRecordsByDateRange(start: number, end: number): Promise<RecordDraft[]> {
  return db.records.where('createdAt').between(start, end, true, true).toArray()
}

export async function learnTerm(term: string, meaning: string, recordId?: string): Promise<void> {
  const existing = await db.terms.where('term').equals(term.toLowerCase()).first()
  if (existing) {
    await db.terms.update(existing.id, { meaning, recordId })
  } else {
    await db.terms.put({
      id: crypto.randomUUID(),
      term: term.toLowerCase(),
      meaning,
      recordId,
      createdAt: Date.now(),
    })
  }
}

export async function getAllTerms(): Promise<Term[]> {
  return db.terms.toArray()
}
