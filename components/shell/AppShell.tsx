"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import BottomNav from "./BottomNav";
import LanguageToggle from "./LanguageToggle";
import type { ReactNode } from "react";

const desktopLinks = [
  { href: "/app", key: "nav.today", exact: true },
  { href: "/app/records", key: "nav.records", exact: false },
  { href: "/app/reports", key: "nav.reports", exact: false },
  { href: "/app/people", key: "nav.people", exact: false },
  { href: "/app/ask", key: "nav.ask", exact: false },
] as const;

/**
 * Application frame. Holds the wordmark, the language switch and
 * navigation. The content column is capped so lines stay readable, and
 * bottom padding clears the mobile navigation bar.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { language, setLanguage, t, ready } = useLanguage();
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[720px] items-center justify-between gap-4 px-4">
          <Link href="/app" className="text-[15px] font-semibold tracking-tight">
            Kumbuka
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {desktopLinks.map(({ href, key, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                    active ? "bg-fg text-bg" : "text-muted hover:text-fg",
                  ].join(" ")}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          {ready && <LanguageToggle language={language} onChange={setLanguage} label={t("lang.label")} />}
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4 pb-24 pt-6 sm:pb-12">{children}</main>

      <BottomNav t={t} />
    </div>
  );
}
