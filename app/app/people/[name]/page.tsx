"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { usePersonRecords } from "@/hooks/useRecords";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import RecordList from "@/components/record/RecordList";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

/**
 * One person: totals, with every record that produced them directly
 * beneath — what has passed between us, and when.
 */
export default function PersonPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: encoded } = use(params);
  const name = decodeURIComponent(encoded);

  const { t, language, ready } = useLanguage();
  const records = usePersonRecords(name);

  const totals = records && {
    out: records.filter((r) => r.direction === "out").reduce((sum, r) => sum + (r.amount ?? 0), 0),
    in: records.filter((r) => r.direction === "in").reduce((sum, r) => sum + (r.amount ?? 0), 0),
    last: records[0]?.occurredOn ?? null,
  };

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <Link href="/app/people" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg">
        <ArrowLeft size={15} strokeWidth={1.75} aria-hidden="true" />
        {t("people.title")}
      </Link>

      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[18px] font-medium">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate">{name}</h1>
          {records && <p className="mt-0.5 text-[13px] text-muted">{t("records.count", { n: records.length })}</p>}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t("people.totalPaid")} value={totals ? formatMoney(totals.out) : undefined} />
        <Stat label={t("people.totalReceived")} value={totals ? formatMoney(totals.in) : undefined} tone="accent" />
        <Stat label={t("people.lastActivity")} value={totals ? formatDate(totals.last, language === "sw" ? "sw-TZ" : "en-GB") : undefined} />
      </div>

      <Card label={t("records.title")} flush>
        <RecordList records={records} t={t} emptyMessage={t("records.empty")} />
      </Card>
    </div>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string | undefined; tone?: "default" | "accent" }) {
  return (
    <div className="rounded-sm border border-border px-3 py-3">
      <p className="text-[11px] font-medium uppercase leading-tight tracking-[0.06em] text-meta">{label}</p>
      {value === undefined ? (
        <Skeleton className="mt-2 h-5 w-full" />
      ) : (
        <p className={["mt-1 truncate text-[16px] font-semibold tabular", tone === "accent" ? "text-accent" : "text-fg"].join(" ")}>{value}</p>
      )}
    </div>
  );
}
