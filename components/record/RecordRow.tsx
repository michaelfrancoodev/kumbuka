"use client";

import { formatMoney, formatQuantity } from "@/lib/money";
import { formatTime } from "@/lib/dates";
import StatusDot from "@/components/ui/StatusDot";
import type { KumbukaRecord } from "@/lib/types";

/**
 * One record in a list. Every row carries its provenance — how it was
 * captured, and that a human confirmed it — as a visible audit trail. The
 * original sentence is shown beneath the interpreted fields, never in place
 * of them, verbatim in both language modes.
 */
export default function RecordRow({
  record,
  t,
  onSelect,
}: {
  record: KumbukaRecord;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onSelect?: (record: KumbukaRecord) => void;
}) {
  const pending = record.status === "draft";

  const title = record.personName
    ? t(`kind.${record.kind}.withPerson`, { name: record.personName })
    : t(`kind.${record.kind}`);

  const amountLabel =
    record.amount !== null
      ? formatMoney(record.amount)
      : record.quantity !== null
        ? formatQuantity(record.quantity, record.unit)
        : "—";

  const Wrapper = onSelect ? "button" : "div";

  return (
    <Wrapper
      {...(onSelect ? { onClick: () => onSelect(record), type: "button" as const } : {})}
      className={[
        "flex w-full items-start gap-3 border-b border-border-soft px-4 py-3.5 text-left last:border-b-0",
        onSelect ? "transition-colors hover:bg-surface" : "",
      ].join(" ")}
    >
      <span className="w-11 shrink-0 pt-0.5 text-[12px] tabular text-meta">{formatTime(record.createdAt)}</span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{title}</span>

        {record.purposeText && <span className="block truncate text-[13px] text-muted">{record.purposeText}</span>}

        <span className="mt-1 block truncate text-[12px] italic text-meta">{record.originalText}</span>

        <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-meta">
          <StatusDot tone={pending ? "pending" : "confirmed"} label={pending ? t("records.awaiting") : t("records.confirmed")} />
          <span aria-hidden="true">
            {pending
              ? t("records.awaiting")
              : `${record.source === "voice" ? t("records.recordedByVoice") : t("records.recordedByTyping")} · ${t("records.confirmed")}`}
          </span>
        </span>
      </span>

      <span
        className={[
          "shrink-0 pt-0.5 text-[15px] font-medium tabular",
          record.direction === "in" ? "text-accent" : "text-fg",
        ].join(" ")}
      >
        {record.direction === "in" && record.amount !== null ? "+" : ""}
        {amountLabel}
      </span>
    </Wrapper>
  );
}
