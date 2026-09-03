/**
 * Shared types.
 *
 * `Draft` and `KumbukaRecord` are deliberately separate. A draft is a
 * proposal that has not been seen by a human yet; a record is one that has.
 * Nothing ever becomes a record without passing through commitDraft().
 */

export type Language = "en" | "sw";

export type RecordKind = "payment" | "purchase" | "sale" | "activity" | "production";
export type Direction = "out" | "in" | null;
export type Source = "voice" | "text";
export type RecordStatus = "draft" | "confirmed";

export type MissingField =
  | "person"
  | "amount"
  | "purpose"
  | "occurredOn"
  | "quantity"
  | "unit";

export type TermKind = "person" | "place" | "activity" | "unit" | "item";

export interface UnclearSpan {
  span: string;
  question: string;
  options: TermKind[];
}

/** A phrase this device has learned from a human confirmation. */
export interface Term {
  id: string;
  term: string;
  kind: TermKind;
  taughtByRecordId: string;
  createdAt: number;
}

export interface ParsedFields {
  kind: RecordKind | null;
  direction: Direction;
  personName: string | null;
  amount: number | null;
  quantity: number | null;
  unit: string | null;
  purposeText: string | null;
  occurredOn: string | null;
  inputLanguage: "en" | "sw" | "mixed";
  missingFields: MissingField[];
  unclearSpans: UnclearSpan[];
}

/** A parsed sentence, not yet confirmed by a human. Lives in db.drafts. */
export interface Draft extends ParsedFields {
  id: string;
  originalText: string;
  source: Source;
  createdAt: number;
}

/** A confirmed record. Lives in db.records. This is the only source of truth. */
export interface KumbukaRecord extends ParsedFields {
  id: string;
  personId: string | null;
  currency: "TZS";
  originalText: string;
  source: Source;
  status: RecordStatus;
  confirmedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface Person {
  id: string;
  name: string;
  createdAt: number;
}

export interface PersonSummary {
  name: string;
  totalOut: number;
  totalIn: number;
  recordCount: number;
  lastActivity: string | null;
  recordIds: string[];
}

/** A single-use token minted by a real user gesture. Required to commit a draft. */
export interface ConfirmToken {
  token: string;
  draftId: string;
  issuedAt: number;
  expiresAt: number;
  spent: boolean;
}
