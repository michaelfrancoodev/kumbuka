"use client";

/**
 * Tool call log. Every invocation is recorded and broadcast, whether it came
 * from the page's own Ask screen or from an external agent, so what the
 * agent did is visible rather than described. In memory only — a view of
 * activity, not a record of truth.
 */

export interface TraceEntry {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  outcome: string;
  recordIds: string[];
  at: number;
  status: "running" | "done" | "rejected";
}

type Listener = (entries: TraceEntry[]) => void;

const MAX_ENTRIES = 20;

let entries: TraceEntry[] = [];
const listeners = new Set<Listener>();

function emit() {
  const snapshot = [...entries];
  listeners.forEach((listener) => listener(snapshot));
}

export function beginTrace(tool: string, args: Record<string, unknown>): string {
  const id = crypto.randomUUID();
  const entry: TraceEntry = {
    id,
    tool,
    args,
    outcome: "",
    recordIds: [],
    at: Date.now(),
    status: "running",
  };
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  emit();
  return id;
}

export function endTrace(
  id: string,
  outcome: string,
  recordIds: string[] = [],
  status: "done" | "rejected" = "done"
) {
  entries = entries.map((entry) => (entry.id === id ? { ...entry, outcome, recordIds, status } : entry));
  emit();
}

export function subscribeToTrace(listener: Listener): () => void {
  listeners.add(listener);
  listener([...entries]);
  return () => listeners.delete(listener);
}

export function clearTrace() {
  entries = [];
  emit();
}
