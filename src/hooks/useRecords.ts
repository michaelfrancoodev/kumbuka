import { useState, useEffect, useCallback } from 'react'
import { db, getAllRecords, saveRecord, deleteRecord } from '../lib/db'
import type { RecordDraft } from '../lib/types'

export function useRecords() {
  const [records, setRecords] = useState<RecordDraft[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const all = await getAllRecords()
    setRecords(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = useCallback(async (draft: RecordDraft) => {
    await saveRecord(draft)
    await refresh()
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    await deleteRecord(id)
    await refresh()
  }, [refresh])

  const clearAll = useCallback(async () => {
    await db.records.clear()
    await refresh()
  }, [refresh])

  return { records, loading, refresh, add, remove, clearAll }
}
