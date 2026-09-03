"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useLanguage } from "@/lib/i18n";
import { db } from "@/lib/db";
import { searchRecords } from "@/lib/webmcp/tools";
import { reportRange, formatDate, type ReportUnit } from "@/lib/dates";
import { formatMoney, sumAmounts } from "@/lib/money";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import RecordList from "@/components/record/RecordList";
import type { KumbukaRecord } from "@/lib/types";

/**
 * Reports. A person picks a period — a day, several days, a week or several
 * weeks, a month or several months, or all time — and everything on this
 * screen is computed from their own confirmed records for exactly that
 * range. The range and every number are plain arithmetic over local data,
 * never a guess; the only thing an LLM contributes is the paragraph at the
 * top, and it is instructed to speak from those numbers and nothing else.
 */

const UNITS: { unit: ReportUnit; key: string }[] = [
  { unit: "day", key: "reports.unit.day" },
  { unit: "week", key: "reports.unit.week" },
  { unit: "month", key: "reports.unit.month" },
  { unit: "all", key: "reports.unit.all" },
];

const MAX_COUNT: Record<ReportUnit, number> = { day: 31, week: 12, month: 24, all: 1 };

function periodLabel(unit: ReportUnit, count: number, t: (key: string, vars?: Record<string, string | number>) => string) {
  if (unit === "all") return t("reports.periodAll");
  if (unit === "day") return count === 1 ? t("reports.periodToday") : t("reports.periodLastDays", { n: count });
  if (unit === "week") return count === 1 ? t("reports.periodThisWeek") : t("reports.periodLastWeeks", { n: count });
  return count === 1 ? t("reports.periodThisMonth") : t("reports.periodLastMonths", { n: count });
}

interface KindStat {
  kind: string;
  count: number;
  out: number;
  in: number;
}

interface PersonStat {
  name: string;
  count: number;
  out: number;
  in: number;
}

