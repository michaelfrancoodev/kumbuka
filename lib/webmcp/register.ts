"use client";

import { createTools } from "./tools";

/**
 * Register this page's tools with the browser via WebMCP.
 *
 * Reads `document.modelContext` and falls back to `navigator.modelContext`
 * since different builds have used both, and its absence is not an error —
 * without WebMCP the page simply behaves as an ordinary web app.
 */

interface ModelContextLike {
  registerTool(definition: unknown): { unregister?: () => void } | void;
}

function getModelContext(): ModelContextLike | null {
  if (typeof window === "undefined") return null;
  const fromDocument = (document as unknown as Record<string, unknown>).modelContext;
  const fromNavigator = (navigator as unknown as Record<string, unknown>).modelContext;
  return (fromDocument ?? fromNavigator ?? null) as ModelContextLike | null;
}

export function isWebMcpAvailable(): boolean {
  return getModelContext() !== null;
}

/** Register every tool. Returns a function that unregisters them. */
export function registerTools(): () => void {
  const context = getModelContext();
  if (!context) return () => {};

  const handles = createTools().map((tool) => {
    try {
      return context.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        readOnlyHint: tool.readOnlyHint ?? false,
        untrustedContentHint: tool.untrustedContentHint ?? false,
        execute: tool.execute,
      });
    } catch (error) {
      console.error(`Could not register ${tool.name}`, error);
      return null;
    }
  });

  return () => {
    handles.forEach((handle) => {
      if (handle && typeof handle.unregister === "function") handle.unregister();
    });
  };
}
