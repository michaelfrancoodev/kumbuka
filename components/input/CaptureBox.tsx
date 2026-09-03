"use client";

import { useRef, useState } from "react";
import { Mic, ArrowUp } from "lucide-react";
import type { KeyboardEvent } from "react";

/**
 * The only primary action on the Today screen. Accepts one sentence in any
 * language, by typing or by voice, and hands it to the parser. It never
 * writes a record itself.
 */
export default function CaptureBox({
  value,
  onChange,
  onSubmit,
  onStartVoice,
  voiceAvailable = false,
  busy = false,
  t,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: (text: string, source: "voice" | "text") => void;
  onStartVoice?: () => void;
  voiceAvailable?: boolean;
  busy?: boolean;
  t: (key: string) => string;
}) {
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = value.trim().length > 0 && !busy;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(value.trim(), "text");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div>
      <div
        className={[
          "flex items-end gap-2 rounded-md border bg-bg px-3 py-2.5 transition-colors duration-150",
          focused ? "border-fg/30" : "border-border",
        ].join(" ")}
      >
        <label htmlFor="capture" className="sr-only">
          {t("capture.placeholder")}
        </label>

        <textarea
          id="capture"
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={busy}
          placeholder={t("capture.placeholder")}
          onChange={(e) => {
            onChange(e.target.value);
            autoGrow();
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="min-h-6 flex-1 resize-none bg-transparent py-1 text-[16px] leading-relaxed outline-none placeholder:text-meta disabled:text-muted"
        />

        {voiceAvailable && (
          <button
            type="button"
            onClick={onStartVoice}
            disabled={busy}
            aria-label={t("capture.speak")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-fg/30 hover:text-fg disabled:opacity-40"
          >
            <Mic size={17} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          aria-label={t("capture.speak")}
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
            canSubmit ? "bg-fg text-bg hover:bg-fg/90" : "bg-surface-2 text-meta",
          ].join(" ")}
        >
          <ArrowUp size={17} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <p className="mt-2 px-1 text-[12px] text-meta">{busy ? t("capture.processing") : t("capture.hint")}</p>
    </div>
  );
}
