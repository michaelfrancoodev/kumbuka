import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  label?: string;
  action?: ReactNode;
  flush?: boolean;
  className?: string;
}

/**
 * Surface container. Depth comes from a hairline border, not a shadow.
 */
export default function Card({ children, label, action, flush = false, className = "" }: CardProps) {
  return (
    <section className={className}>
      {(label || action) && (
        <header className="mb-2 flex items-baseline justify-between gap-3">
          {label && (
            <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-meta">
              {label}
            </h2>
          )}
          {action}
        </header>
      )}
      <div className={["rounded-md border border-border bg-bg", flush ? "" : "p-4"].join(" ")}>
        {children}
      </div>
    </section>
  );
}
