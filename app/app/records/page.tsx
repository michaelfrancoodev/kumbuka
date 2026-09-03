"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useConfirmedRecords, useIncompleteRecords } from "@/hooks/useRecords";
import { formatDateLong } from "@/lib/dates";
import RecordRow from "@/components/record/RecordRow";
import Skeleton from "@/components/ui/Skeleton";
import type { KumbukaRecord, RecordKind } from "@/lib/types";

/**
 * Records. Everything saved, newest first, grouped by the day it happened.
 * Search runs over the interpreted fields and the original sentence, so a
 * record can be found by the words the user actually used.
 */
type Filter = "all" | RecordKind;

const filters: Filter[] = ["all", "payment", "purchase", "sale", "activity"];

export default function RecordsPage() {
  const { t, language, ready } = useLanguage();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const confirmed = useConfirmedRecords();
  const incomplete = useIncompleteRecords();

  const all = useMemo(() => {
    if (confirmed === undefined || incomplete === undefined) return undefined;
    return [...incomplete, ...confirmed].sort((a, b) => b.createdAt - a.createdAt);
  }, [confirmed, incomplete]);

  const visible = useMemo(() => {
    if (all === undefined) return undefined;
    const needle = query.trim().toLowerCase();
    return all.filter((record) => {
      if (filter !== "all" && record.kind !== filter) return false;
      if (!needle) return true;
      return (
        record.originalText.toLowerCase().includes(needle) ||
        (record.personName ?? "").toLowerCase().includes(needle) ||
        (record.purposeText ?? "").toLowerCase().includes(needle) ||
        String(record.amount ?? "").includes(needle)
      );
    });
  }, [all, query, filter]);

  const days = useMemo(() => groupByDay(visible), [visible]);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1>{t("records.title")}</h1>
        {all !== undefined && <p className="mt-1 text-[14px] text-muted">{t("records.count", { n: all.length })}</p>}
      </header>

      <div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 focus-within:border-fg/30">
        <Search size={16} strokeWidth={1.75} className="shrink-0 text-meta" aria-hidden="true" />
        <label htmlFor="record-search" className="sr-only">
          {t("records.search")}
        </label>
        <input
          id="record-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("records.search")}
          className="min-w-0 flex-1 bg-transparent py-1 text-[16px] outline-none placeholder:text-meta"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((option) => {
          const active = filter === option;
          return (
            <button
              key={option}
              onClick={() => setFilter(option)}
              aria-pressed={active}
              className={[
                "shrink-0 rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-150",
                active ? "border-fg bg-fg text-bg" : "border-border text-muted hover:border-fg/30 hover:text-fg",
              ].join(" ")}
            >
              {option === "all" ? t("filter.all") : t(`kind.${option}`)}
            </button>
          );
        })}
      </div>

      {visible === undefined ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
          <span className="sr-only">{t("state.loading")}</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-5 py-10 text-center">
          <p className="text-[15px] font-medium">{query || filter !== "all" ? t("records.noMatch") : t("records.empty")}</p>
          <p className="mt-1 text-[14px] text-muted">{query || filter !== "all" ? t("records.noMatchHint") : t("records.emptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map(([day, dayRecords]) => (
            <section key={day}>
              <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-meta">
                {formatDateLong(day, language === "sw" ? "sw-TZ" : "en-GB")}
              </h2>
              <div className="rounded-md border border-border bg-bg">
                <ul>
                  {dayRecords.map((record) => (
                    <li key={record.id}>
                      <RecordRow record={record} t={t} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByDay(records: KumbukaRecord[] | undefined): Array<[string, KumbukaRecord[]]> {
  if (!records) return [];
  const byDay = new Map<string, KumbukaRecord[]>();
  for (const record of records) {
    const day = record.occurredOn ?? "";
    const existing = byDay.get(day);
    if (existing) existing.push(record);
    else byDay.set(day, [record]);
  }
  return [...byDay.entries()].sort(([a], [b]) => b.localeCompare(a));
}
