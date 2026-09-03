"use client";

import Button from "@/components/ui/Button";
import type { TermKind, UnclearSpan } from "@/lib/types";

/**
 * Learning a word from the person who uses it. The product ships with no
 * vocabulary; when a phrase carries meaning the parser cannot place, it is
 * shown back to the user and they say what it is. The answer is stored
 * against this device only, so the same question is never asked twice.
 */
export default function UnknownTermPrompt({
  span,
  onResolve,
  onSkip,
  t,
}: {
  span: UnclearSpan;
  onResolve: (kind: TermKind) => void;
  onSkip: () => void;
  t: (key: string) => string;
}) {
  const options: TermKind[] = span.options.length > 0 ? span.options : ["person", "place", "activity", "unit", "item"];

  return (
    <div className="animate-rise rounded-md border border-border bg-surface px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-meta">{t("clarify.unclear")}</p>

      <p className="mt-2 text-[17px] font-medium leading-snug">{span.question}</p>

      <p className="mt-1 text-[13px] italic text-muted">&ldquo;{span.span}&rdquo;</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((kind) => (
          <Button key={kind} variant="outline" size="sm" onClick={() => onResolve(kind)}>
            {t(`clarify.kind.${kind}`)}
          </Button>
        ))}
      </div>

      <button type="button" onClick={onSkip} className="mt-3 text-[13px] text-muted underline-offset-2 hover:text-fg hover:underline">
        {t("confirm.discard")}
      </button>
    </div>
  );
}
