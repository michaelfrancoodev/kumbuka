export function startOfDay(d: Date): Date {
  const n = new Date(d)
  n.setHours(0, 0, 0, 0)
  return n
}

export function endOfDay(d: Date): Date {
  const n = new Date(d)
  n.setHours(23, 59, 59, 999)
  return n
}

export function startOfWeek(d: Date): Date {
  const n = startOfDay(d)
  const day = n.getDay()
  const diff = n.getDate() - day + (day === 0 ? -6 : 1)
  n.setDate(diff)
  return n
}

export function endOfWeek(d: Date): Date {
  const start = startOfWeek(d)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return endOfDay(end)
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function addDays(d: Date, days: number): Date {
  const n = new Date(d)
  n.setDate(n.getDate() + days)
  return n
}

export function addWeeks(d: Date, weeks: number): Date {
  return addDays(d, weeks * 7)
}

export function addMonths(d: Date, months: number): Date {
  const n = new Date(d)
  n.setMonth(n.getMonth() + months)
  return n
}

export type RangeType = 'day' | 'week' | 'month'

export interface DateRange {
  start: Date
  end: Date
  label: string
  sublabel: string
}

export function getCurrentRange(type: RangeType, ref: Date = new Date()): DateRange {
  switch (type) {
    case 'day':
      return {
        start: startOfDay(ref),
        end: endOfDay(ref),
        label: ref.toLocaleDateString('en-US', { weekday: 'long' }),
        sublabel: ref.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }
    case 'week':
      const ws = startOfWeek(ref)
      const we = endOfWeek(ref)
      return {
        start: ws,
        end: we,
        label: `Week of ${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        sublabel: `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      }
    case 'month':
      const ms = startOfMonth(ref)
      const me = endOfMonth(ref)
      return {
        start: ms,
        end: me,
        label: ref.toLocaleDateString('en-US', { month: 'long' }),
        sublabel: ref.toLocaleDateString('en-US', { year: 'numeric' }),
      }
  }
}

export function shiftRange(range: DateRange, type: RangeType, direction: -1 | 1): DateRange {
  const ref = new Date(range.start)
  switch (type) {
    case 'day':
      return getCurrentRange('day', addDays(ref, direction))
    case 'week':
      return getCurrentRange('week', addWeeks(ref, direction))
    case 'month':
      return getCurrentRange('month', addMonths(ref, direction))
  }
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'sasa hivi'
  if (mins < 60) return `dakika ${mins} iliyopita`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `saa ${hours} iliyopita`
  const days = Math.floor(hours / 24)
  if (days < 7) return `siku ${days} iliyopita`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
