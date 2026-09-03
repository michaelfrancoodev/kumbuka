import { NextResponse } from "next/server";
import { generateStructured, generateText } from "@/lib/gemini";

/**
 * Answering, in two steps.
 *
 * `plan`   — decide which tool answers the question, and with what arguments.
 * `answer` — turn a tool result into one plain sentence.
 *
 * The tool itself runs in the browser, against local storage, between the
 * two calls. Records are never uploaded: the model sees the question, then a
 * bounded result, and nothing else. If a question cannot be answered from
 * that result, the model must say so rather than reason from what it
 * remembers.
 */

export const runtime = "nodejs";

const planSchema = {
  type: "object",
  additionalProperties: false,
  required: ["tool", "person", "date_from", "date_to", "query"],
  properties: {
    tool: {
      type: "string",
      enum: ["search_records", "get_person_history", "find_incomplete_records"],
    },
    person: { type: ["string", "null"] },
    date_from: { type: ["string", "null"] },
    date_to: { type: ["string", "null"] },
    query: { type: ["string", "null"] },
  },
} as const;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.mode || !body?.question) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    if (body.mode === "plan") {
      const plan = await generateStructured({
        apiKey,
        model: process.env.GEMINI_MODEL,
        temperature: 0,
        schema: planSchema,
        systemInstruction: `Choose the one tool that answers the question.

TODAY IS ${body.today}.

  get_person_history        a question about one named person
  find_incomplete_records    a question about gaps or unfinished records
  search_records              everything else

Fill only the arguments the question states. Resolve "this month" to the
first of the current month through today, and "this week" to the last seven
days. Leave anything the question does not state as null. Do not invent a
name.`,
        userText: body.question,
      });

      return NextResponse.json({ ok: true, plan });
    }

    if (body.mode === "answer") {
      const answer = await generateText({
        apiKey,
        model: process.env.GEMINI_MODEL,
        temperature: 0.2,
        systemInstruction: `Answer using only the tool result below.

Be brief: one or two sentences. State amounts as "TSh 45,000". Say how many
records the answer rests on.

If the result is empty, say plainly that there are no records for that, and
stop. Never estimate, never fill a gap, and never mention anything the
result does not contain.

Reply in ${body.language === "sw" ? "Swahili" : "English"}.

TOOL RESULT
${JSON.stringify(body.result).slice(0, 4000)}`,
        userText: body.question,
      });

      return NextResponse.json({ ok: true, answer });
    }

    return NextResponse.json({ ok: false, error: "unknown_mode" }, { status: 400 });
  } catch (error) {
    console.error("answer failed", error);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 502 });
  }
}
