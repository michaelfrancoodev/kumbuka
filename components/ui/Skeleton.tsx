/** Loading placeholder that matches the height of the content it replaces. */
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={["animate-pulse-soft rounded-sm bg-surface-2", className].join(" ")} />;
}