export default function ReportsPage() {
  const { t, language, ready } = useLanguage();
  const [unit, setUnit] = useState<ReportUnit>("week");
  const [count, setCount] = useState(1);

  const { from, to } = useMemo(() => reportRange(unit, count), [unit, count]);

  // The exact set of confirmed records for this range — the same query the
  // rest of the app uses, filtered by nothing but the dates a person chose.
  const records = useLiveQuery(
    () => searchRecords({ date_from: from ?? undefined, date_to: to ?? undefined }),
    [from, to]
  );

  const incompleteCount = useLiveQuery(() => db.drafts.count(), []);

  const stats = useMemo(() => {
    if (!records) return null;
    return buildStats(records);
  }, [records]);

  const [overview, setOverview] = useState<string | null>(null);
  const [overviewFailed, setOverviewFailed] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);

  useEffect(() => {
    if (!stats) return;
    let cancelled = false;

    setOverview(null);
    setOverviewFailed(false);
    setOverviewLoading(true);

    fetch("/api/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "report",
        language,
        periodLabel: periodLabel(unit, count, t),
        stats: {
          from,
          to,
          count: stats.count,
          totalOut: stats.totalOut,
          totalIn: stats.totalIn,
          net: stats.totalIn - stats.totalOut,
          byKind: stats.byKind,
          topPeople: stats.topPeople,
          incompleteCount: incompleteCount ?? 0,
        },
      }),
    })
      .then((r) => r.json())
      .then((payload) => {
        if (cancelled) return;
        if (!payload.ok) throw new Error("report failed");
        setOverview(payload.answer);
      })
      .catch(() => {
        if (!cancelled) setOverviewFailed(true);
      })
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, unit, count, language, incompleteCount]);

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  const canStep = unit !== "all";
  const maxCount = MAX_COUNT[unit];

  return (
    <div className="space-y-6">
      <header>
        <h1>{t("reports.title")}</h1>
      </header>

      {/* Period picker. Unit first, then how many — "day" / "3 days",
          "week" / "2 weeks", "month" / "6 months", or "all" with nothing
          else to choose. */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {UNITS.map(({ unit: u, key }) => (
            <Button
              key={u}
              type="button"
              variant={unit === u ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                setUnit(u);
                setCount(1);
              }}
            >
              {t(key)}
            </Button>
          ))}
        </div>

        {canStep && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCount((n) => Math.max(1, n - 1))}
              disabled={count <= 1}
              aria-label="-"
            >
              −
            </Button>
            <span className="min-w-[9rem] text-center text-[14px] font-medium tabular">
              {periodLabel(unit, count, t)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCount((n) => Math.min(maxCount, n + 1))}
              disabled={count >= maxCount}
              aria-label="+"
            >
              +
            </Button>
          </div>
        )}

        {!canStep && <p className="text-[14px] font-medium">{periodLabel(unit, count, t)}</p>}

        {from && to && (
          <p className="text-[12px] text-meta">
            {formatDate(from, language === "sw" ? "sw-TZ" : "en-GB")} – {formatDate(to, language === "sw" ? "sw-TZ" : "en-GB")}
          </p>
        )}
      </div>

      {/* Overview — the only part of this screen an LLM writes, and it is
          constrained to the exact numbers computed below. */}
      <Card label={t("reports.overviewTitle")}>
        {overviewLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : overviewFailed ? (
          <p className="text-[14px] text-muted">{t("reports.overviewFailed")}</p>
        ) : (
          <p className="text-[15px] leading-relaxed">{overview}</p>
        )}
        {stats && <p className="mt-3 text-[12px] text-meta">{t("reports.basedOn", { n: stats.count })}</p>}
      </Card>

      {/* Hard numbers, computed here, not by the model. */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label={t("today.moneyOut")} value={stats ? formatMoney(stats.totalOut) : undefined} />
        <Metric label={t("today.moneyIn")} value={stats ? formatMoney(stats.totalIn) : undefined} tone="accent" />
        <Metric label={t("reports.net")} value={stats ? formatMoney(stats.totalIn - stats.totalOut) : undefined} />
      </div>

      {incompleteCount !== undefined && incompleteCount > 0 && (
        <p className="text-[13px] text-muted">{t("reports.incompleteNote", { n: incompleteCount })}</p>
      )}

      {stats && stats.byKind.length > 0 && (
        <Card label={t("reports.byKind")} flush>
          <ul>
            {stats.byKind.map((row) => (
              <li
                key={row.kind}
                className="flex items-center justify-between border-b border-border-soft px-4 py-2.5 text-[14px] last:border-b-0"
              >
                <span className="capitalize text-fg">{t(`kind.${row.kind}`)}</span>
                <span className="text-meta">{row.count}</span>
                <span className="tabular text-fg">{formatMoney(row.out || row.in)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {stats && stats.topPeople.length > 0 && (
        <Card label={t("reports.topPeople")} flush>
          <ul>
            {stats.topPeople.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between border-b border-border-soft px-4 py-2.5 text-[14px] last:border-b-0"
              >
                <span className="truncate text-fg">{row.name}</span>
                <span className="tabular text-fg">{formatMoney(row.out + row.in)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card label={t("reports.title")} flush>
        <RecordList records={records} t={t} emptyMessage={t("reports.noRecords")} />
      </Card>
    </div>
  );
}

function buildStats(records: KumbukaRecord[]) {
  const out = records.filter((r) => r.direction === "out");
  const inbound = records.filter((r) => r.direction === "in");

  const byKindMap = new Map<string, KindStat>();
  for (const r of records) {
    if (!r.kind) continue;
    const row = byKindMap.get(r.kind) ?? { kind: r.kind, count: 0, out: 0, in: 0 };
    row.count += 1;
    if (r.direction === "out") row.out += r.amount ?? 0;
    if (r.direction === "in") row.in += r.amount ?? 0;
    byKindMap.set(r.kind, row);
  }

  const peopleMap = new Map<string, PersonStat>();
  for (const r of records) {
    if (!r.personName) continue;
    const row = peopleMap.get(r.personName) ?? { name: r.personName, count: 0, out: 0, in: 0 };
    row.count += 1;
    if (r.direction === "out") row.out += r.amount ?? 0;
    if (r.direction === "in") row.in += r.amount ?? 0;
    peopleMap.set(r.personName, row);
  }

  return {
    count: records.length,
    totalOut: sumAmounts(out.map((r) => r.amount)),
    totalIn: sumAmounts(inbound.map((r) => r.amount)),
    byKind: [...byKindMap.values()].sort((a, b) => b.count - a.count),
    topPeople: [...peopleMap.values()].sort((a, b) => b.out + b.in - (a.out + a.in)).slice(0, 5),
  };
}

function Metric({ label, value, tone = "default" }: { label: string; value: string | undefined; tone?: "default" | "accent" }) {
  return (
    <div className="rounded-sm border border-border px-3 py-3">
      <p className="text-[11px] font-medium uppercase leading-tight tracking-[0.06em] text-meta">{label}</p>
      {value === undefined ? (
        <Skeleton className="mt-2 h-5 w-full" />
      ) : (
        <p className={["mt-1 truncate text-[17px] font-semibold tabular", tone === "accent" ? "text-accent" : "text-fg"].join(" ")}>
          {value}
        </p>
      )}
    </div>
  );
}
