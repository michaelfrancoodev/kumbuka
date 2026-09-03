"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { db } from "@/lib/db";
import { searchRecords } from "@/lib/webmcp/tools";
import { beginTrace, endTrace, clearTrace } from "@/lib/webmcp/trace";
import { todayIso } from "@/lib/dates";
import AskInput from "@/components/ask/AskInput";
import AnswerBlock from "@/components/ask/AnswerBlock";
import ToolTrace from "@/components/ask/ToolTrace";
import EvidenceDrawer from "@/components/ask/EvidenceDrawer";
import type { KumbukaRecord } from "@/lib/types";

/**
 * Ask. The question is planned into a tool call, the tool runs locally
 * against stored records, and the result is phrased into an answer. The
 * trace and the evidence are both on screen, so the answer can be checked
 * against the records that produced it rather than taken on trust.
 */
const examples = ["How much have I paid Juma this month?", "What did I spend on transport?", "Which records are still missing a detail?"];

export default function AskPage() {
  const { t, language, ready } = useLanguage();

  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<KumbukaRecord[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const ask = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setAsked(trimmed);
    setQuestion("");
    setAnswer(null);
    setEvidence([]);
    setFailed(false);
    setBusy(true);
    clearTrace();

    try {
      const planResponse = await fetch("/api/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "plan", question: trimmed, today: todayIso() }),
      }).then((r) => r.json());

      if (!planResponse.ok) throw new Error("plan failed");
      const plan = planResponse.plan;

      const traceId = beginTrace(plan.tool, {
        person: plan.person ?? undefined,
        date_from: plan.date_from ?? undefined,
        date_to: plan.date_to ?? undefined,
        query: plan.query ?? undefined,
      });

      let rows: KumbukaRecord[];
      if (plan.tool === "find_incomplete_records") {
        rows = await db.records.where("status").equals("draft").toArray();
      } else {
        rows = await searchRecords({
          person: plan.person ?? undefined,
          date_from: plan.date_from ?? undefined,
          date_to: plan.date_to ?? undefined,
          query: plan.query ?? undefined,
        });
      }

      const capped = rows.slice(0, 20);
      endTrace(traceId, `${rows.length} record${rows.length === 1 ? "" : "s"}`, capped.map((r) => r.id));
      setEvidence(capped);

      const answerResponse = await fetch("/api/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "answer",
          question: trimmed,
          language,
          result: {
            count: rows.length,
            total_out: rows.filter((r) => r.direction === "out").reduce((sum, r) => sum + (r.amount ?? 0), 0),
            total_in: rows.filter((r) => r.direction === "in").reduce((sum, r) => sum + (r.amount ?? 0), 0),
            records: capped.map((r) => ({ person: r.personName, amount: r.amount, purpose: r.purposeText, date: r.occurredOn, kind: r.kind })),
          },
        }),
      }).then((r) => r.json());

      if (!answerResponse.ok) throw new Error("answer failed");
      setAnswer(answerResponse.answer);
    } catch {
      setFailed(true);
      setAnswer(null);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1>{t("ask.title")}</h1>
      </header>

      {asked === null ? (
        <div className="rounded-md border border-dashed border-border px-5 py-8 text-center">
          <p className="text-[15px] font-medium">{t("ask.emptyTitle")}</p>
          <p className="mt-1 text-[14px] text-muted">{t("ask.emptyHint")}</p>

          <ul className="mt-5 space-y-2">
            {examples.map((example) => (
              <li key={example}>
                <button
                  onClick={() => ask(example)}
                  className="w-full rounded-full border border-border px-4 py-2 text-left text-[14px] text-muted transition-colors hover:border-fg/30 hover:text-fg"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-4">
          <AnswerBlock question={asked} answer={answer} recordCount={evidence.length} onViewEvidence={() => setDrawerOpen(true)} t={t} />
          <ToolTrace t={t} />
          {failed && <p className="text-[13px] text-danger">{t("state.parseFailed")}</p>}
        </div>
      )}

      <AskInput value={question} onChange={setQuestion} onSubmit={() => ask(question)} busy={busy} t={t} />

      <EvidenceDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} records={evidence} t={t} />
    </div>
  );
}
