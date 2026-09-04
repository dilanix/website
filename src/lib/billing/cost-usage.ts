import type { CostUsageMetric } from "@/lib/core/api";

/** Page size used for both the initial server fetch and client-side "Load more". */
export const COST_USAGE_PAGE_SIZE = 25;

/**
 * Labels for FOCUS's four parallel cost columns
 * (`modules.billing.contracts.CostUsageMetric` in Core). Kept as an explicit
 * map, not a mechanical humanizer, matching `COST_BASIS_LABELS`'s own
 * reasoning — these are a small fixed set with real FinOps meaning.
 */
export const COST_USAGE_METRIC_LABELS: Record<CostUsageMetric, string> = {
  effective_cost: "Effective",
  billed_cost: "Billed",
  list_cost: "List",
  contracted_cost: "Contracted",
};

export function costUsageMetricLabel(metric: CostUsageMetric): string {
  return COST_USAGE_METRIC_LABELS[metric] ?? metric;
}

/** Ordered for the metric filter row — effective (the default, Core's own
 * headline "amount you'd use to understand total cost of resource use") first,
 * then billed (pre-discount), then the list/contracted pricing pair. */
export const COST_USAGE_METRIC_FILTER_ORDER: CostUsageMetric[] = [
  "effective_cost",
  "billed_cost",
  "list_cost",
  "contracted_cost",
];
