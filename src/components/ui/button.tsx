import type { AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "text-accent-foreground bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary))] shadow-[0_14px_34px_var(--shadow-brand)] hover:-translate-y-0.5 focus-visible:outline-accent",
  secondary:
    "border border-border-soft bg-card-strong/85 text-foreground shadow-[0_12px_30px_var(--shadow-card)] hover:border-accent/35 hover:bg-surface-strong hover:text-accent focus-visible:outline-foreground/40",
  ghost: "text-muted-foreground hover:text-accent",
} as const;

export type ButtonVariant = keyof typeof variants;

/** Shared styling so non-link elements (e.g. a form's `<button type="submit">`) can match `<Button>` exactly. */
export function buttonVariants(variant: ButtonVariant = "primary") {
  return cn(base, variants[variant]);
}

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <a className={cn(buttonVariants(variant), className)} {...props}>
      {children}
    </a>
  );
}
