import type { CostBasis } from "@/lib/core/api";

/** Page size used for both the initial server fetch and client-side "Load more". */
export const COST_SUMMARIES_PAGE_SIZE = 25;

/**
 * Labels for AWS Cost Explorer's supported cost bases
 * (`modules.billing.models.CostBasis` in Core). Kept as an explicit map, not a
 * mechanical humanizer, since these are a small fixed set with real FinOps
 * meaning ("net" = after negotiated discounts, "amortized" = commitment cost
 * spread across its term) that a generic label would blur.
 */
export const COST_BASIS_LABELS: Record<CostBasis, string> = {
  unblended: "Unblended",
  net_unblended: "Net unblended",
  amortized: "Amortized",
  net_amortized: "Net amortized",
};

export function costBasisLabel(costBasis: CostBasis): string {
  return COST_BASIS_LABELS[costBasis] ?? costBasis;
}

/** Ordered for the cost-basis filter row — unblended (the default, closest to
 * an on-demand bill) first, then its "net" (post-discount) counterpart, then
 * the amortized pair. */
export const COST_BASIS_FILTER_ORDER: CostBasis[] = [
  "unblended",
  "net_unblended",
  "amortized",
  "net_amortized",
];

/**
 * Formats a `CoreCostSummary.amount` decimal string as localized currency.
 * Never parses the string for arithmetic — display only, matching the
 * backend's own "Decimal on the wire, Decimal in the database" invariant.
 * Widens to 4 fraction digits for values under a cent so a real (if tiny)
 * line item doesn't silently round to "$0.00".
 */
export function formatCostAmount(amount: string, currency: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  const maximumFractionDigits = value !== 0 && Math.abs(value) < 0.01 ? 4 : 2;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits,
    }).format(value);
  } catch {
    // An unrecognized ISO currency code would throw a RangeError — fall back
    // to a plain number rather than crashing the panel over a display detail.
    return `${value.toFixed(maximumFractionDigits)} ${currency}`;
  }
}

/**
 * `"Aug 1 – Aug 2, 2026"` for a daily period; collapses to one date when
 * start/end land on the same calendar day (never expected for `DAILY`
 * granularity today, but keeps this correct if a coarser granularity is ever
 * added).
 *
 * Formatted in UTC, not the viewer's local timezone: Core's `period_start`/
 * `period_end` are bounded UTC day boundaries (`SYNC_INGESTION_ARCHITECTURE.md`
 * "Cost data"), and letting the browser's local timezone shift them would
 * make a viewer west of UTC see "Jul 31" for a period AWS itself reports as
 * Aug 1.
 */
export function formatCostPeriod(
  periodStart: string,
  periodEnd: string,
): string {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  };
  const sameDay =
    start.toISOString().slice(0, 10) === end.toISOString().slice(0, 10);
  if (sameDay) {
    return start.toLocaleDateString(undefined, {
      ...dateOptions,
      year: "numeric",
    });
  }
  const startLabel = start.toLocaleDateString(undefined, dateOptions);
  const endLabel = end.toLocaleDateString(undefined, {
    ...dateOptions,
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}
