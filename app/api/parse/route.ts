import { NextResponse } from "next/server";
import { buildSystemPrompt, draftSchema } from "@/lib/prompt";
import { generateStructured } from "@/lib/gemini";
import { isPlausibleAmount } from "@/lib/money";
import { isFutureDate, isValidIsoDate } from "@/lib/dates";
import type { Term } from "@/lib/types";

/**
 * Turn one sentence into a draft record.
 *
 * Runs on the server so the API key is never present in browser code. The
 * request carries only the sentence, today's date and the terms this device
 * has learned; no stored records are sent, and nothing is written here. The
 * response is a proposal that the page will show to a person for
 * confirmation — never a saved record.
 */

export const runtime = "nodejs";

const MAX_INPUT_LENGTH = 500;

interface ParseRequest {
  text: string;
  today: string;
  knownTerms?: Term[];
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 500 });
  }

  let body: ParseRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text || text.length > MAX_INPUT_LENGTH) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  if (!isValidIsoDate(body.today)) {
    return NextResponse.json({ ok: false, error: "invalid_date" }, { status: 400 });
  }

  try {
    const parsed = await generateStructured<Record<string, unknown>>({
      apiKey,
      model: process.env.GEMINI_MODEL,
      systemInstruction: buildSystemPrompt(body.today, body.knownTerms ?? []),
      userText: text,
      schema: draftSchema,
      temperature: 0.1,
    });

    return NextResponse.json({ ok: true, draft: sanitise(parsed) });
  } catch (error) {
    // Logged in full so a 100%-failure run (every case reporting the same
    // "parse_failed") can be told apart from a real parsing/prompt problem.
    // A blanket failure like that almost always means the request to Gemini
    // itself never succeeded — an invalid or unauthorised GEMINI_API_KEY, a
    // model name the key cannot access, a quota/billing block, or the dev
    // machine's network refusing generativelanguage.googleapis.com — rather
    // than anything about the sentence that was sent.
    console.error("[/api/parse] Gemini request failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "parse_failed" }, { status: 502 });
  }
}

/**
 * Validate every field the model returned.
 *
 * The model is capable of returning something implausible even under a
 * strict schema: an amount with an extra digit, a date in the future, a name
 * that is really a whole clause. Anything that fails validation is demoted
 * to unknown and named in missingFields, so the user is asked instead of
 * being given a confident wrong answer.
 */
function sanitise(draft: Record<string, unknown>) {
  const missing = new Set<string>(
    Array.isArray(draft.missingFields) ? (draft.missingFields as string[]) : []
  );

  let amount = (draft.amount ?? null) as number | null;
  if (amount !== null && !isPlausibleAmount(Number(amount))) {
    amount = null;
    missing.add("amount");
  }

  let occurredOn = (draft.occurredOn ?? null) as string | null;
  if (occurredOn !== null) {
    if (!isValidIsoDate(occurredOn) || isFutureDate(occurredOn)) {
      occurredOn = null;
      missing.add("occurredOn");
    }
  }

  // A name is a name, not a sentence fragment.
  let personName = (draft.personName ?? null) as string | null;
  if (personName !== null) {
    const trimmed = personName.trim();
    personName = trimmed.length > 0 && trimmed.length <= 60 ? trimmed : null;
    if (personName === null) missing.add("person");
  }

  let quantity = (draft.quantity ?? null) as number | null;
  if (quantity !== null && (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0)) {
    quantity = null;
    missing.add("quantity");
  }

  const unclearSpans = Array.isArray(draft.unclearSpans)
    ? (draft.unclearSpans as unknown[]).slice(0, 2)
    : [];

  const validKinds = ["payment", "purchase", "sale", "activity", "production"];
  const kind = validKinds.includes(draft.kind as string) ? (draft.kind as string) : null;

  const validDirections = ["out", "in"];
  const direction = validDirections.includes(draft.direction as string)
    ? (draft.direction as string)
    : null;

  return {
    kind,
    direction,
    personName,
    amount,
    quantity,
    unit: (draft.unit as string) ?? null,
    purposeText: (draft.purposeText as string) ?? null,
    occurredOn,
    inputLanguage: (draft.inputLanguage as string) ?? "mixed",
    missingFields: [...missing],
    unclearSpans,
  };
}
