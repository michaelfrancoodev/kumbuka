import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  value: ReactNode;
  missing?: boolean;
  emphasis?: boolean;
}

/**
 * A label and value on one line. A field with no value is never blank — it
 * reads as explicitly "not given", so the user can see what the system does
 * not know.
 */
export default function Field({ label, value, missing = false, emphasis = false }: FieldProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border-soft py-3 last:border-b-0">
      <span className="shrink-0 text-[13px] text-muted">{label}</span>
      <span
        className={[
          "text-right tabular",
          emphasis ? "text-lg font-semibold" : "text-[15px]",
          missing ? "text-warn" : "text-fg",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
