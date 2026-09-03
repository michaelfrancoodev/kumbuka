"use client";

import { useEffect } from "react";
import AppShell from "@/components/shell/AppShell";
import { registerTools } from "@/lib/webmcp/register";
import { pruneTokens } from "@/lib/db";
import type { ReactNode } from "react";

/**
 * Application layout. Tools are registered once, for the lifetime of the
 * app, and unregistered on unmount. Registration is silent when WebMCP is
 * unavailable — the app is a complete product without an agent, and better
 * with one.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    void pruneTokens();
    const unregister = registerTools();
    return unregister;
  }, []);

  return <AppShell>{children}</AppShell>;
}
