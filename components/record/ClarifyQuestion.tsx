"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { MissingField } from "@/lib/types";

/**
 * One question at a time, in the language the user spoke. This is the
 * alternative to guessing — an incomplete sentence produces a correct
 * record rather than a plausible wrong one.
 */
export default function ClarifyQuestion({
  field,
  question,
  onAnswer,
  onSkip,
  t,
}: {
  field: MissingField;
  question: string;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  t: (key: string) => string;
}) {
  const [answer, setAnswer] = useState("");
  const numeric = field === "amount" || field === "quantity";

  const submit = () => {
    const trimmed = answer.trim();
    if (trimmed) onAnswer(trimmed);
  };

  return (
    <div className="animate-rise rounded-md border border-warn/40 bg-warn-soft/40 px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-meta">{t("clarify.missing")}</p>

      <p className="mt-2 text-[17px] font-medium leading-snug">{question}</p>

      <div className="mt-3 flex items-center gap-2">
        <input
          autoFocus
          value={answer}
          inputMode={numeric ? "numeric" : "text"}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
          aria-label={question}
          className="min-w-0 flex-1 rounded-sm border border-border bg-bg px-3 py-2 text-[16px] outline-none focus:border-fg/30"
        />
        <Button variant="primary" onClick={submit} disabled={!answer.trim()}>
          {t("clarify.answer")}
        </Button>
      </div>

      <button type="button" onClick={onSkip} className="mt-3 text-[13px] text-muted underline-offset-2 hover:text-fg hover:underline">
        {t("confirm.discard")}
      </button>
    </div>
  );
}
