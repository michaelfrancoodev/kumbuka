import type { KumbukaRecord, PersonSummary } from "./types";

/**
 * Group confirmed records by person.
 *
 * Lives outside the People page itself because a Next.js App Router page
 * file may only export the page component (plus a small allow-list like
 * `metadata`) — any other named export fails the build.
 */
export function summariseByPerson(records: KumbukaRecord[] | undefined): PersonSummary[] | undefined {
  if (records === undefined) return undefined;

  const byName = new Map<string, PersonSummary>();

  for (const record of records) {
    if (!record.personName) continue;

    const existing = byName.get(record.personName) ?? {
      name: record.personName,
      totalOut: 0,
      totalIn: 0,
      recordCount: 0,
      lastActivity: null as string | null,
      recordIds: [] as string[],
    };

    if (record.direction === "out") existing.totalOut += record.amount ?? 0;
    if (record.direction === "in") existing.totalIn += record.amount ?? 0;

    existing.recordCount += 1;
    existing.recordIds.push(record.id);

    if (!existing.lastActivity || (record.occurredOn ?? "") > existing.lastActivity) {
      existing.lastActivity = record.occurredOn;
    }

    byName.set(record.personName, existing);
  }

  return [...byName.values()].sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""));
}
