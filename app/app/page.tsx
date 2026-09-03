"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useSpeech } from "@/hooks/useSpeech";
import { useIncompleteRecords, useTodayRecords, useTodaySummary } from "@/hooks/useRecords";
import { commitDraft, db, issueConfirmToken, knownTerms, learnTerm } from "@/lib/db";
import { subscribeToPending, clearPending } from "@/lib/webmcp/confirm";
import { todayIso, formatDateLong } from "@/lib/dates";
import { parseTypedAmount } from "@/lib/money";
import { formatMoney } from "@/lib/money";
import CaptureBox from "@/components/input/CaptureBox";
import LiveTranscript from "@/components/input/LiveTranscript";
import ConfirmCard from "@/components/record/ConfirmCard";
import ClarifyQuestion from "@/components/record/ClarifyQuestion";
import UnknownTermPrompt from "@/components/record/UnknownTermPrompt";
import RecordList from "@/components/record/RecordList";
import EmptyState from "@/components/record/EmptyState";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import type { Draft, MissingField, TermKind } from "@/lib/types";

/**
 * Today. Holds the capture flow: a sentence is parsed, anything unclear is
 * asked about, and the result is confirmed by a person before it is stored.
 * One step is shown at a time, so there is never a decision to make and a
 * form to fill at once. Also listens for drafts an agent prepares via
 * WebMCP's `prepare_record`, so the same confirmation flow applies to both.
 */
type Phase =
  | { step: "idle" }
  | { step: "parsing" }
  | { step: "term"; draft: Draft; index: number }
  | { step: "clarify"; draft: Draft; field: MissingField }
  | { step: "confirm"; draft: Draft }
  | { step: "saving"; draft: Draft }
  | { step: "error"; messageKey: string };

