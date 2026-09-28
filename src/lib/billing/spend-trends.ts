import type { SpendTrendGranularity } from "@/lib/core/api";

export type SpendTrendRangeId = "30d" | "90d" | "12m";

export interface SpendTrendRange {
  id: SpendTrendRangeId;
  label: string;
  granularity: SpendTrendGranularity;
}

/** The Trends view's ranges. Core accepts only completed UTC days (daily) and
 * completed UTC months (monthly), so every range ends at the start of today or
 * of the current month and is compared with the equal-length period before it. */
export const SPEND_TREND_RANGES: readonly SpendTrendRange[] = [
  { id: "30d", label: "30 days", granularity: "daily" },
  { id: "90d", label: "90 days", granularity: "daily" },
  { id: "12m", label: "12 months", granularity: "monthly" },
];

const DEFAULT_SPEND_TREND_RANGE: SpendTrendRangeId = "30d";

export function parseSpendTrendRange(
  value: string | undefined,
): SpendTrendRangeId {
  return SPEND_TREND_RANGES.some((range) => range.id === value)
    ? (value as SpendTrendRangeId)
    : DEFAULT_SPEND_TREND_RANGE;
}

/** `[period_start, period_end)` for a range, as UTC-midnight ISO strings. */
export function spendTrendPeriod(
  rangeId: SpendTrendRangeId,
  now: Date = new Date(),
): {
  periodStart: string;
  periodEnd: string;
  granularity: SpendTrendGranularity;
} {
  const todayStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  if (rangeId === "12m") {
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const start = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 12, 1),
    );
    return {
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      granularity: "monthly",
    };
  }
  const days = rangeId === "90d" ? 90 : 30;
  const end = new Date(todayStart);
  const start = new Date(todayStart - days * 86_400_000);
  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    granularity: "daily",
  };
}
