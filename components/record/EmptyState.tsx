"use client";

import Button from "@/components/ui/Button";
import { sampleSentences } from "@/lib/prompt";

/**
 * First-run state. The app ships with no sample data, so the first thing
 * anyone sees is a genuinely empty database. Selecting a suggestion fills
 * the capture box; it does not write anything.
 */
export default function EmptyState({ t, onPick }: { t: (key: string) => string; onPick: (sentence: string) => void }) {
  return (
    <div className="rounded-md border border-dashed border-border px-5 py-8 text-center">
      <p className="text-[15px] font-medium">{t("records.empty")}</p>
      <p className="mt-1 text-[14px] text-muted">{t("records.emptyHint")}</p>

      <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.08em] text-meta">{t("capture.tryOne")}</p>

      <ul className="mt-3 flex flex-col items-center gap-2">
        {sampleSentences.map((sentence) => (
          <li key={sentence} className="w-full">
            <Button
              variant="outline"
              size="sm"
              block
              onClick={() => onPick(sentence)}
              className="justify-start text-left font-normal text-muted"
            >
              <span className="truncate">{sentence}</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
