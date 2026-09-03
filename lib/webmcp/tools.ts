"use client";

import { db, commitDraft, knownTerms } from "@/lib/db";
import { todayIso, startOfMonthIso } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requestConfirmation } from "./confirm";
import { beginTrace, endTrace } from "./trace";
import type { Draft, KumbukaRecord } from "@/lib/types";

/**
 * WebMCP tools. Five tools, each with one job and no overlap. They are the
 * same functions the page itself uses, so an agent operates on the data
 * rather than on the interface, and it can only ever see what this device
 * holds. Read tools return a summary, a capped set of rows and the record
 * ids behind them — never the whole table.
 */

const OUTPUT_BUDGET = 2000;

function pack(payload: unknown): string {
  const text = JSON.stringify(payload);
  if (text.length <= OUTPUT_BUDGET) return text;
  return JSON.stringify({
    ...(payload as object),
    truncated: true,
    note: "Result was shortened. Narrow the query with a date range or a name.",
  }).slice(0, OUTPUT_BUDGET);
}

function summarise(record: KumbukaRecord) {
  return {
    id: record.id,
    kind: record.kind,
    person: record.personName,
    amount: record.amount,
    currency: record.currency,
    purpose: record.purposeText,
    date: record.occurredOn,
    direction: record.direction,
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  execute: (args: Record<string, any>) => Promise<{ content: Array<{ type: "text"; text: string }> }>;
}

function textResult(value: string) {
  return { content: [{ type: "text" as const, text: value }] };
}

export function createTools(): ToolDefinition[] {
  return [
    /* 1. Prepare ---------------------------------------------------------- */
    {
      name: "prepare_record",
      description:
        "Read one sentence in any language describing a payment, purchase, sale or job, and prepare a draft " +
        "record. Shows the draft in the page for the user to confirm. Does not save anything. Returns a " +
        "draft_id and any fields that could not be determined — ask the user about those rather than filling " +
        "them in.",
      inputSchema: {
        type: "object",
        required: ["text"],
        properties: { text: { type: "string", description: "The sentence exactly as the user said it." } },
      },
      readOnlyHint: false,
      async execute({ text: sentence }) {
        const traceId = beginTrace("prepare_record", { text: sentence });

        const response = await fetch("/api/parse", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: sentence, today: todayIso(), knownTerms: await knownTerms() }),
        });

        const payload = await response.json();
        if (!payload.ok) {
          endTrace(traceId, "could not read that", [], "rejected");
          return textResult("Could not read that sentence. Ask the user to repeat it.");
        }

        const draft: Draft = {
          id: crypto.randomUUID(),
          originalText: sentence,
          source: "text",
          createdAt: Date.now(),
          ...payload.draft,
        };

        await db.drafts.add(draft);
        requestConfirmation(draft);

        endTrace(
          traceId,
          draft.missingFields.length > 0
            ? `draft prepared, ${draft.missingFields.length} field(s) missing`
            : "draft prepared, awaiting confirmation"
        );

        return textResult(
          pack({
            draft_id: draft.id,
            understood: {
              person: draft.personName,
              amount: draft.amount,
              purpose: draft.purposeText,
              date: draft.occurredOn,
            },
            missing_fields: draft.missingFields,
            unclear: draft.unclearSpans.map((span) => span.question),
            next_step: "The draft is on screen. The user must tap Save. Nothing is stored until they do.",
          })
        );
      },
    },

    /* 2. Save --------------------------------------------------------------*/
    {
      name: "save_record",
      description:
        "Save a prepared draft. Saves immediately, but only with a valid confirmation token, which is issued " +
        "when the user taps Save in the page. Never call this without a token — there is no way to obtain one " +
        "except from the user.",
      inputSchema: {
        type: "object",
        required: ["draft_id", "confirm_token"],
        properties: {
          draft_id: { type: "string" },
          confirm_token: { type: "string", description: "Issued by the page when the user taps Save." },
        },
      },
      async execute({ draft_id, confirm_token }) {
        const traceId = beginTrace("save_record", { draft_id });

        const draft = await db.drafts.get(draft_id);
        if (!draft) {
          endTrace(traceId, "no such draft", [], "rejected");
          return textResult("No draft with that id. Prepare the record first.");
        }

        const record = await commitDraft(draft, confirm_token);
        if (!record) {
          endTrace(traceId, "no valid confirmation", [], "rejected");
          return textResult(
            "Rejected: no valid confirmation. The user has not tapped Save, or the confirmation has expired. Ask them to confirm."
          );
        }

        endTrace(traceId, "saved", [record.id]);
        return textResult(
          pack({
            saved: true,
            record_id: record.id,
            summary: `${record.kind} ${record.personName ? `to ${record.personName} ` : ""}${formatMoney(record.amount)}`,
          })
        );
      },
    },

    /* 3. Search --------------------------------------------------------------*/
    {
      name: "search_records",
      description:
        "Search saved records by person, date range or free text. Returns a summary, up to 20 records and the " +
        "total count. Use this to answer questions about what happened — never answer from memory.",
      inputSchema: {
        type: "object",
        properties: {
          person: { type: "string" },
          date_from: { type: "string", description: "ISO date, YYYY-MM-DD." },
          date_to: { type: "string", description: "ISO date, YYYY-MM-DD." },
          query: { type: "string", description: "Match against the purpose." },
          limit: { type: "integer", maximum: 20, default: 20 },
        },
      },
      readOnlyHint: true,
      untrustedContentHint: true,
      async execute(args) {
        const traceId = beginTrace("search_records", args);
        const rows = await searchRecords(args);

        const totalOut = rows.filter((r) => r.direction === "out").reduce((sum, r) => sum + (r.amount ?? 0), 0);
        const totalIn = rows.filter((r) => r.direction === "in").reduce((sum, r) => sum + (r.amount ?? 0), 0);

        const capped = rows.slice(0, Math.min(args.limit ?? 20, 20));
        endTrace(traceId, `${rows.length} record${rows.length === 1 ? "" : "s"}`, capped.map((r) => r.id));

        return textResult(
          pack({
            summary: `${rows.length} records. Out ${formatMoney(totalOut)}, in ${formatMoney(totalIn)}.`,
            total_count: rows.length,
            total_out: totalOut,
            total_in: totalIn,
            records: capped.map(summarise),
            record_ids: capped.map((r) => r.id),
          })
        );
      },
    },

    /* 4. Person history --------------------------------------------------- */
    {
      name: "get_person_history",
      description:
        "Everything recorded about one person: total paid to them, total received from them, when they last " +
        "appeared, and their records.",
      inputSchema: { type: "object", required: ["name"], properties: { name: { type: "string" } } },
      readOnlyHint: true,
      untrustedContentHint: true,
      async execute({ name }) {
        const traceId = beginTrace("get_person_history", { name });
        const rows = await searchRecords({ person: name });

        if (rows.length === 0) {
          endTrace(traceId, "no records");
          return textResult(pack({ found: false, note: `No records for "${name}". Do not assume any exist.` }));
        }

        const paid = rows.filter((r) => r.direction === "out").reduce((sum, r) => sum + (r.amount ?? 0), 0);
        const received = rows.filter((r) => r.direction === "in").reduce((sum, r) => sum + (r.amount ?? 0), 0);

        endTrace(
          traceId,
          `${rows.length} record${rows.length === 1 ? "" : "s"}`,
          rows.slice(0, 20).map((r) => r.id)
        );

        return textResult(
          pack({
            found: true,
            person: rows[0].personName,
            total_paid: paid,
            total_received: received,
            record_count: rows.length,
            last_activity: rows[0].occurredOn,
            records: rows.slice(0, 20).map(summarise),
            record_ids: rows.slice(0, 20).map((r) => r.id),
          })
        );
      },
    },

    /* 5. Gaps ----------------------------------------------------------------*/
    {
      name: "find_incomplete_records",
      description:
        "Find records the user still needs to complete, with the field each one is missing. Use this to hand " +
        "work back to the user as one question at a time. Do not attempt to fill the gaps yourself.",
      inputSchema: { type: "object", properties: { limit: { type: "integer", maximum: 20, default: 10 } } },
      readOnlyHint: true,
      untrustedContentHint: true,
      async execute({ limit = 10 }) {
        const traceId = beginTrace("find_incomplete_records", { limit });
        const rows = await db.records.where("status").equals("draft").reverse().sortBy("createdAt");

        const capped = rows.slice(0, Math.min(limit, 20));
        endTrace(traceId, `${rows.length} incomplete`, capped.map((r) => r.id));

        return textResult(
          pack({
            count: rows.length,
            records: capped.map((record) => ({
              id: record.id,
              said: record.originalText,
              date: record.occurredOn,
              missing: record.missingFields,
            })),
            record_ids: capped.map((r) => r.id),
          })
        );
      },
    },
  ];
}

/**
 * Query confirmed records. Name matching is case-insensitive and exact on
 * the whole name — it never matches on a prefix, because "Juma" and
 * "Jumanne" are different people and paying the wrong one is the failure
 * this product exists to prevent.
 */
export async function searchRecords(args: {
  person?: string;
  date_from?: string;
  date_to?: string;
  query?: string;
}): Promise<KumbukaRecord[]> {
  let rows = await db.records.where("status").equals("confirmed").toArray();

  if (args.person) {
    const needle = args.person.trim().toLowerCase();
    rows = rows.filter((r) => r.personName?.toLowerCase() === needle);
  }
  if (args.date_from) rows = rows.filter((r) => (r.occurredOn ?? "") >= args.date_from!);
  if (args.date_to) rows = rows.filter((r) => (r.occurredOn ?? "") <= args.date_to!);
  if (args.query) {
    const needle = args.query.trim().toLowerCase();
    rows = rows.filter(
      (r) => r.purposeText?.toLowerCase().includes(needle) || r.originalText.toLowerCase().includes(needle)
    );
  }

  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export function monthToDate() {
  return { date_from: startOfMonthIso(), date_to: todayIso() };
}
