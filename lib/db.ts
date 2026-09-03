"use client";

import Dexie, { type Table } from "dexie";
import type {
  ConfirmToken,
  Draft,
  KumbukaRecord,
  Person,
  Term,
  TermKind,
} from "./types";
import { todayIso } from "./dates";

/**
 * Local storage.
 *
 * Everything lives in IndexedDB, on the device that created it. There is no
 * server database and no account — a crew leader can open the app and start
 * recording in seconds, and financial records naming real people never leave
 * the device.
 */
class KumbukaDB extends Dexie {
  records!: Table<KumbukaRecord, string>;
  drafts!: Table<Draft, string>;
  people!: Table<Person, string>;
  terms!: Table<Term, string>;
  confirmTokens!: Table<ConfirmToken, string>;

  constructor() {
    super("kumbuka");
    this.version(1).stores({
      records: "id, status, occurredOn, personName, createdAt",
      drafts: "id, createdAt",
      people: "id, &name",
      terms: "id, &term",
      confirmTokens: "token, draftId, expiresAt",
    });
  }
}

export const db = new KumbukaDB();

/* --------------------------------------------------------------------------
   Reads
   -------------------------------------------------------------------------- */

export async function confirmedRecords(limit?: number): Promise<KumbukaRecord[]> {
  const rows = await db.records
    .where("status")
    .equals("confirmed")
    .reverse()
    .sortBy("createdAt");
  return limit ? rows.slice(0, limit) : rows;
}

export async function incompleteRecords(): Promise<KumbukaRecord[]> {
  return db.records.where("status").equals("draft").reverse().sortBy("createdAt");
}

export async function recordsOnDate(iso: string): Promise<KumbukaRecord[]> {
  const rows = await db.records.where("occurredOn").equals(iso).toArray();
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export async function recordsForPerson(name: string): Promise<KumbukaRecord[]> {
  const needle = name.trim().toLowerCase();
  const rows = await db.records
    .where("status")
    .equals("confirmed")
    .filter((r) => (r.personName ?? "").toLowerCase() === needle)
    .toArray();
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export async function knownTerms(): Promise<Term[]> {
  return db.terms.toArray();
}

/* --------------------------------------------------------------------------
   People
   -------------------------------------------------------------------------- */

export async function findOrCreatePerson(name: string): Promise<Person> {
  const trimmed = name.trim();
  const existing = await db.people.where("name").equalsIgnoreCase(trimmed).first();
  if (existing) return existing;

  const person: Person = { id: crypto.randomUUID(), name: trimmed, createdAt: Date.now() };
  await db.people.add(person);
  return person;
}

/* --------------------------------------------------------------------------
   Learning a term
   -------------------------------------------------------------------------- */

export async function learnTerm(
  term: string,
  kind: TermKind,
  taughtByRecordId: string
): Promise<void> {
  const trimmed = term.trim();
  if (!trimmed) return;

  const existing = await db.terms.where("term").equalsIgnoreCase(trimmed).first();
  if (existing) {
    await db.terms.update(existing.id, { kind, taughtByRecordId });
    return;
  }

  await db.terms.add({
    id: crypto.randomUUID(),
    term: trimmed,
    kind,
    taughtByRecordId,
    createdAt: Date.now(),
  });
}

/* --------------------------------------------------------------------------
   Confirmation tokens
   -------------------------------------------------------------------------- */

const TOKEN_TTL_MS = 2 * 60 * 1000;

/** Mint a single-use token. Call only from inside a real user gesture handler. */
export async function issueConfirmToken(draftId: string): Promise<string> {
  const token = crypto.randomUUID();
  const now = Date.now();
  await db.confirmTokens.add({
    token,
    draftId,
    issuedAt: now,
    expiresAt: now + TOKEN_TTL_MS,
    spent: false,
  });
  return token;
}

/** Redeem a token exactly once. Returns the draft id it authorises, or null. */
async function redeemConfirmToken(token: string): Promise<string | null> {
  const record = await db.confirmTokens.get(token);
  if (!record) return null;
  if (record.spent) return null;
  if (Date.now() > record.expiresAt) return null;

  await db.confirmTokens.update(token, { spent: true });
  return record.draftId;
}

/** Remove expired tokens. Safe to call on every app load. */
export async function pruneTokens(): Promise<void> {
  const now = Date.now();
  await db.confirmTokens.where("expiresAt").below(now).delete();
}

/* --------------------------------------------------------------------------
   Committing a draft
   -------------------------------------------------------------------------- */

/**
 * Turn a confirmed draft into a stored record.
 *
 * Requires a token that was minted by a user gesture. Without one, or with
 * one that has expired or already been spent, nothing is written. This is
 * the only path into the records table, and it is the same path an agent
 * must take — there is no other way in.
 */
export async function commitDraft(
  draft: Draft,
  token: string
): Promise<KumbukaRecord | null> {
  const authorisedDraftId = await redeemConfirmToken(token);
  if (authorisedDraftId !== draft.id) return null;

  const person = draft.personName ? await findOrCreatePerson(draft.personName) : null;

  const now = Date.now();
  const record: KumbukaRecord = {
    id: crypto.randomUUID(),
    kind: draft.kind ?? "activity",
    direction: draft.direction,
    personId: person?.id ?? null,
    personName: person?.name ?? draft.personName,
    amount: draft.amount,
    currency: "TZS",
    quantity: draft.quantity,
    unit: draft.unit,
    purposeText: draft.purposeText,
    occurredOn: draft.occurredOn ?? todayIso(),
    originalText: draft.originalText,
    inputLanguage: draft.inputLanguage,
    source: draft.source,
    // A record missing a required field stays a draft. It appears under
    // "needs a detail" and is never counted in a total.
    status: draft.missingFields.length === 0 ? "confirmed" : "draft",
    missingFields: draft.missingFields,
    unclearSpans: draft.unclearSpans,
    confirmedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await db.records.add(record);
  await db.drafts.delete(draft.id);

  return record;
}
