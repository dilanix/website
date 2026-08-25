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
        "border-border-soft bg-card-strong/78 shadow-[0_16px_40px_var(--shadow-card)] rounded-2xl border p-5",
        className,
      )}
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-semibold",
          tone === "success" ? "text-success" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
