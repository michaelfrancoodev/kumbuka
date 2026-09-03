"use client";

import { ArrowUp } from "lucide-react";
import type { KeyboardEvent } from "react";

/** Question field. Mirrors the capture box so the two feel like one product. */
export default function AskInput({
  value,
  onChange,
  onSubmit,
  busy = false,
  t,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  busy?: boolean;
  t: (key: string) => string;
}) {
  const canSubmit = value.trim().length > 0 && !busy;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && canSubmit) onSubmit();
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 focus-within:border-fg/30">
      <label htmlFor="ask" className="sr-only">
        {t("ask.placeholder")}
      </label>
      <input
        id="ask"
        value={value}
        disabled={busy}
        placeholder={t("ask.placeholder")}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className="min-w-0 flex-1 bg-transparent py-1.5 text-[16px] outline-none placeholder:text-meta"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-label={t("ask.placeholder")}
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
          canSubmit ? "bg-fg text-bg hover:bg-fg/90" : "bg-surface-2 text-meta",
        ].join(" ")}
      >
        <ArrowUp size={17} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
