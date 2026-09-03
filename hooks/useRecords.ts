"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  confirmedRecords,
  db,
  incompleteRecords,
  recordsForPerson,
  recordsOnDate,
} from "@/lib/db";
import { todayIso } from "@/lib/dates";
import { sumAmounts } from "@/lib/money";

/**
 * Live views over local storage.
 *
 * `useLiveQuery` re-renders whenever the underlying IndexedDB tables change,
 * so a record saved from the capture box or by an agent tool appears in
 * every open view immediately, with no manual refresh and no shared client
 * state.
 *
 * A hook returns `undefined` while its first read is in flight. Callers
 * treat that as loading, distinct from an empty result.
 */

export function useConfirmedRecords(limit?: number) {
  return useLiveQuery(() => confirmedRecords(limit), [limit]);
}

export function useTodayRecords() {
  const today = todayIso();
  return useLiveQuery(() => recordsOnDate(today), [today]);
}

export function usePersonRecords(name: string) {
  return useLiveQuery(() => recordsForPerson(name), [name]);
}

export function useIncompleteRecords() {
  return useLiveQuery(() => incompleteRecords(), []);
}

export function usePeople() {
  return useLiveQuery(() => db.people.orderBy("name").toArray(), []);
}

/** Money in, money out and record count for today. */
export function useTodaySummary() {
  const records = useTodayRecords();

  if (!records) return undefined;

  const out = records.filter((r) => r.direction === "out");
  const inbound = records.filter((r) => r.direction === "in");

  return {
    moneyOut: sumAmounts(out.map((r) => r.amount)),
    moneyIn: sumAmounts(inbound.map((r) => r.amount)),
    count: records.length,
  };
}
