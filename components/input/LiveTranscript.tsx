"use client";

import { Square, X } from "lucide-react";
import type { SpeechState } from "@/hooks/useSpeech";

/**
 * What the microphone is hearing, as it hears it.
 *
 * Two separate actions, never one combined "done" button: Stop ends the
 * recording and hands the words to the capture box for the person to read,
 * edit, or send — it never sends anything on its own. Cancel throws the
 * whole recording away so the person can record it again from nothing.
 */
export default function LiveTranscript({
  transcript,
  state,
  onStop,
  onCancel,
  t,
}: {
  transcript: string;
  state: SpeechState;
  onStop: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  const waiting = state === "silence";

  return (
    <div className="rounded-md border border-fg/25 bg-bg px-4 py-4">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
        <span aria-live="polite" className="text-[11px] font-medium uppercase tracking-[0.08em] text-meta">
          {waiting ? t("capture.stillListening") : t("capture.listening")}
        </span>
      </div>

      <p
        aria-live="polite"
        className={["mt-3 min-h-[3.25rem] text-[17px] leading-relaxed", transcript ? "text-fg" : "text-meta"].join(" ")}
      >
        {transcript || t("capture.placeholder")}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onStop}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-[13px] font-medium text-muted transition-colors hover:border-fg/30 hover:text-fg"
        >
          <Square size={12} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
          {t("capture.stop")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t("capture.cancel")}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-meta transition-colors hover:text-danger"
        >
          <X size={14} strokeWidth={2} aria-hidden="true" />
          {t("capture.cancel")}
        </button>
      </div>
    </div>
  );
}
