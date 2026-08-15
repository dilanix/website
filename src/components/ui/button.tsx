import type { AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-foreground text-background hover:bg-foreground/90 focus-visible:outline-foreground",
  secondary:
    "border border-foreground/15 text-foreground hover:border-foreground/30 hover:bg-foreground/[0.04] focus-visible:outline-foreground/40",
  ghost: "text-muted-foreground hover:text-foreground",
} as const;

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: keyof typeof variants;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <a
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
