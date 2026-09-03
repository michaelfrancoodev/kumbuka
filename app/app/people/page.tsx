"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useConfirmedRecords } from "@/hooks/useRecords";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import Skeleton from "@/components/ui/Skeleton";
import type { KumbukaRecord, PersonSummary } from "@/lib/types";

/**
 * People. Derived from the records rather than maintained separately, so
 * the list always reflects what has actually been recorded.
 */
export default function PeoplePage() {
  const { t, language, ready } = useLanguage();
  const records = useConfirmedRecords();

  const people = useMemo(() => summariseByPerson(records), [records]);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1>{t("people.title")}</h1>
      </header>

      {people === undefined ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
          <span className="sr-only">{t("state.loading")}</span>
        </div>
      ) : people.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-5 py-10 text-center">
          <p className="text-[15px] font-medium">{t("people.empty")}</p>
          <p className="mt-1 text-[14px] text-muted">{t("people.emptyHint")}</p>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-bg">
          <ul>
            {people.map((person) => (
              <li key={person.name}>
                <Link
                  href={`/app/people/${encodeURIComponent(person.name)}`}
                  className="flex w-full items-center gap-3 border-b border-border-soft px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-surface"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[14px] font-medium">
                    {person.name.charAt(0).toUpperCase()}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{person.name}</span>
                    <span className="block truncate text-[12px] text-meta">
                      {t("records.count", { n: person.recordCount })}
                      {person.lastActivity ? ` · ${formatDate(person.lastActivity, language === "sw" ? "sw-TZ" : "en-GB")}` : ""}
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block text-[15px] font-medium tabular">{formatMoney(person.totalOut)}</span>
                    {person.totalIn > 0 && <span className="block text-[12px] tabular text-accent">+{formatMoney(person.totalIn)}</span>}
                  </span>

                  <ChevronRight size={16} strokeWidth={1.75} className="shrink-0 text-meta" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function summariseByPerson(records: KumbukaRecord[] | undefined): PersonSummary[] | undefined {
  if (records === undefined) return undefined;

  const byName = new Map<string, PersonSummary>();

  for (const record of records) {
    if (!record.personName) continue;

    const existing = byName.get(record.personName) ?? {
      name: record.personName,
      totalOut: 0,
      totalIn: 0,
      recordCount: 0,
      lastActivity: null as string | null,
      recordIds: [] as string[],
    };

    if (record.direction === "out") existing.totalOut += record.amount ?? 0;
    if (record.direction === "in") existing.totalIn += record.amount ?? 0;

    existing.recordCount += 1;
    existing.recordIds.push(record.id);

    if (!existing.lastActivity || (record.occurredOn ?? "") > existing.lastActivity) {
      existing.lastActivity = record.occurredOn;
    }

    byName.set(record.personName, existing);
  }

  return [...byName.values()].sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""));
}
