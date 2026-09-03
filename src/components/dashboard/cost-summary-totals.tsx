"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { CoreCostSummaryTotals, CostBasis } from "@/lib/core/api";
import { getCostSummaryTotalsAction } from "@/app/dashboard/integrations/actions";
import {
  COST_BASIS_FILTER_ORDER,
  PERIOD_PRESETS,
  type PeriodPresetId,
  costBasisLabel,
  costDiff,
  customRange,
  formatCostAmount,
  presetRange,
  previousRange,
  type DateRange,
} from "@/lib/billing/cost-summaries";
import { FilterChip } from "./cost-summary-panel";
import { Metric, Skeleton } from "./primitives";
import { cn } from "@/lib/utils";

/** `<input type="date">` value (`"YYYY-MM-DD"`) for a UTC day boundary. */
function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

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

export function CostSummaryTotals({ connectionId }: { connectionId: string }) {
  const [presetId, setPresetId] = useState<PeriodPresetId | "custom">("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [costBasis, setCostBasis] = useState<CostBasis>("net_unblended");
  const [current, setCurrent] = useState<CoreCostSummaryTotals | null>(null);
  const [previous, setPrevious] = useState<CoreCostSummaryTotals | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const range: DateRange | null = useMemo(() => {
    if (presetId === "custom") {
      if (!customStart || !customEnd || customStart > customEnd) return null;
      return customRange(customStart, customEnd);
    }
    return presetRange(presetId);
  }, [presetId, customStart, customEnd]);

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
  }, [connectionId, range, costBasis]);

  return (
    <div className="border-foreground/10 bg-card-strong/40 rounded-xl border p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {PERIOD_PRESETS.map((preset) => (
            <FilterChip
              key={preset.id}
              active={presetId === preset.id}
              onClick={() => setPresetId(preset.id)}
            >
              {preset.label}
            </FilterChip>
          ))}
          <FilterChip
            active={presetId === "custom"}
            onClick={() => {
              if (!customStart || !customEnd) {
                const base =
                  presetId === "custom"
                    ? presetRange("30d")
                    : presetRange(presetId);
                setCustomStart(toDateInputValue(base.start));
                setCustomEnd(
                  toDateInputValue(
                    new Date(base.end.getTime() - 24 * 60 * 60 * 1000),
                  ),
                );
              }
              setPresetId("custom");
            }}
          >
            Custom
          </FilterChip>
          {presetId === "custom" ? (
            <span className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(event) => setCustomStart(event.target.value)}
                className="border-foreground/15 bg-background focus:border-accent h-8 rounded-lg border px-2 text-xs outline-none"
              />
              <span className="text-muted-foreground text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="border-foreground/15 bg-background focus:border-accent h-8 rounded-lg border px-2 text-xs outline-none"
              />
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {COST_BASIS_FILTER_ORDER.map((basis) => (
            <FilterChip
              key={basis}
              active={costBasis === basis}
              onClick={() => setCostBasis(basis)}
            >
              {costBasisLabel(basis)}
            </FilterChip>
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {pending && !current ? (
        <div className="mt-5 flex gap-8">
          <Skeleton className="h-14 w-32" />
          <Skeleton className="h-14 w-32" />
        </div>
      ) : current && previous ? (
        <>
          <div className="mt-5 flex flex-wrap gap-8">
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
      ) : presetId === "custom" && !range ? (
        <p className="text-muted-foreground mt-5 text-sm">
          Pick a start and end date.
        </p>
      ) : null}
    </div>
  );
}
