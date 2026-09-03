"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  closeLabel: string;
}

/**
 * Modal surface: a bottom sheet on phones, a right-hand drawer from tablet
 * width up, so confirmation stays within thumb reach in the field.
 */
export default function Sheet({ open, onClose, title, children, closeLabel }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-fg/20" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={[
          "animate-rise absolute bg-bg outline-none",
          "shadow-[0_4px_16px_rgba(13,13,13,0.06)]",
          "inset-x-0 bottom-0 max-h-[85vh] rounded-t-md",
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[420px] sm:max-h-none sm:rounded-none",
          "sm:border-l sm:border-border",
          "flex flex-col",
        ].join(" ")}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-meta">{title}</h2>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            className="rounded-full p-1 text-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
