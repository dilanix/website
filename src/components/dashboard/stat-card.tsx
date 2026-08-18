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
      className={cn("border-foreground/10 rounded-xl border p-5", className)}
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
