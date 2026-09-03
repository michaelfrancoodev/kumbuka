/**
 * Date handling.
 *
 * Every date the app stores or compares is an ISO string (YYYY-MM-DD) in the
 * Africa/Dar_es_Salaam timezone. Display formatting is the only place
 * locale-specific rendering happens.
 */

const TIMEZONE = "Africa/Dar_es_Salaam";

export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}

export function startOfMonthIso(): string {
  const today = todayIso();
  return `${today.slice(0, 7)}-01`;
}

export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

export function isFutureDate(iso: string): boolean {
  return iso > todayIso();
}

export function formatDate(iso: string | null, locale: string = "en-GB"): string {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateLong(iso: string, locale: string = "en-GB"): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

export type ReportUnit = "day" | "week" | "month" | "all";

/**
 * Turn a report filter (unit + count, e.g. "3 weeks") into a concrete,
 * deterministic ISO date range ending today. This is plain arithmetic, not
 * something a model infers — a report's range must be exactly what the
 * person picked, every time.
 *
 * "all" returns nulls, meaning no filter: the full history.
 */
export function reportRange(unit: ReportUnit, count: number): { from: string | null; to: string | null } {
  const to = todayIso();
  if (unit === "all") return { from: null, to: null };

  const end = new Date(`${to}T00:00:00Z`);
  const start = new Date(end);

  if (unit === "day") {
    start.setUTCDate(start.getUTCDate() - (count - 1));
  } else if (unit === "week") {
    start.setUTCDate(start.getUTCDate() - (count * 7 - 1));
  } else {
    start.setUTCMonth(start.getUTCMonth() - count);
    start.setUTCDate(start.getUTCDate() + 1);
  }

  const from = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(start);
  return { from, to };
}

export function formatTime(epochMs: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(new Date(epochMs));
}
