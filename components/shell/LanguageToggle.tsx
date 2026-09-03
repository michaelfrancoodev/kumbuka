"use client";

import type { Language } from "@/lib/types";

/** Switching language re-labels the interface only; records are never translated. */
export default function LanguageToggle({
  language,
  onChange,
  label,
}: {
  language: Language;
  onChange: (next: Language) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center rounded-full border border-border p-0.5">
      {(["en", "sw"] as const).map((code) => {
        const active = language === code;
        return (
          <button
            key={code}
            onClick={() => onChange(code)}
            aria-pressed={active}
            className={[
              "rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em]",
              "transition-colors duration-150",
              active ? "bg-fg text-bg" : "text-meta hover:text-fg",
            ].join(" ")}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
