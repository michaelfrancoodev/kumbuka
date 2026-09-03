"use client";

import RecordRow from "./RecordRow";
import Skeleton from "@/components/ui/Skeleton";
import type { KumbukaRecord } from "@/lib/types";

/**
 * `undefined` means the first read has not returned yet; an empty array
 * means there is genuinely nothing to show. The two render differently so
 * an empty database is never mistaken for a stalled screen.
 */
export default function RecordList({
  records,
  t,
  emptyMessage,
  onSelect,
}: {
  records: KumbukaRecord[] | undefined;
  t: (key: string, vars?: Record<string, string | number>) => string;
  emptyMessage?: string;
  onSelect?: (record: KumbukaRecord) => void;
}) {
  if (records === undefined) {
    return (
      <div className="px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-start gap-3 py-2.5">
            <Skeleton className="h-4 w-11" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
        <span className="sr-only">{t("state.loading")}</span>
      </div>
    );
  }

  if (records.length === 0) {
    return <p className="px-4 py-6 text-center text-[14px] text-muted">{emptyMessage ?? t("records.empty")}</p>;
  }

  return (
    <ul>
      {records.map((record) => (
        <li key={record.id}>
          <RecordRow record={record} t={t} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
