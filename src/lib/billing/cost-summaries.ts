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

/** A `[start, end)` UTC day-boundary range — matches Core's own `period_start`/
 * `period_end` convention (`end` exclusive), so the range sent to
 * `.../cost-summaries/totals` lines up exactly with the daily buckets it sums.
 */
export interface DateRange {
  start: Date;
  end: Date;
}

function utcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Rolling day-count presets for the cost totals filter — "1 day", "3 days",
 * "week", "month" — deliberately rolling windows, not calendar periods,
 * mirroring the backend's own `WINDOWED` rolling-refresh design
 * (`Settings.billing_cost_summary_lookback_days`) rather than introducing a
 * second, calendar-aligned notion of "month" the UI alone would own.
 */
export const PERIOD_PRESETS = [
  { id: "1d", label: "1 day", days: 1 },
  { id: "3d", label: "3 days", days: 3 },
  { id: "7d", label: "Week", days: 7 },
  { id: "30d", label: "Month", days: 30 },
] as const;

export type PeriodPresetId = (typeof PERIOD_PRESETS)[number]["id"];

/** `end` is exclusive tomorrow's UTC midnight — today's still-accumulating,
 * `is_estimated=true` data is included, matching the collector's own window
 * convention (`AwsCostSummaryCollector`'s `_window`). */
export function presetRange(
  presetId: PeriodPresetId,
  now: Date = new Date(),
): DateRange {
  const preset = PERIOD_PRESETS.find((candidate) => candidate.id === presetId);
  const days = preset?.days ?? 1;
  const end = new Date(utcMidnight(now).getTime() + 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end };
}

/** The immediately preceding range of the same length — `[start - length, start)`
 * — used to compute a "vs previous period" comparison for any selected range,
 * preset or custom. */
export function previousRange({ start, end }: DateRange): DateRange {
  const length = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - length), end: start };
}

/** A custom calendar-picked `[startDate, endDate]` (both inclusive, `"YYYY-MM-DD"`
 * from a native `<input type="date">`) converted to Core's `[start, end)`
 * convention — `endDate` itself must be included, so `end` is midnight the day
 * *after* it. */
export function customRange(startDate: string, endDate: string): DateRange {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const endDayStart = new Date(`${endDate}T00:00:00.000Z`);
  const end = new Date(endDayStart.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Absolute + percent change from `previous` to `current`, both `Decimal` strings
 * off the wire — parsed only for this display-only comparison, never fed back
 * into anything persisted (matches `formatCostAmount`'s own "display only" rule).
 */
export function costDiff(
  current: string,
  previous: string,
): {
  absolute: number;
  percent: number | null;
  direction: "up" | "down" | "flat";
} {
  const currentValue = Number(current);
  const previousValue = Number(previous);
  const absolute = currentValue - previousValue;
  const percent =
    previousValue !== 0 ? (absolute / Math.abs(previousValue)) * 100 : null;
  const direction = absolute > 0 ? "up" : absolute < 0 ? "down" : "flat";
  return { absolute, percent, direction };
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
