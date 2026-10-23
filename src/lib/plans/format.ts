import type {
  CorePlanLimitUsage,
  CorePlanPrice,
  CorePublicPlan,
  OrganizationPlanState,
  PlanPriceInterval,
} from "@/lib/core/api";

export type BillingInterval = Exclude<PlanPriceInterval, "custom">;

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/** The price a card shows for the chosen interval: "Free" for the trial, the
 * yearly price as a monthly equivalent when one exists, a custom price, or
 * nothing. */
export function displayPrice(
  plan: CorePublicPlan,
  interval: BillingInterval,
): {
  headline: string;
  suffix: string | null;
  note: string | null;
  custom: boolean;
} | null {
  if (plan.kind === "trial")
    return {
      headline: "Free",
      suffix: null,
      note: "Free trial · no card, no checkout",
      custom: false,
    };
  const byInterval = (wanted: PlanPriceInterval) =>
    plan.prices.find((price) => price.interval === wanted);
  const custom = byInterval("custom");
  const monthly = byInterval("month");
  const yearly = byInterval("year");

  if (interval === "year" && yearly?.amount) {
    const total = Number(yearly.amount);
    const perMonth = total / 12;
    const saving =
      monthly?.amount && Number(monthly.amount) > 0
        ? Math.round((1 - perMonth / Number(monthly.amount)) * 100)
        : 0;
    return {
      headline: money(perMonth, yearly.currency),
      suffix: "/ month",
      note: `${money(total, yearly.currency)} billed yearly${saving > 0 ? ` · save ${saving}%` : ""}`,
      custom: false,
    };
  }
  if (monthly?.amount) {
    return {
      headline: money(Number(monthly.amount), monthly.currency),
      suffix: "/ month",
      note: monthly.label,
      custom: false,
    };
  }
  if (yearly?.amount) {
    return {
      headline: money(Number(yearly.amount), yearly.currency),
      suffix: "/ year",
      note: yearly.label,
      custom: false,
    };
  }
  if (custom) {
    return {
      headline: "Custom",
      suffix: null,
      note: custom.label ?? "Tailored to your accounts and terms",
      custom: true,
    };
  }
  return null;
}

export function hasYearlyPricing(plans: CorePublicPlan[]) {
  return plans.some((plan) =>
    plan.prices.some(
      (price: CorePlanPrice) => price.interval === "year" && price.amount,
    ),
  );
}

/** "Up to 5 cloud accounts" / "Unlimited members". */
export function limitSentence(limit: {
  name: string;
  unit: string;
  value: number | null;
}) {
  const unit = limit.unit || limit.name.toLowerCase();
  if (limit.value === null) return `Unlimited ${unit}`;
  if (limit.value === 1)
    return `1 ${unit.endsWith("s") ? unit.slice(0, -1) : unit}`;
  return `Up to ${limit.value.toLocaleString("en")} ${unit}`;
}

export function planStateLabel(state: OrganizationPlanState) {
  switch (state) {
    case "trial":
      return "Free trial";
    case "trial_expired":
      return "Trial ended";
    case "expired":
      return "Plan ended";
    case "pending":
      return "Starts soon";
    case "none":
      return "No plan";
    default:
      return "Active";
  }
}

export function planStateTone(
  state: OrganizationPlanState,
): "success" | "info" | "warning" | "danger" {
  if (state === "active") return "success";
  if (state === "trial" || state === "pending") return "info";
  return "danger";
}

/** Share of a limit in use, 0–1 (unlimited → 0). */
export function limitRatio(limit: CorePlanLimitUsage) {
  if (limit.limit === null) return 0;
  if (limit.limit === 0) return limit.usage > 0 ? 1 : 0;
  return Math.min(1, limit.usage / limit.limit);
}

export function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
