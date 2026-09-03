"use client";

import { useEffect, useState } from "react";
import { subscribeToTrace, type TraceEntry } from "@/lib/webmcp/trace";

/**
 * What the agent actually did. Tool calls are shown as they run, with their
 * arguments and their result — the difference between claiming an answer
 * came from the records and showing that it did.
 */
export default function ToolTrace({ t, limit = 4 }: { t: (key: string) => string; limit?: number }) {
  const [entries, setEntries] = useState<TraceEntry[]>([]);

  useEffect(() => subscribeToTrace(setEntries), []);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-sm border border-border bg-surface px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-meta">{t("ask.toolsUsed")}</p>

      <ul className="mt-2 space-y-1.5">
        {entries.slice(0, limit).map((entry) => (
          <li key={entry.id} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className={[
                "mt-[7px] h-1.5 w-1.5 shrink-0 rounded-sm",
                entry.status === "running" ? "animate-pulse-soft bg-warn" : entry.status === "rejected" ? "bg-danger" : "bg-accent",
              ].join(" ")}
            />
            <span className="min-w-0 flex-1 font-mono text-[12px] leading-relaxed text-muted">
              <span className="text-fg">{entry.tool}</span>
              {describeArgs(entry.args)}
              {entry.outcome && <span className="text-meta"> → {entry.outcome}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function describeArgs(args: Record<string, unknown>): string {
  const parts = Object.entries(args)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}: ${String(value).slice(0, 40)}`);
  return parts.length > 0 ? ` · ${parts.join(" · ")}` : "";
}
