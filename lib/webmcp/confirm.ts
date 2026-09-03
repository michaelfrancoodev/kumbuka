"use client";

import type { Draft } from "@/lib/types";

/**
 * The bridge between an agent and a human decision. An agent can prepare a
 * record, but it cannot save one: a boolean "confirmed" argument would be
 * forgeable, a token is not — nothing in the tool path can mint one.
 */

type Listener = (draft: Draft | null) => void;

let pending: Draft | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(pending));
}

export function requestConfirmation(draft: Draft) {
  pending = draft;
  emit();
}

export function clearPending() {
  pending = null;
  emit();
}

export function getPending(): Draft | null {
  return pending;
}

export function subscribeToPending(listener: Listener): () => void {
  listeners.add(listener);
  listener(pending);
  return () => listeners.delete(listener);
}
