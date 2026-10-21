import type { CoreBudget, CoreCostExplorerPoint } from "@/lib/core/api";
import type { DateRange } from "@/lib/billing/cost-summaries";

function utcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Resolves the `[start, end)` window a budget's pacing chart should query.
 * Custom budgets already carry explicit `period_start`/`period_end`; the
 * recurring periods (`monthly`/`quarterly`/`annual`) don't — Core only knows
 * the cadence, not any specific instance of it — so this computes the
 * *current* UTC calendar window for whichever cadence the budget uses.
 */
export function resolveBudgetPeriod(
  budget: CoreBudget,
  now: Date = new Date(),
): DateRange {
  if (budget.period_start && budget.period_end) {
    return {
      start: new Date(budget.period_start),
      end: new Date(budget.period_end),
    };
  }
  const today = utcMidnight(now);
  switch (budget.period) {
    case "quarterly": {
      const quarterStartMonth = Math.floor(today.getUTCMonth() / 3) * 3;
      const start = new Date(Date.UTC(today.getUTCFullYear(), quarterStartMonth, 1));
      const end = new Date(Date.UTC(today.getUTCFullYear(), quarterStartMonth + 3, 1));
      return { start, end };
    }
    case "annual": {
      const start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
      const end = new Date(Date.UTC(today.getUTCFullYear() + 1, 0, 1));
      return { start, end };
    }
    case "monthly":
    default: {
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
      return { start, end };
    }
  }
}

export interface PacingPoint {
  /** ISO day the point represents. */
  date: string;
  cumulative: number;
}

export interface PacingSeries {
  /** Cumulative actual spend, one point per day with data, up to `min(now, period.end)`. */
  actual: PacingPoint[];
  /**
   * Two-point line from the last actual point to the projected total at
   * `period.end` — `null` once the period has fully elapsed (nothing left to
   * project) or when there isn't enough data to extrapolate from.
   */
  forecastTail: PacingPoint[] | null;
  /** The projected cumulative total at `period.end`, or `null` alongside `forecastTail`. */
  projectedTotal: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Builds a cumulative actual-spend series plus a simple linear forecast tail
 * — the trailing (up to) 7-day daily average, projected across the days
 * remaining in the period. Deliberately naive (no seasonality, no weighting):
 * there is no forecasting support in Core today, so this is labeled
 * "estimated" everywhere it's displayed rather than presented as authoritative.
 */
export function buildPacingSeries(
  points: CoreCostExplorerPoint[],
  period: DateRange,
  now: Date = new Date(),
): PacingSeries {
  const sorted = [...points].sort((a, b) =>
    a.bucket_start.localeCompare(b.bucket_start),
  );

  let cumulative = 0;
  const actual: PacingPoint[] = sorted.map((point) => {
    cumulative += Number(point.amount);
    return { date: point.bucket_start, cumulative };
  });

  const lastActual = actual[actual.length - 1];
  const periodEndMs = period.end.getTime();
  const nowMs = Math.min(now.getTime(), periodEndMs);

  if (!lastActual || nowMs >= periodEndMs) {
    return { actual, forecastTail: null, projectedTotal: null };
  }

  const trailingWindow = sorted.slice(-7);
  const trailingTotal = trailingWindow.reduce(
    (sum, point) => sum + Number(point.amount),
    0,
  );
  const trailingDailyAvg =
    trailingWindow.length > 0 ? trailingTotal / trailingWindow.length : 0;

  const lastActualMs = new Date(lastActual.date).getTime();
  const remainingDays = Math.max(
    0,
    (periodEndMs - lastActualMs) / MS_PER_DAY,
  );
  const projectedTotal =
    lastActual.cumulative + trailingDailyAvg * remainingDays;

  return {
    actual,
    forecastTail: [
      lastActual,
      { date: period.end.toISOString(), cumulative: projectedTotal },
    ],
    projectedTotal,
  };
}
