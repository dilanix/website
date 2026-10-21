import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success";
  className?: string;
}) {
  const tones = {
    neutral:
      "border-border-soft bg-card-strong/70 text-muted-foreground shadow-[0_10px_24px_var(--shadow-card)]",
    accent:
      "border-accent/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--accent)_12%,white),color-mix(in_oklab,var(--accent-secondary)_14%,transparent))] text-accent shadow-[0_14px_30px_var(--shadow-brand)]",
    success: "border-success/30 text-success bg-success/10",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-[0.12em] uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
