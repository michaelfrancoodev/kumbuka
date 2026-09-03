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

export function formatTime(epochMs: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(new Date(epochMs));
}
