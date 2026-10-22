"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  CircleAlert,
  Hourglass,
  TriangleAlert,
} from "lucide-react";
import type { CoreOrganizationPlan, CorePlanWarning } from "@/lib/core/api";
import { cn } from "@/lib/utils";

const SEVERITY_ORDER: Record<CorePlanWarning["severity"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/** The most important plan warning across the dashboard — trial ending or
 * ended, over a limit, sync paused — with the way out. Hidden on the plan
 * page itself, which shows every warning in full. */
export function PlanBanner({ plan }: { plan: CoreOrganizationPlan | null }) {
  const pathname = usePathname();
  if (!plan || pathname.startsWith("/dashboard/plan")) return null;

  const warning = [...plan.warnings]
    .filter((item) => item.severity !== "info")
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])[0];
  if (!warning) return null;

  const critical = warning.severity === "critical";
  const Icon = critical
    ? TriangleAlert
    : warning.code === "trial_ending"
      ? Hourglass
      : CircleAlert;

  return (
    <div
      role={critical ? "alert" : "status"}
      className={cn(
        "mb-6 flex flex-col gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_14px_36px_var(--shadow-card)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between",
        critical
          ? "border-red-500/25 bg-red-500/[0.07]"
          : "border-amber-500/25 bg-amber-500/[0.07]",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg border",
            critical
              ? "border-red-500/25 bg-red-500/10 text-red-500"
              : "border-amber-500/25 bg-amber-500/10 text-amber-500",
          )}
        >
          <Icon size={15} />
        </span>
        <p className="text-sm leading-6">{warning.message}</p>
      </div>
      <Link
        href="/dashboard/plan"
        className="text-accent inline-flex shrink-0 items-center gap-1 self-start text-xs font-semibold sm:self-center"
      >
        {warning.code.startsWith("over_limit")
          ? "Manage accounts"
          : "View plan"}
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
