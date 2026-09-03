/**
 * Money and quantity formatting.
 *
 * All amounts are stored as whole Tanzanian shillings — there are no cents in
 * everyday TZS use, and a fractional amount would only ever be a parsing
 * error, never a real figure.
 */

const TZS_FORMATTER = new Intl.NumberFormat("en-TZ", {
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number | null): string {
  if (amount === null) return "—";
  return `TSh ${TZS_FORMATTER.format(Math.round(amount))}`;
}

export function formatQuantity(quantity: number | null, unit: string | null): string {
  if (quantity === null) return "—";
  const value = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
  return unit ? `${value} ${unit}` : value;
}

export function sumAmounts(amounts: Array<number | null>): number {
  return amounts.reduce((sum: number, value) => sum + (value ?? 0), 0);
}

/** Reject figures a parser should never produce for a single sentence. */
export function isPlausibleAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount < 1_000_000_000;
}

/**
 * Parse an amount a human typed directly into an edit field.
 * Accepts digits, commas and a trailing "k" for thousands.
 */
export function parseTypedAmount(input: string): number | null {
  const trimmed = input.trim().toLowerCase().replace(/,/g, "");
  if (!trimmed) return null;

  const kMatch = trimmed.match(/^(\d+(\.\d+)?)k$/);
  if (kMatch) {
    const value = Math.round(parseFloat(kMatch[1]) * 1000);
    return isPlausibleAmount(value) ? value : null;
  }

  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Math.round(parseFloat(trimmed));
  return isPlausibleAmount(value) ? value : null;
}
