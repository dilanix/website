import Link from "next/link";
import { ArrowRight, Gauge } from "lucide-react";
import type { CoreOrganizationPlan } from "@/lib/core/api";
import {
  formatDate,
  limitRatio,
  planStateLabel,
  planStateTone,
} from "@/lib/plans/format";
import { cn } from "@/lib/utils";

const TONE = {
  success: "text-success",
  info: "text-accent",
  warning: "text-amber-600 dark:text-amber-300",
  danger: "text-red-600 dark:text-red-400",
} as const;

/** Plan, trial expiry and limit usage at a glance for the Overview page. */
export function PlanSummaryCard({ plan }: { plan: CoreOrganizationPlan }) {
  const tone = planStateTone(plan.state);
  const subtitle =
    plan.state === "trial" && plan.days_remaining !== null
      ? `${plan.days_remaining} day${plan.days_remaining === 1 ? "" : "s"} left · ends ${formatDate(plan.expires_at)}`
      : plan.state === "active"
        ? plan.expires_at
          ? `Active until ${formatDate(plan.expires_at)}`
          : "Active"
        : planStateLabel(plan.state);

  return (
    <Link
      href="/dashboard/plan"
      className="group border-border-soft bg-dashboard-panel hover:border-accent/30 flex flex-col gap-4 rounded-[1.4rem] border p-5 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
            Your plan
          </p>
          <p className="mt-1.5 truncate text-lg font-semibold tracking-[-0.03em]">
            {plan.plan?.name ?? "No active plan"}
          </p>
          <p className={cn("mt-0.5 text-xs font-medium", TONE[tone])}>
            {subtitle}
          </p>
        </div>
        <span className="border-accent/20 bg-accent/10 text-accent flex size-9 shrink-0 items-center justify-center rounded-xl border">
          <Gauge size={16} />
        </span>
      </div>
      {plan.limits.length ? (
        <dl className="space-y-3">
          {plan.limits.map((limit) => (
            <div key={limit.code}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <dt className="text-muted-foreground">{limit.name}</dt>
                <dd className="font-mono font-semibold">
                  {limit.usage} / {limit.limit === null ? "∞" : limit.limit}
                </dd>
              </div>
              <div className="bg-foreground/[0.07] mt-1.5 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full",
                    limit.status === "over_limit_blocked"
                      ? "bg-red-500"
                      : limit.status.startsWith("over_limit")
                        ? "bg-amber-500"
                        : "bg-[linear-gradient(90deg,var(--accent),var(--accent-secondary))]",
                  )}
                  style={{
                    width: `${limit.limit === null ? 6 : Math.max(4, limitRatio(limit) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </dl>
      ) : null}
      <span className="text-accent inline-flex items-center gap-1 text-xs font-semibold">
        Plan & usage
        <ArrowRight
          size={13}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
