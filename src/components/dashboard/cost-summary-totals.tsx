"use client";
import { useEffect, useState, useTransition } from "react";
import type { CoreCostSummaryTotals, CostBasis } from "@/lib/core/api";
import { getCostSummaryTotalsAction } from "@/app/dashboard/integrations/actions";
import {
  costDiff,
  formatCostAmount,
  previousRange,
  type DateRange,
} from "@/lib/billing/cost-summaries";
import { Metric, Skeleton } from "./primitives";
import { cn } from "@/lib/utils";

function DailyBars({ daily }: { daily: CoreCostSummaryTotals["daily"] }) {
  if (daily.length < 2) return null;
  const amounts = daily.map((day) => Number(day.amount));
  const max = Math.max(...amounts, 0);
  return (
    <div
      className="mt-5 flex h-12 items-end gap-0.5"
      role="img"
      aria-label="Daily cost for the selected period"
    >
      {daily.map((day) => {
        const value = Number(day.amount);
        const heightPercent = max > 0 ? Math.max((value / max) * 100, 4) : 4;
        return (
          <div
            key={day.period_start}
            title={`${new Date(day.period_start).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}: ${formatCostAmount(day.amount, day.currency)}${day.is_estimated ? " (estimated)" : ""}`}
            className={cn(
              "bg-accent/60 min-w-[3px] flex-1 rounded-t-[3px] transition-colors",
              day.is_estimated && "bg-accent/30",
            )}
            style={{ height: `${heightPercent}%` }}
          />
        );
      })}
    </div>
  );
}

function DiffLine({
  current,
  previous,
}: {
  current: CoreCostSummaryTotals;
  previous: CoreCostSummaryTotals;
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

export function CostSummaryTotals({
  connectionId,
  range,
  costBasis,
  refreshKey = 0,
}: {
  connectionId: string;
  range: DateRange | null;
  costBasis: CostBasis;
  refreshKey?: number;
}) {
  const [current, setCurrent] = useState<CoreCostSummaryTotals | null>(null);
  const [previous, setPrevious] = useState<CoreCostSummaryTotals | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!range) return;
    startTransition(async () => {
      setError("");
      const previousPeriod = previousRange(range);
      const [currentResult, previousResult] = await Promise.all([
        getCostSummaryTotalsAction(connectionId, {
          periodStart: range.start.toISOString(),
          periodEnd: range.end.toISOString(),
          costBasis,
        }),
        getCostSummaryTotalsAction(connectionId, {
          periodStart: previousPeriod.start.toISOString(),
          periodEnd: previousPeriod.end.toISOString(),
          costBasis,
        }),
      ]);
      if (currentResult.error) return setError(currentResult.error);
      if (previousResult.error) return setError(previousResult.error);
      setCurrent(currentResult.data ?? null);
      setPrevious(previousResult.data ?? null);
    });
  }, [connectionId, range, costBasis, refreshKey]);

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
          <div className="flex flex-wrap gap-8">
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
          </div>
          <DailyBars daily={current.daily} />
        </>
      ) : !range ? (
        <p className="text-muted-foreground text-sm">
          Pick a start and end date.
        </p>
      ) : null}
    </div>
  );
}
