"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Users, MessageCircle, BarChart3 } from "lucide-react";

/**
 * Primary navigation. Five destinations, fixed to the bottom edge where a
 * thumb reaches on a phone.
 */
const items = [
  { href: "/app", key: "nav.today", Icon: Home, exact: true },
  { href: "/app/records", key: "nav.records", Icon: List, exact: false },
  { href: "/app/reports", key: "nav.reports", Icon: BarChart3, exact: false },
  { href: "/app/people", key: "nav.people", Icon: Users, exact: false },
  { href: "/app/ask", key: "nav.ask", Icon: MessageCircle, exact: false },
] as const;

export default function BottomNav({ t }: { t: (key: string) => string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("nav.today")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur-sm sm:hidden"
    >
      <ul className="mx-auto flex max-w-[720px]">
        {items.map(({ href, key, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={[
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
                  active ? "text-fg" : "text-meta",
                ].join(" ")}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.6} aria-hidden="true" />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
