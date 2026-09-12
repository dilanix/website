"use client";

import {
  Fragment,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  getCostOverviewAction,
  queryCostExplorerAction,
} from "@/app/dashboard/products/cost-actions";
import type {
  CoreCostExplorerPoint,
  CoreCostOverview,
  CostUsageMetric,
  ExplorerGranularity,
} from "@/lib/core/api";
import {
  PERIOD_PRESETS,
  customRange,
  formatCostPeriod,
  presetRange,
  type DateRange,
  type PeriodPresetId,
} from "@/lib/billing/cost-summaries";
import { EmptyState } from "@/components/dashboard/primitives";
import { StatCard } from "@/components/dashboard/stat-card";
import { useDashboardFilterState } from "@/lib/dashboard/filter-storage";
import { formatAmount } from "@/components/dashboard/cost/format";

type OverviewPeriodId = PeriodPresetId | "custom";

const METRIC_LABELS: Record<CostUsageMetric, string> = {
  billed_cost: "Billed cost",
  effective_cost: "Effective cost",
  list_cost: "List cost",
  contracted_cost: "Contracted cost",
};

function isOverviewPeriodId(value: unknown): value is OverviewPeriodId {
  return (
    value === "custom" ||
    (typeof value === "string" &&
      PERIOD_PRESETS.some((preset) => preset.id === value))
  );
}

function isDateString(value: unknown): value is string {
  return typeof value === "string";
}

function isCostUsageMetric(value: unknown): value is CostUsageMetric {
  return typeof value === "string" && value in METRIC_LABELS;
}

function trendGranularityFor(range: DateRange): ExplorerGranularity {
  const days = (range.end.getTime() - range.start.getTime()) / 86_400_000;
  if (days <= 45) return "daily";
  if (days <= 210) return "weekly";
  return "monthly";
}

function rangeToIso(range: DateRange) {
  return {
    periodStart: range.start.toISOString(),
    periodEnd: range.end.toISOString(),
  };
}

interface OverviewResult {
  rangeKey: string;
  dataScopeKey: string;
  overview: CoreCostOverview | null;
  trendPoints: CoreCostExplorerPoint[];
}

const CHART_WIDTH = 560;
const CHART_HEIGHT = 140;

function buildTrendPath(points: CoreCostExplorerPoint[]) {
  const amounts = points.map((point) => Number(point.amount));
  const min = Math.min(0, ...amounts);
  const max = Math.max(0, ...amounts);
  const span = max - min || 1;
  const step = points.length > 1 ? CHART_WIDTH / (points.length - 1) : 0;
  const coordinates = points.map((point, index) => {
    const x = points.length > 1 ? index * step : 0;
    const y =
      CHART_HEIGHT - ((Number(point.amount) - min) / span) * CHART_HEIGHT;
    return { x, y };
  });
  const zeroY = CHART_HEIGHT - ((0 - min) / span) * CHART_HEIGHT;
  const polylinePoints =
    coordinates.length === 1
      ? `0,${coordinates[0]!.y} ${CHART_WIDTH},${coordinates[0]!.y}`
      : coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  const areaPoints =
    coordinates.length === 1
      ? `0,${zeroY} 0,${coordinates[0]!.y} ${CHART_WIDTH},${coordinates[0]!.y} ${CHART_WIDTH},${zeroY}`
      : `0,${zeroY} ${polylinePoints} ${CHART_WIDTH},${zeroY}`;
  return { polylinePoints, areaPoints, zeroY };
}

