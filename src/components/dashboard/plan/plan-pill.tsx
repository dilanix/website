import Link from "next/link";
import type { CoreOrganizationPlan } from "@/lib/core/api";
import { planStateLabel, planStateTone } from "@/lib/plans/format";
import { cn } from "@/lib/utils";

const TONE_CLASS = {
  success: "border-success/25 bg-success/10 text-success",
  info: "border-accent/25 bg-accent/10 text-accent",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  danger: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
} as const;

/** The organization's plan at a glance: "Growth", "Trial · 9 days left",
 * "Trial ended". Links to the plan page. */
export function PlanPill({
  plan,
  className,
}: {
  plan: CoreOrganizationPlan;
  className?: string;
}) {
  const tone = planStateTone(plan.state);
  const label =
    plan.state === "active" && plan.plan
      ? plan.plan.name
      : plan.state === "trial" && plan.days_remaining !== null
        ? `Trial · ${plan.days_remaining} day${plan.days_remaining === 1 ? "" : "s"} left`
        : planStateLabel(plan.state);

  return (
    <Link
      href="/dashboard/plan"
      title="Plan & usage"
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-opacity hover:opacity-80",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
