type Tone = "confirmed" | "pending" | "error" | "neutral";

const tones: Record<Tone, string> = {
  confirmed: "bg-accent",
  pending: "bg-warn",
  error: "bg-danger",
  neutral: "bg-meta",
};

/** A coloured dot rather than an icon or emoji, with an accessible label. */
export default function StatusDot({
  tone = "neutral",
  label,
  pulse = false,
}: {
  tone?: Tone;
  label: string;
  pulse?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={["h-1.5 w-1.5 shrink-0 rounded-full", tones[tone], pulse ? "animate-pulse-soft" : ""].join(" ")}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
