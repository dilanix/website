import type { AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "bg-accent text-accent-foreground hover:opacity-90 focus-visible:outline-accent",
  secondary:
    "border border-foreground/15 text-foreground hover:border-accent/50 hover:text-accent focus-visible:outline-foreground/40",
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