export default function TodayPage() {
  const { t, language, ready } = useLanguage();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>({ step: "idle" });

  const records = useTodayRecords();
  const summary = useTodaySummary();
  const incomplete = useIncompleteRecords();

  const advance = useCallback((draft: Draft, fromTermIndex = 0) => {
    if (fromTermIndex < draft.unclearSpans.length) {
      setPhase({ step: "term", draft, index: fromTermIndex });
      return;
    }
    const blocking = draft.missingFields.find((field) => field === "amount" || field === "person");
    if (blocking) {
      setPhase({ step: "clarify", draft, field: blocking });
      return;
    }
    setPhase({ step: "confirm", draft });
  }, []);

  // A draft an agent prepared via WebMCP shows up here, going through the
  // same clarify/confirm flow a person typing would.
  useEffect(() => {
    return subscribeToPending((draft) => {
      if (draft) advance(draft);
    });
  }, [advance]);

  const parse = useCallback(
    async (sentence: string, source: "voice" | "text") => {
      setPhase({ step: "parsing" });
      setText("");

      try {
        const response = await fetch("/api/parse", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: sentence, today: todayIso(), knownTerms: await knownTerms() }),
        });

        const payload = await response.json();
        if (!payload.ok) {
          setPhase({ step: "error", messageKey: "state.parseFailed" });
          return;
        }

        const draft: Draft = {
          id: crypto.randomUUID(),
          originalText: sentence,
          source,
          createdAt: Date.now(),
          ...payload.draft,
        };

        await db.drafts.add(draft);
        advance(draft);
      } catch {
        setPhase({ step: "error", messageKey: "state.parseFailed" });
      }
    },
    [advance]
  );

  const speech = useSpeech({ language, onComplete: (transcript) => parse(transcript, "voice") });

  const resolveTerm = async (draft: Draft, index: number, kind: TermKind) => {
    await learnTerm(draft.unclearSpans[index].span, kind, draft.id);
    advance(draft, index + 1);
  };

  const answerField = (draft: Draft, field: MissingField, answer: string) => {
    const updated: Draft = { ...draft };

    if (field === "amount") {
      const amount = parseTypedAmount(answer);
      if (amount === null) return;
      updated.amount = amount;
    } else if (field === "person") {
      updated.personName = answer;
    }

    updated.missingFields = draft.missingFields.filter((f) => f !== field);
    advance(updated, draft.unclearSpans.length);
  };

  const save = async (draft: Draft) => {
    setPhase({ step: "saving", draft });
    const token = await issueConfirmToken(draft.id);
    const record = await commitDraft(draft, token);
    clearPending();
    setPhase(record ? { step: "idle" } : { step: "error", messageKey: "state.retry" });
  };

  const discard = async (draft: Draft) => {
    await db.drafts.delete(draft.id);
    clearPending();
    setPhase({ step: "idle" });
  };

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const hasNothing = records !== undefined && records.length === 0;

  return (
    <div className="space-y-8">
      <header>
        <h1>{t("nav.today")}</h1>
        <p className="mt-1 text-[14px] text-muted">{formatDateLong(todayIso(), language === "sw" ? "sw-TZ" : "en-GB")}</p>
      </header>

      {speech.listening ? (
        <LiveTranscript transcript={speech.transcript} state={speech.state} onStop={speech.stop} t={t} />
      ) : phase.step === "term" ? (
        <UnknownTermPrompt
          span={phase.draft.unclearSpans[phase.index]}
          onResolve={(kind) => resolveTerm(phase.draft, phase.index, kind)}
          onSkip={() => discard(phase.draft)}
          t={t}
        />
      ) : phase.step === "clarify" ? (
        <ClarifyQuestion
          field={phase.field}
          question={
            phase.field === "amount"
              ? t("clarify.askAmount", { name: phase.draft.personName ?? t("field.unknown") })
              : t("clarify.askPerson")
          }
          onAnswer={(answer) => answerField(phase.draft, phase.field, answer)}
          onSkip={() => discard(phase.draft)}
          t={t}
        />
      ) : phase.step === "confirm" || phase.step === "saving" ? (
        <ConfirmCard draft={phase.draft} saving={phase.step === "saving"} onConfirm={save} onDiscard={() => discard(phase.draft)} t={t} />
      ) : (
        <>
          <CaptureBox
            value={text}
            onChange={setText}
            onSubmit={parse}
            onStartVoice={speech.start}
            voiceAvailable={speech.available}
            busy={phase.step === "parsing"}
            t={t}
          />
          {phase.step === "error" && <p className="text-[13px] text-danger">{t(phase.messageKey)}</p>}
          {speech.state === "denied" && <p className="text-[13px] text-danger">{t("state.micDenied")}</p>}
        </>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Metric label={t("today.moneyOut")} value={summary ? formatMoney(summary.moneyOut) : undefined} />
        <Metric label={t("today.moneyIn")} value={summary ? formatMoney(summary.moneyIn) : undefined} tone="accent" />
        <Metric label={t("today.records")} value={summary ? String(summary.count) : undefined} />
      </div>

      {incomplete !== undefined && incomplete.length > 0 && (
        <Card label={t("today.needsDetail")} flush>
          <RecordList records={incomplete} t={t} />
        </Card>
      )}

      <Card label={t("records.title")} flush={!hasNothing}>
        {hasNothing ? <EmptyState t={t} onPick={setText} /> : <RecordList records={records} t={t} />}
      </Card>
    </div>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string | undefined; tone?: "default" | "accent" }) {
  return (
    <div className="rounded-sm border border-border px-3 py-3">
      <p className="text-[11px] font-medium uppercase leading-tight tracking-[0.06em] text-meta">{label}</p>
      {value === undefined ? (
        <Skeleton className="mt-2 h-5 w-full" />
      ) : (
        <p className={["mt-1 truncate text-[17px] font-semibold tabular", tone === "accent" ? "text-accent" : "text-fg"].join(" ")}>
          {value}
        </p>
      )}
    </div>
  );
}
