"use client";
import { useEffect, useState, useTransition } from "react";
import type { CoreUnifiedCostTotals } from "@/lib/core/api";
import { getUnifiedCostTotalsAction } from "@/app/dashboard/integrations/actions";
import {
  costDiff,
  formatCostAmount,
  previousRange,
  type DateRange,
} from "@/lib/billing/cost-summaries";
import { Metric, Skeleton, StatusBadge } from "./primitives";
import { cn } from "@/lib/utils";

/** `cost_usage` (FOCUS) is the richer, complete-coverage source; `cost_summary`
 * (Cost Explorer) is the always-available fallback — badge tone follows that,
 * matching `StatusBadge`'s own "success = the better state" convention. */
function SourceBadge({ source }: { source: CoreUnifiedCostTotals["source"] }) {
  return (
    <StatusBadge status={source === "cost_usage" ? "success" : "neutral"}>
      {source === "cost_usage" ? "FOCUS" : "Cost Explorer"}
    </StatusBadge>
  );
}

function DiffLine({
  current,
  previous,
}: {
  current: CoreUnifiedCostTotals;
  previous: CoreUnifiedCostTotals;
}) {
  const diff = costDiff(current.total_amount, previous.total_amount);
  const currency = current.currency ?? previous.currency ?? "USD";
  const sign = diff.absolute > 0 ? "+" : "";
  const percentLabel =
    diff.percent === null ? "" : ` (${sign}${diff.percent.toFixed(1)}%)`;
  return (
    <p
      className={cn(
        "mt-1.5 font-mono text-[11px]",
        diff.direction === "up" && "text-amber-600 dark:text-amber-300",
        diff.direction === "down" && "text-success",
        diff.direction === "flat" && "text-muted-foreground",
      )}
    >
      {sign}
      {formatCostAmount(diff.absolute.toFixed(6), currency)}
      {percentLabel} vs previous period
    </p>
  );
}

/**
 * The headline "best available total" widget — reads Core's coverage-aware,
 * source-selecting `.../costs/totals` (`BillingQueryService`) instead of either
 * dataset-specific totals endpoint, so it never needs to know which source is
 * live. Deliberately has no daily bar chart (unlike `CostSummaryTotals`):
 * `UnifiedCostTotalsResponse` carries no per-day breakdown, since the two
 * datasets it may draw from bucket days differently (`billing.cost_summary`'s
 * `period_start`/`period_end` vs `billing.cost_usage`'s `charge_period_start`/
 * `charge_period_end`).
 */
export function UnifiedCostTotals({
  connectionId,
  range,
  refreshKey = 0,
}: {
  connectionId: string;
  range: DateRange | null;
  refreshKey?: number;
}) {
  const [current, setCurrent] = useState<CoreUnifiedCostTotals | null>(null);
  const [previous, setPrevious] = useState<CoreUnifiedCostTotals | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!range) return;
    startTransition(async () => {
      setError("");
      const previousPeriod = previousRange(range);
      const [currentResult, previousResult] = await Promise.all([
        getUnifiedCostTotalsAction(connectionId, {
          periodStart: range.start.toISOString(),
          periodEnd: range.end.toISOString(),
        }),
        getUnifiedCostTotalsAction(connectionId, {
          periodStart: previousPeriod.start.toISOString(),
          periodEnd: previousPeriod.end.toISOString(),
        }),
      ]);
      if (currentResult.error) return setError(currentResult.error);
      if (previousResult.error) return setError(previousResult.error);
      setCurrent(currentResult.data ?? null);
      setPrevious(previousResult.data ?? null);
    });
  }, [connectionId, range, refreshKey]);

  return (
    <div
      className={cn(
        "border-foreground/10 bg-card-strong/40 rounded-xl border p-5 transition-opacity",
        pending && current && "opacity-70",
      )}
    >
      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {pending && !current ? (
        <div className="flex gap-8">
          <Skeleton className="h-14 w-32" />
          <Skeleton className="h-14 w-32" />
        </div>
      ) : current && previous ? (
        <>
          <div className="flex flex-wrap items-start gap-8">
            <Metric
              label="Total"
              value={formatCostAmount(
                current.total_amount,
                current.currency ?? "USD",
              )}
              detail={<DiffLine current={current} previous={previous} />}
            />
            <Metric
              label="Previous period"
              value={formatCostAmount(
                previous.total_amount,
                previous.currency ?? "USD",
              )}
            />
            <div className="flex flex-col items-start gap-1.5 pt-0.5">
              <SourceBadge source={current.source} />
              {current.is_estimated ? (
                <StatusBadge status="warning">Estimated</StatusBadge>
              ) : null}
            </div>
          </div>
        </>
      ) : !range ? (
        <p className="text-muted-foreground text-sm">
          Pick a start and end date.
        </p>
      ) : null}
    </div>
  );
}
