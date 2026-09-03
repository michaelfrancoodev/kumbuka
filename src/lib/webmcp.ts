import type { ActivityType } from './types'

interface WebMCPTool {
  name: string
  description: string
  parameters: Record<string, { type: string; description: string; required?: boolean }>
}

export const WEBMCP_TOOLS: WebMCPTool[] = [
  {
    name: 'saveRecord',
    description: 'Save a mining activity record (payment, purchase, sale, transport, etc.) from natural language text in Swahili or English. The text is parsed into structured fields. Records are stored locally on the device.',
    parameters: {
      text: {
        type: 'string',
        description: 'Natural language description of what happened, e.g. "Leo nimempa Juma elfu arobaini na tano ya compressor"',
        required: true,
      },
    },
  },
  {
    name: 'queryRecords',
    description: 'Query saved records by date range, activity type, person name, or amount. Returns matching records with all fields. Used for answering questions like "How much did I pay Juma this month?"',
    parameters: {
      startDate: { type: 'string', description: 'ISO date string for range start' },
      endDate: { type: 'string', description: 'ISO date string for range end' },
      type: { type: 'string', description: 'Activity type: payment, purchase, sale, transport, labour, equipment, expense, income' },
      person: { type: 'string', description: 'Person name to filter by' },
    },
  },
  {
    name: 'getSummary',
    description: 'Get a financial summary for a date range: total payments, purchases, sales, transport costs, and net profit/loss. Returns structured totals computed from confirmed records only.',
    parameters: {
      range: { type: 'string', description: 'Date range type: day, week, or month' },
      date: { type: 'string', description: 'ISO date to calculate range from, defaults to today' },
    },
  },
  {
    name: 'getRecordCount',
    description: 'Get the total number of confirmed records and the count by activity type. Useful for quick status checks.',
    parameters: {},
  },
]

declare global {
  interface Navigator {
    modelContext?: {
      registerTool: (tool: {
        name: string
        description: string
        inputSchema: Record<string, unknown>
        execute: (args: Record<string, unknown>) => Promise<unknown>
      }) => void
    }
  }
}

export function isWebMVPAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.modelContext?.registerTool
}
