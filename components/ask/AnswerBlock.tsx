"use client";

import Button from "@/components/ui/Button";
import StatusDot from "@/components/ui/StatusDot";

/** A question and its answer, flat and typographic rather than a chat bubble. */
export default function AnswerBlock({
  question,
  answer,
  recordCount,
  onViewEvidence,
  t,
}: {
  question: string;
  answer: string | null;
  recordCount: number;
  onViewEvidence: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <div className="animate-rise space-y-5">
      <div className="text-right">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-meta">{t("ask.you")}</p>
        <p className="mt-1 text-[17px] leading-relaxed">{question}</p>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-meta">Kumbuka</p>

        {answer === null ? (
          <p className="mt-1 flex items-center gap-2 text-[15px] text-muted">
            <StatusDot tone="pending" label={t("state.loading")} pulse />
            {t("state.loading")}
          </p>
        ) : (
          <p className="mt-1 text-[17px] leading-relaxed">{answer}</p>
        )}

        {answer !== null && recordCount > 0 && (
          <div className="mt-3 flex items-center gap-3 border-t border-border-soft pt-3">
            <span className="flex items-center gap-1.5 text-[13px] text-muted">
              <StatusDot tone="confirmed" label={t("records.confirmed")} />
              <span aria-hidden="true">{t("ask.basedOn", { n: recordCount })}</span>
            </span>
            <Button variant="outline" size="sm" onClick={onViewEvidence}>
              {t("ask.viewEvidence")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
