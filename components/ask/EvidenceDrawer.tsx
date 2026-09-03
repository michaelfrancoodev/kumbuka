"use client";

import Sheet from "@/components/ui/Sheet";
import RecordRow from "@/components/record/RecordRow";
import { formatMoney } from "@/lib/money";
import type { KumbukaRecord } from "@/lib/types";

/** The records behind an answer, so a summary is never taken on trust. */
export default function EvidenceDrawer({
  open,
  onClose,
  records,
  t,
}: {
  open: boolean;
  onClose: () => void;
  records: KumbukaRecord[];
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const total = records.reduce((sum, record) => sum + (record.amount ?? 0), 0);

  return (
    <Sheet open={open} onClose={onClose} title={`${t("ask.evidence")} · ${records.length}`} closeLabel={t("ask.close")}>
      <ul className="-mx-5">
        {records.map((record) => (
          <li key={record.id}>
            <RecordRow record={record} t={t} />
          </li>
        ))}
      </ul>

      {total > 0 && (
        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-[13px] text-muted">{t("ask.total")}</span>
          <span className="text-lg font-semibold tabular">{formatMoney(total)}</span>
        </div>
      )}
    </Sheet>
  );
}
