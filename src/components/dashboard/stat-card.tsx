import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "success";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border-soft bg-dashboard-panel dashboard-panel-highlight rounded-[1.4rem] border p-5 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-sm",
        className,
      )}
    >
      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-semibold tracking-[-0.04em]",
          tone === "success" ? "text-success" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
