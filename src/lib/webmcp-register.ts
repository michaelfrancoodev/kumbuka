import { isWebMVPAvailable } from './webmcp'
import { getAllRecords, getRecordsByDateRange, saveRecord } from './db'
import { parseText } from './parser'
import { getCurrentRange, type RangeType } from './dates'
import type { RecordDraft } from './types'

export function registerWebMCPTools() {
  if (!isWebMVPAvailable()) return
  const mc = navigator.modelContext!

  mc.registerTool({
    name: 'saveRecord',
    description: 'Save a mining activity record from natural language text in Swahili or English.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Natural language description of what happened' },
      },
      required: ['text'],
    },
    execute: async (args: Record<string, unknown>) => {
      const text = args.text as string
      const result = parseText(text)
      const saved: RecordDraft[] = []
      for (const activity of result.activities) {
        const record: RecordDraft = {
          id: crypto.randomUUID(),
          type: activity.type,
          person: activity.person,
          amount: activity.amount,
          unit: activity.unit,
          item: activity.item,
          note: activity.note,
          rawSentence: text,
          createdAt: Date.now(),
          confirmed: true,
        }
        await saveRecord(record)
        saved.push(record)
      }
      return { saved: saved.length, records: saved.map(r => ({ id: r.id, type: r.type, amount: r.amount, person: r.person })) }
    },
  })

  mc.registerTool({
    name: 'queryRecords',
    description: 'Query saved records by date range, activity type, or person name.',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'ISO date string for range start' },
        endDate: { type: 'string', description: 'ISO date string for range end' },
        type: { type: 'string', description: 'Activity type filter' },
        person: { type: 'string', description: 'Person name filter' },
      },
    },
    execute: async (args: Record<string, unknown>) => {
      let records = await getAllRecords()
      if (args.startDate && args.endDate) {
        records = await getRecordsByDateRange(
          new Date(args.startDate as string).getTime(),
          new Date(args.endDate as string).getTime(),
        )
      }
      if (args.type) records = records.filter(r => r.type === args.type)
      if (args.person) records = records.filter(r => r.person?.toLowerCase().includes((args.person as string).toLowerCase()))
      return { count: records.length, records }
    },
  })

  mc.registerTool({
    name: 'getSummary',
    description: 'Get a financial summary for a date range: totals by type and net result.',
    inputSchema: {
      type: 'object',
      properties: {
        range: { type: 'string', description: 'day, week, or month' },
        date: { type: 'string', description: 'ISO date to calculate from' },
      },
    },
    execute: async (args: Record<string, unknown>) => {
      const rangeType = (args.range as RangeType) || 'week'
      const ref = args.date ? new Date(args.date as string) : new Date()
      const { start, end } = getCurrentRange(rangeType, ref)
      const records = await getRecordsByDateRange(start.getTime(), end.getTime())
      const sum = (type: string) => records.filter(r => r.type === type).reduce((a, r) => a + (r.amount || 0), 0)
      return {
        period: { start: start.toISOString(), end: end.toISOString() },
        totals: {
          payments: sum('payment'),
          purchases: sum('purchase'),
          sales: sum('sale'),
          transport: sum('transport'),
        },
        net: sum('sale') - sum('payment') - sum('purchase') - sum('transport'),
        recordCount: records.length,
      }
    },
  })

  mc.registerTool({
    name: 'getRecordCount',
    description: 'Get total record count and breakdown by activity type.',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      const records = await getAllRecords()
      const byType: Record<string, number> = {}
      records.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1 })
      return { total: records.length, byType }
    },
  })
}