export function SpendOverviewClient({
  initialOverview,
  initialTrendPoints,
  initialRange,
  connectionId,
  targetId,
  scopeSuffix,
}: {
  initialOverview: CoreCostOverview | null;
  initialTrendPoints: CoreCostExplorerPoint[];
  initialRange: DateRange;
  connectionId: string | null;
  targetId: string | null;
  scopeSuffix: string;
}) {
  const initialRangeKey = `${initialRange.start.toISOString()}:${initialRange.end.toISOString()}`;
  const [preset, setPreset, { restored: presetRestored }] =
    useDashboardFilterState<OverviewPeriodId>(
      "cost.overview.period",
      "30d",
      isOverviewPeriodId,
    );
  const [customStart, setCustomStart, { restored: customStartRestored }] =
    useDashboardFilterState("cost.overview.custom-start", "", isDateString);
  const [customEnd, setCustomEnd, { restored: customEndRestored }] =
    useDashboardFilterState("cost.overview.custom-end", "", isDateString);
  const [metric, setMetric, { restored: metricRestored }] =
    useDashboardFilterState<CostUsageMetric>(
      "cost.overview.metric",
      "effective_cost",
      isCostUsageMetric,
    );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const dataScopeKey = `${connectionId ?? "all"}:${targetId ?? "all"}`;
  const [result, setResult] = useState<OverviewResult>({
    rangeKey: initialRangeKey,
    dataScopeKey,
    overview: initialOverview,
    trendPoints: initialTrendPoints,
  });
  const restoredQueryApplied = useRef(false);
  // Falls back to the freshly server-fetched initial props when the connection/
  // target scope changes without this client component remounting — mirrors
  // `CostExplorerClient`'s own `dataScopeKey` guard.
  const overview =
    result.dataScopeKey === dataScopeKey ? result.overview : initialOverview;
  const trendPoints =
    result.dataScopeKey === dataScopeKey
      ? result.trendPoints
      : initialTrendPoints;

  function activeRange(): DateRange | null {
    if (preset === "custom") {
      if (!customStart || !customEnd || customEnd < customStart) return null;
      return customRange(customStart, customEnd);
    }
    return presetRange(preset);
  }

  // Accepts an explicit range/metric so a preset button's or the metric
  // select's own change handler can query the newly chosen value
  // immediately, rather than the stale `preset`/`metric` this render's
  // closure still holds right after calling `setPreset`/`setMetric`.
  function runQuery(
    rangeOverride?: DateRange,
    metricOverride?: CostUsageMetric,
  ) {
    const range = rangeOverride ?? activeRange();
    if (!range) {
      setError("Choose a valid start and end date.");
      return;
    }
    setError("");
    const activeMetric = metricOverride ?? metric;
    const { periodStart, periodEnd } = rangeToIso(range);
    const rangeKey = `${periodStart}:${periodEnd}:${activeMetric}`;
    startTransition(async () => {
      const [overviewResult, trendResult] = await Promise.all([
        getCostOverviewAction({
          periodStart,
          periodEnd,
          connectionId,
          targetId,
          topN: 5,
          metric: activeMetric,
        }),
        queryCostExplorerAction({
          period_start: periodStart,
          period_end: periodEnd,
          metric: activeMetric,
          connection_id: connectionId,
          target_id: targetId,
          granularity: trendGranularityFor(range),
          group_by: [],
          scope: [],
        }),
      ]);
      if (overviewResult.error) return setError(overviewResult.error);
      setResult({
        rangeKey,
        dataScopeKey,
        overview: overviewResult.data ?? null,
        trendPoints: trendResult.data?.items ?? [],
      });
    });
  }

  const restoreQuery = useEffectEvent(() => {
    runQuery();
  });

  useEffect(() => {
    if (
      restoredQueryApplied.current ||
      (!presetRestored &&
        !customStartRestored &&
        !customEndRestored &&
        !metricRestored)
    ) {
      return;
    }
    restoredQueryApplied.current = true;
    const differsFromInitial =
      preset !== "30d" ||
      customStart !== "" ||
      customEnd !== "" ||
      metric !== "effective_cost";
    if (differsFromInitial) window.setTimeout(restoreQuery, 0);
  }, [
    preset,
    presetRestored,
    customStart,
    customStartRestored,
    customEnd,
    customEndRestored,
    metric,
    metricRestored,
  ]);

  const displayedRange = activeRange() ?? presetRange("30d");
  const periodLabel = formatCostPeriod(
    displayedRange.start.toISOString(),
    displayedRange.end.toISOString(),
  );

  const trendByCurrency = new Map<string, CoreCostExplorerPoint[]>();
  for (const point of trendPoints) {
    const list = trendByCurrency.get(point.currency) ?? [];
    list.push(point);
    trendByCurrency.set(point.currency, list);
  }
  for (const list of trendByCurrency.values()) {
    list.sort((a, b) => a.bucket_start.localeCompare(b.bucket_start));
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Spend overview
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            {periodLabel} vs. the immediately preceding period of equal length.
            Includes provider credits and discounts, broken down below by charge
            type.
          </p>
        </div>
        <Link
          href={`/dashboard/products/cost/explorer${scopeSuffix}` as Route}
          className="text-accent inline-flex items-center gap-1 text-xs font-semibold"
        >
          Open Explorer <ArrowRight size={13} />
        </Link>
      </div>

      <div className="border-border-soft bg-dashboard-panel mt-4 flex flex-wrap items-center gap-3 rounded-2xl border p-3 shadow-[0_16px_44px_var(--shadow-card)]">
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_PRESETS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={pending}
              onClick={() => {
                setPreset(option.id);
                runQuery(presetRange(option.id));
              }}
              className={
                preset === option.id
                  ? "border-accent/30 bg-accent/10 text-accent rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                  : "border-foreground/10 text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
              }
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            disabled={pending}
            onClick={() => setPreset("custom")}
            className={
              preset === "custom"
                ? "border-accent/30 bg-accent/10 text-accent rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                : "border-foreground/10 text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
            }
          >
            Custom
          </button>
        </div>
        <label className="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
          Metric
          <select
            value={metric}
            disabled={pending}
            onChange={(event) => {
              const nextMetric = event.target.value as CostUsageMetric;
              setMetric(nextMetric);
              runQuery(undefined, nextMetric);
            }}
            className="border-foreground/15 bg-background focus:border-accent text-foreground h-9 rounded-lg border px-2.5 text-xs outline-none disabled:opacity-60"
          >
            {(Object.keys(METRIC_LABELS) as CostUsageMetric[]).map((value) => (
              <option key={value} value={value}>
                {METRIC_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        {preset === "custom" ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(event) => setCustomStart(event.target.value)}
              className="border-foreground/15 bg-background focus:border-accent h-9 rounded-lg border px-2.5 text-xs outline-none"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="border-foreground/15 bg-background focus:border-accent h-9 rounded-lg border px-2.5 text-xs outline-none"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => runQuery()}
              className="bg-accent text-accent-foreground rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              {pending ? "Loading…" : "Apply"}
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {overview === null ? (
        <div className="mt-4">
          <EmptyState
            title="Cost analytics is unavailable"
            description="This organization does not have the FOCUS cost-usage capability granted yet. Existing budgets, anomalies, and other cost-management configuration remain available below."
          />
        </div>
      ) : overview.by_currency.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No cost data for this period"
            description="Try a wider period, or run a billing sync for a connected provider."
          />
        </div>
      ) : (
        <div
          className={
            pending
              ? "mt-4 opacity-60 transition-opacity"
              : "mt-4 transition-opacity"
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overview.by_currency.map((currency, index) => {
              const change = currency.change_percent;
              const ChangeIcon =
                change === null || change === 0
                  ? Minus
                  : change > 0
                    ? TrendingUp
                    : TrendingDown;
              return (
                <div
                  key={`${result.rangeKey}-${currency.currency}`}
                  className="animate-[demo-panel-in_.4s_ease-out] motion-reduce:animate-none"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <StatCard
                    label={`${currency.currency} spend`}
                    tone={change !== null && change < 0 ? "success" : "default"}
                    value={
                      <>
                        <span className="block">
                          {formatAmount(
                            Number(currency.current_total),
                            currency.currency,
                          )}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-xs font-normal tracking-normal">
                          <ChangeIcon size={12} />
                          {change === null
                            ? "No previous spend"
                            : `${formatAmount(Math.abs(Number(currency.absolute_delta)), currency.currency)} (${Math.abs(change).toFixed(1)}%) vs previous period`}
                        </span>
                      </>
                    }
                  />
                </div>
              );
            })}
          </div>

          {[...trendByCurrency.entries()].map(([currency, points]) => {
            const { polylinePoints, areaPoints, zeroY } =
              buildTrendPath(points);
            return (
              <div
                key={`${result.rangeKey}-trend-${currency}`}
                className="border-border-soft bg-dashboard-panel mt-4 rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]"
              >
                <h3 className="text-sm font-semibold">
                  Spend trend · {currency}
                </h3>
                <svg
                  viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                  preserveAspectRatio="none"
                  className="mt-3 h-32 w-full overflow-visible"
                  aria-label={`${currency} spend trend for the selected period`}
                  role="img"
                >
                  <defs>
                    <linearGradient
                      id={`overview-chart-fill-${currency}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--accent)"
                        stopOpacity="0.24"
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--accent)"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75].map((fraction) => (
                    <line
                      key={fraction}
                      x1="0"
                      x2={CHART_WIDTH}
                      y1={CHART_HEIGHT * fraction}
                      y2={CHART_HEIGHT * fraction}
                      stroke="var(--border-soft)"
                      strokeWidth="1"
                    />
                  ))}
                  <line
                    x1="0"
                    x2={CHART_WIDTH}
                    y1={zeroY}
                    y2={zeroY}
                    stroke="var(--border-soft)"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                  />
                  <polygon
                    points={areaPoints}
                    fill={`url(#overview-chart-fill-${currency})`}
                    className="animate-demo-fade"
                  />
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength="100"
                    className="animate-demo-draw motion-reduce:animate-none"
                  />
                </svg>
              </div>
            );
          })}

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {overview.by_currency.map((currency) => {
              const otherAmount = Number(currency.other_total);
              const maxServiceAmount = Math.max(
                ...currency.top_services.map((service) =>
                  Math.abs(Number(service.amount)),
                ),
                Math.abs(otherAmount),
                1,
              );
              const maxCategoryAmount = Math.max(
                ...currency.by_charge_category.map((item) =>
                  Math.abs(Number(item.amount)),
                ),
                1,
              );
              return (
                <Fragment key={currency.currency}>
                  <div className="border-border-soft bg-dashboard-panel rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)] lg:col-span-2">
                    <h3 className="text-sm font-semibold">
                      Net cost breakdown · {currency.currency}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Gross usage plus tax, credits, and other adjustments
                      reconciles exactly to net cost — the effective amount
                      billed after every credit, discount, and tax.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                      {(
                        [
                          [
                            "Gross usage",
                            currency.financial_breakdown.gross_usage,
                          ],
                          ["Tax", currency.financial_breakdown.tax],
                          ["Credits", currency.financial_breakdown.credits],
                          [
                            "Other adjustments",
                            currency.financial_breakdown.other_adjustments,
                          ],
                        ] as const
                      ).map(([label, amount]) => {
                        const value = Number(amount);
                        return (
                          <div key={label}>
                            <span className="text-muted-foreground block text-xs">
                              {label}
                            </span>
                            <span
                              className={`font-mono text-sm ${value < 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                            >
                              {formatAmount(value, currency.currency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-foreground/10 mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t pt-3">
                      <span className="text-sm font-semibold">Net cost</span>
                      <span className="font-mono text-sm font-semibold">
                        {formatAmount(
                          Number(currency.financial_breakdown.net_cost),
                          currency.currency,
                        )}
                      </span>
                    </div>
                    {currency.financial_breakdown.discount_amount !== null ? (
                      <p className="text-muted-foreground mt-2 text-xs">
                        Discount vs. list price:{" "}
                        {formatAmount(
                          Number(currency.financial_breakdown.discount_amount),
                          currency.currency,
                        )}
                      </p>
                    ) : null}
                  </div>

                  <div className="border-border-soft bg-dashboard-panel rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
                    <h3 className="text-sm font-semibold">
                      Top services · {currency.currency}
                    </h3>
                    {currency.top_services.length === 0 ? (
                      <p className="text-muted-foreground mt-3 text-sm">
                        No service breakdown is available.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {currency.top_services.map((service, index) => {
                          const amount = Number(service.amount);
                          return (
                            <div
                              key={`${service.service_name ?? "unassigned"}-${index}`}
                              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
                            >
                              <span className="truncate text-xs font-medium">
                                {service.service_name ?? "Unassigned service"}
                              </span>
                              <span className="font-mono text-xs">
                                {formatAmount(amount, currency.currency)}
                              </span>
                              <span className="bg-foreground/5 col-span-2 h-1.5 overflow-hidden rounded-full">
                                <span
                                  className="bg-accent block h-full origin-left animate-[demo-bar_.5s_ease-out_both] rounded-full motion-reduce:animate-none"
                                  style={{
                                    width: `${(Math.abs(amount) / maxServiceAmount) * 100}%`,
                                    opacity: 1 - index * 0.12,
                                    animationDelay: `${index * 60}ms`,
                                  }}
                                />
                              </span>
                            </div>
                          );
                        })}
                        {otherAmount !== 0 ? (
                          <div className="border-foreground/10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t pt-3">
                            <span className="text-muted-foreground truncate text-xs font-medium">
                              Other services &amp; credits
                            </span>
                            <span className="text-muted-foreground font-mono text-xs">
                              {formatAmount(otherAmount, currency.currency)}
                            </span>
                            <span className="bg-foreground/5 col-span-2 h-1.5 overflow-hidden rounded-full">
                              <span
                                className="bg-foreground/30 block h-full origin-left animate-[demo-bar_.5s_ease-out_both] rounded-full motion-reduce:animate-none"
                                style={{
                                  width: `${(Math.abs(otherAmount) / maxServiceAmount) * 100}%`,
                                }}
                              />
                            </span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="border-border-soft bg-dashboard-panel rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
                    <h3 className="text-sm font-semibold">
                      By charge type · {currency.currency}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Raw FOCUS category detail behind the breakdown above.
                    </p>
                    {currency.by_charge_category.length === 0 ? (
                      <p className="text-muted-foreground mt-3 text-sm">
                        No charge-type breakdown is available.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {currency.by_charge_category.map((item, index) => {
                          const amount = Number(item.amount);
                          return (
                            <div
                              key={item.category}
                              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
                            >
                              <span className="truncate text-xs font-medium">
                                {item.category}
                              </span>
                              <span
                                className={`font-mono text-xs ${amount < 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                              >
                                {formatAmount(amount, currency.currency)}
                              </span>
                              <span className="bg-foreground/5 col-span-2 h-1.5 overflow-hidden rounded-full">
                                <span
                                  className={`block h-full origin-left animate-[demo-bar_.5s_ease-out_both] rounded-full motion-reduce:animate-none ${amount < 0 ? "bg-emerald-500" : "bg-accent"}`}
                                  style={{
                                    width: `${(Math.abs(amount) / maxCategoryAmount) * 100}%`,
                                    animationDelay: `${index * 60}ms`,
                                  }}
                                />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
