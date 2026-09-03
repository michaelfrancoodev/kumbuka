"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Stretch to the width of the container. Used for primary actions on mobile. */
  block?: boolean;
}

/**
 * The single button primitive.
 *
 * `accent` is reserved for confirming and saving. Green signals state in
 * this product, so a green button always means "this commits something".
 */
const variants: Record<Variant, string> = {
  primary: "bg-fg text-bg hover:bg-fg/90 active:bg-fg/80 disabled:bg-fg/40",
  accent:
    "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover disabled:bg-accent/40",
  outline:
    "bg-bg text-fg border border-border hover:bg-surface active:bg-surface-2 disabled:text-meta",
  ghost:
    "bg-transparent text-muted hover:text-fg hover:bg-surface active:bg-surface-2 disabled:text-meta",
  danger:
    "bg-transparent text-danger hover:bg-danger-soft active:bg-danger-soft disabled:text-meta",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[15px]",
  lg: "h-12 px-6 text-[16px]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block = false, className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full",
        "font-medium whitespace-nowrap select-none",
        "transition-colors duration-150",
        "disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        block ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    />
  );
});

export default Button;
