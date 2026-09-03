"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { formatMoney, formatQuantity, parseTypedAmount } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import type { Draft } from "@/lib/types";

/**
 * The confirmation card. Nothing reaches storage without passing through
 * here. Saving is a real pointer or keyboard event — that gesture is what
 * mints the token the write path requires, which is why an agent cannot
 * complete this step on the user's behalf.
 */
export default function ConfirmCard({
  draft,
  onConfirm,
  onDiscard,
  saving = false,
  t,
}: {
  draft: Draft;
  onConfirm: (edited: Draft) => void;
  onDiscard: () => void;
  saving?: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [amountText, setAmountText] = useState(draft.amount !== null ? String(draft.amount) : "");
  const [personText, setPersonText] = useState(draft.personName ?? "");
  const [purposeText, setPurposeText] = useState(draft.purposeText ?? "");

  const missing = (field: string) => draft.missingFields.includes(field as never);

  const commit = () => {
    if (!editing) {
      onConfirm(draft);
      return;
    }

    const amount = parseTypedAmount(amountText);
    onConfirm({
      ...draft,
      amount: amount ?? draft.amount,
      personName: personText.trim() || draft.personName,
      purposeText: purposeText.trim() || draft.purposeText,
      missingFields: draft.missingFields.filter((field) => {
        if (field === "amount") return amount === null;
        if (field === "person") return personText.trim().length === 0;
        if (field === "purpose") return purposeText.trim().length === 0;
        return true;
      }),
    });
  };

  return (
    <div className="animate-rise rounded-md border border-border bg-bg">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-meta">{t("confirm.heading")}</p>
      </div>

      <div className="px-4">
        {editing ? (
          <>
            <EditableField label={t("field.person")} value={personText} onChange={setPersonText} placeholder={t("field.unknown")} />
            <EditableField
              label={t("field.amount")}
              value={amountText}
              onChange={setAmountText}
              placeholder={t("field.unknown")}
              inputMode="numeric"
            />
            <EditableField label={t("field.purpose")} value={purposeText} onChange={setPurposeText} placeholder={t("field.unknown")} />
          </>
        ) : (
          <>
            {(draft.personName || missing("person")) && (
              <Field label={t("field.person")} value={draft.personName ?? t("field.unknown")} missing={draft.personName === null} />
            )}

            {(draft.amount !== null || missing("amount")) && (
              <Field
                label={t("field.amount")}
                value={draft.amount !== null ? formatMoney(draft.amount) : t("field.unknown")}
                missing={draft.amount === null}
                emphasis={draft.amount !== null}
              />
            )}

            {draft.quantity !== null && <Field label={t("field.quantity")} value={formatQuantity(draft.quantity, draft.unit)} />}

            {(draft.purposeText || missing("purpose")) && (
              <Field label={t("field.purpose")} value={draft.purposeText ?? t("field.unknown")} missing={draft.purposeText === null} />
            )}

            <Field label={t("field.date")} value={formatDate(draft.occurredOn)} missing={draft.occurredOn === null} />
          </>
        )}
      </div>

      <p className="border-t border-border-soft px-4 py-3 text-[13px] italic text-meta">{draft.originalText}</p>

      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <Button variant="accent" onClick={commit} disabled={saving} block>
          {t("confirm.save")}
        </Button>
        <Button variant="ghost" size="md" onClick={() => setEditing((value) => !value)} disabled={saving}>
          {t("confirm.edit")}
        </Button>
        <Button variant="danger" size="md" onClick={onDiscard} disabled={saving}>
          {t("confirm.discard")}
        </Button>
      </div>

      <p className="px-4 pb-3 text-[12px] text-meta">{t("confirm.note")}</p>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="flex items-center justify-between gap-4 border-b border-border-soft py-2.5 last:border-b-0">
      <span className="shrink-0 text-[13px] text-muted">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 rounded-sm bg-surface px-2.5 py-1.5 text-right text-[15px] tabular outline-none placeholder:text-meta focus:bg-surface-2"
      />
    </label>
  );
}
