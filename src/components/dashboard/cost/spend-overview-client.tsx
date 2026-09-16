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
  getCostDriversAction,
  getCostForecastAction,
  getCostOverviewAction,
  queryCostExplorerAction,
} from "@/app/dashboard/products/cost-actions";
import type {
  CoreBudget,
  CoreCostDriver,
  CoreCostDrivers,
  CoreCostExplorerPoint,
  CoreCostForecast,
  CoreCostOverview,
  ScopeDimension,
} from "@/lib/core/api";
import {
  PERIOD_PRESETS,
  customRange,
  formatCostPeriod,
  monthToDateRange,
  presetRange,
  type DateRange,
  type PeriodPresetId,
} from "@/lib/billing/cost-summaries";
import { EmptyState } from "@/components/dashboard/primitives";
import { StatCard } from "@/components/dashboard/stat-card";
import { SourceBadge } from "@/components/dashboard/unified-cost-totals";
import { useDashboardFilterState } from "@/lib/dashboard/filter-storage";
import { formatAmount } from "@/components/dashboard/cost/format";
import { SCOPE_DIMENSION_LABELS } from "@/components/dashboard/cost/scope-editor";
import {
  buildPacingSeries,
  resolveBudgetPeriod,
} from "@/components/dashboard/cost/budget-pacing";

type OverviewPresetId = PeriodPresetId | "mtd";
type OverviewPeriodId = OverviewPresetId | "custom";

const OVERVIEW_PERIOD_PRESETS: ReadonlyArray<{
  id: OverviewPresetId;
  label: string;
}> = [
  { id: "mtd", label: "Month to date" },
  ...PERIOD_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.id === "30d" ? "30 days" : preset.label,
  })),
];

// Overview's headline KPIs and trend are always the canonical, non-selectable
// `effective_cost` measure — matching Core's own fixed `_CANONICAL_COST_USAGE_METRIC`
// (`OverviewService`) — so they can never disagree with Workspace -> Costs' own
// totals for the same scope/period. Billed/list/contracted cost remain
// selectable only in Cost Explorer.
const CANONICAL_METRIC = "effective_cost" as const;

function isOverviewPeriodId(value: unknown): value is OverviewPeriodId {
  return (
    value === "custom" ||
    (typeof value === "string" &&
      OVERVIEW_PERIOD_PRESETS.some((preset) => preset.id === value))
  );
}

function overviewPresetRange(preset: OverviewPresetId): DateRange {
  return preset === "mtd" ? monthToDateRange() : presetRange(preset);
}

function isDateString(value: unknown): value is string {
  return typeof value === "string";
}

// Always daily, regardless of period length — the trend chart's whole purpose
// is to show exactly how spend moves day by day; a caller wanting a coarser
// weekly/monthly rollup has Explorer's own granularity selector for that.
const TREND_GRANULARITY = "daily" as const;

function formatDayLabel(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function rangeToIso(range: DateRange) {
  return {
    periodStart: range.start.toISOString(),
    periodEnd: range.end.toISOString(),
  };
}

/** Core periods use an exclusive end. Coverage copy is user-facing, so show
 * the final included UTC calendar day instead of the next boundary. */
function formatCoveragePeriod(periodStart: string, periodEnd: string) {
  const inclusiveEnd = new Date(new Date(periodEnd).getTime() - 1);
  return formatCostPeriod(periodStart, inclusiveEnd.toISOString());
}

interface OverviewResult {
  rangeKey: string;
  dataScopeKey: string;
  overview: CoreCostOverview | null;
  trendPoints: CoreCostExplorerPoint[];
  previousTrendPoints: CoreCostExplorerPoint[];
  trendAvailable: boolean;
  previousTrendAvailable: boolean;
}

/** Sums a set of `CoreCostExplorerPoint.amount` — always FOCUS/`cost_usage`
 * sourced (`cost/explorer/query`'s own canonical `effective_cost` metric),
 * unlike `CoreCostOverview.by_currency[].current_total`, which can come from
 * the disclosed `cost_summary` fallback when no complete trailing FOCUS range
 * exists. The headline totals below use this sum only with confirmed complete
 * FOCUS coverage, so a real zero stays distinct from unavailable data. */
function sumAmounts(points: CoreCostExplorerPoint[]) {
  return points.reduce((sum, point) => sum + Number(point.amount), 0);
}

const CHART_WIDTH = 560;
const CHART_HEIGHT = 140;

/** The three `ScopeDimension`s most useful as an at-a-glance Overview
 * breakdown — the rest (resource-level, tags, ...) stay Explorer-only, where
 * there's room for the full scope editor. */
const BREAKDOWN_DIMENSIONS: ScopeDimension[] = [
  "provider_name",
  "billing_account_id",
  "region_id",
];

function groupDriversByCurrency(drivers: CoreCostDriver[]) {
  const map = new Map<string, CoreCostDriver[]>();
  for (const driver of drivers) {
    const list = map.get(driver.currency) ?? [];
    list.push(driver);
    map.set(driver.currency, list);
  }
  return map;
}

function groupBudgetsByCurrency(budgets: CoreBudget[]) {
  const map = new Map<string, CoreBudget[]>();
  for (const budget of budgets) {
    const list = map.get(budget.currency) ?? [];
    list.push(budget);
    map.set(budget.currency, list);
  }
  return map;
}

/** x is mapped by calendar position within `period` (not by point index),
 * since the forecast tail's final point lands on `period.end`, not on the
 * next daily step. */
function buildPacingChart(
  series: ReturnType<typeof buildPacingSeries>,
  budgetAmount: number,
  period: DateRange,
) {
  const periodStartMs = period.start.getTime();
  const span = Math.max(1, period.end.getTime() - periodStartMs);
  const xFor = (iso: string) =>
    ((new Date(iso).getTime() - periodStartMs) / span) * CHART_WIDTH;

  const maxValue = Math.max(
    1,
    budgetAmount,
    ...series.actual.map((point) => point.cumulative),
    ...(series.forecastTail?.map((point) => point.cumulative) ?? []),
  );
  const yFor = (value: number) =>
    CHART_HEIGHT - (value / maxValue) * CHART_HEIGHT;

  const actualMarkers = series.actual.map((point) => ({
    x: xFor(point.date),
    y: yFor(point.cumulative),
    point,
  }));
  const actualPolyline = actualMarkers.map(({ x, y }) => `${x},${y}`).join(" ");
  const forecastPolyline = series.forecastTail
    ? series.forecastTail
        .map((point) => `${xFor(point.date)},${yFor(point.cumulative)}`)
        .join(" ")
    : null;

  return {
    actualMarkers,
    actualPolyline,
    forecastPolyline,
    budgetLineY: yFor(budgetAmount),
  };
}

export function SpendOverviewClient({
  initialOverview,
  initialTrendPoints,
  initialPreviousTrendPoints,
  initialTrendAvailable,
  initialPreviousTrendAvailable,
  initialRange,
  connectionId,
  targetId,
  scopeSuffix,
  budgets,
}: {
  initialOverview: CoreCostOverview | null;
  initialTrendPoints: CoreCostExplorerPoint[];
  initialPreviousTrendPoints: CoreCostExplorerPoint[];
  initialTrendAvailable: boolean;
  initialPreviousTrendAvailable: boolean;
  initialRange: DateRange;
  connectionId: string | null;
  targetId: string | null;
  scopeSuffix: string;
  budgets: CoreBudget[];
}) {
  const initialRangeKey = `${initialRange.start.toISOString()}:${initialRange.end.toISOString()}`;
  const [preset, setPreset, { restored: presetRestored }] =
    useDashboardFilterState<OverviewPeriodId>(
      "cost.overview.period",
      "mtd",
      isOverviewPeriodId,
    );
  const [customStart, setCustomStart, { restored: customStartRestored }] =
    useDashboardFilterState("cost.overview.custom-start", "", isDateString);
  const [customEnd, setCustomEnd, { restored: customEndRestored }] =
    useDashboardFilterState("cost.overview.custom-end", "", isDateString);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const dataScopeKey = `${connectionId ?? "all"}:${targetId ?? "all"}`;
  const [result, setResult] = useState<OverviewResult>({
    rangeKey: initialRangeKey,
    dataScopeKey,
    overview: initialOverview,
    trendPoints: initialTrendPoints,
    previousTrendPoints: initialPreviousTrendPoints,
    trendAvailable: initialTrendAvailable,
    previousTrendAvailable: initialPreviousTrendAvailable,
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
  const previousTrendPoints =
    result.dataScopeKey === dataScopeKey
      ? result.previousTrendPoints
      : initialPreviousTrendPoints;
  const trendAvailable =
    result.dataScopeKey === dataScopeKey
      ? result.trendAvailable
      : initialTrendAvailable;
  const previousTrendAvailable =
    result.dataScopeKey === dataScopeKey
      ? result.previousTrendAvailable
      : initialPreviousTrendAvailable;

  function activeRange(): DateRange | null {
    if (preset === "custom") {
      if (!customStart || !customEnd || customEnd < customStart) return null;
      return customRange(customStart, customEnd);
    }
    return overviewPresetRange(preset);
  }

  // Accepts an explicit range so a preset button's own change handler can query
  // the newly chosen value immediately, rather than the stale `preset` this
  // render's closure still holds right after calling `setPreset`.
  function runQuery(rangeOverride?: DateRange) {
    const range = rangeOverride ?? activeRange();
    if (!range) {
      setError("Choose a valid start and end date.");
      return;
    }
    setError("");
    const { periodStart, periodEnd } = rangeToIso(range);
    const rangeKey = `${periodStart}:${periodEnd}`;
    startTransition(async () => {
      const overviewResult = await getCostOverviewAction({
        periodStart,
        periodEnd,
        connectionId,
        targetId,
        topN: 5,
      });
      if (overviewResult.error) return setError(overviewResult.error);

      const nextOverview = overviewResult.data ?? null;
      if (nextOverview?.source !== "cost_usage") {
        setResult({
          rangeKey,
          dataScopeKey,
          overview: nextOverview,
          trendPoints: [],
          previousTrendPoints: [],
          trendAvailable: false,
          previousTrendAvailable: false,
        });
        return;
      }

      const [trendResult, previousTrendResult] = await Promise.all([
        queryCostExplorerAction({
          period_start: nextOverview.period_start,
          period_end: nextOverview.period_end,
          metric: CANONICAL_METRIC,
          connection_id: connectionId,
          target_id: targetId,
          granularity: TREND_GRANULARITY,
          group_by: [],
          scope: [],
        }),
        queryCostExplorerAction({
          period_start: nextOverview.previous_period_start,
          period_end: nextOverview.previous_period_end,
          metric: CANONICAL_METRIC,
          connection_id: connectionId,
          target_id: targetId,
          granularity: null,
          group_by: [],
          scope: [],
        }),
      ]);
      setResult({
        rangeKey,
        dataScopeKey,
        overview: nextOverview,
        trendPoints: trendResult.data?.items ?? [],
        previousTrendPoints: previousTrendResult.data?.items ?? [],
        trendAvailable: Boolean(trendResult.data),
        previousTrendAvailable: Boolean(previousTrendResult.data),
      });
    });
  }

  const restoreQuery = useEffectEvent(() => {
    runQuery();
  });

  useEffect(() => {
    if (
      restoredQueryApplied.current ||
      (!presetRestored && !customStartRestored && !customEndRestored)
    ) {
      return;
    }
    restoredQueryApplied.current = true;
    const differsFromInitial =
      preset !== "mtd" || customStart !== "" || customEnd !== "";
    if (differsFromInitial) window.setTimeout(restoreQuery, 0);
  }, [
    preset,
    presetRestored,
    customStart,
    customStartRestored,
    customEnd,
    customEndRestored,
  ]);

  const displayedRange = activeRange() ?? monthToDateRange();
  const periodLabel = formatCostPeriod(
    displayedRange.start.toISOString(),
    displayedRange.end.toISOString(),
  );
  const { periodStart: displayedPeriodStart, periodEnd: displayedPeriodEnd } =
    rangeToIso(displayedRange);
  const displayedRangeKey = `${displayedPeriodStart}:${displayedPeriodEnd}`;
  const activeResultRangeKey =
    result.dataScopeKey === dataScopeKey ? result.rangeKey : initialRangeKey;
  const resultMatchesDisplayedRange =
    activeResultRangeKey === displayedRangeKey;
  const hasCompleteFocusCoverage =
    resultMatchesDisplayedRange && overview?.source === "cost_usage";
  const focusPeriodStart = hasCompleteFocusCoverage
    ? overview.period_start
    : null;
  const focusPeriodEnd = hasCompleteFocusCoverage ? overview.period_end : null;
  const focusCoverageLabel =
    focusPeriodStart && focusPeriodEnd
      ? `FOCUS coverage: ${formatCoveragePeriod(focusPeriodStart, focusPeriodEnd)}`
      : null;

  // ---------------------------------------------------------------------
  // Breakdown by dimension (provider / billing account / region)
  // ---------------------------------------------------------------------
  const [dimension, setDimension] = useState<ScopeDimension>("provider_name");
  const [dimensionPoints, setDimensionPoints] = useState<
    CoreCostExplorerPoint[]
  >([]);
  const [dimensionPending, setDimensionPending] = useState(false);
  const [dimensionError, setDimensionError] = useState(false);
  const dimensionCacheRef = useRef(new Map<string, CoreCostExplorerPoint[]>());

  useEffect(() => {
    if (!focusPeriodStart || !focusPeriodEnd) return;
    const cacheKey = `${focusPeriodStart}:${focusPeriodEnd}:${dataScopeKey}:${dimension}`;
    const cached = dimensionCacheRef.current.get(cacheKey);
    if (cached) {
      setDimensionPoints(cached);
      setDimensionPending(false);
      setDimensionError(false);
      return;
    }
    let cancelled = false;
    setDimensionPending(true);
    setDimensionError(false);
    queryCostExplorerAction({
      period_start: focusPeriodStart,
      period_end: focusPeriodEnd,
      metric: CANONICAL_METRIC,
      connection_id: connectionId,
      target_id: targetId,
      granularity: null,
      group_by: [{ dimension }],
      scope: [],
    }).then((response) => {
      if (cancelled) return;
      const items = response.data?.items ?? [];
      if (response.data) dimensionCacheRef.current.set(cacheKey, items);
      setDimensionPoints(items);
      setDimensionError(Boolean(response.error) || !response.data);
      setDimensionPending(false);
    });
    return () => {
      cancelled = true;
    };
  }, [
    focusPeriodStart,
    focusPeriodEnd,
    dataScopeKey,
    dimension,
    connectionId,
    targetId,
  ]);

  const dimensionByCurrency = new Map<string, CoreCostExplorerPoint[]>();
  for (const point of dimensionPoints) {
    const list = dimensionByCurrency.get(point.currency) ?? [];
    list.push(point);
    dimensionByCurrency.set(point.currency, list);
  }

  // ---------------------------------------------------------------------
  // Cost Drivers — why did spend change? (service-level current-vs-previous
  // deltas, ranked). Queried over the same disclosed complete-FOCUS range as
  // the dimension breakdown above, mirroring that effect's caching/guard.
  // ---------------------------------------------------------------------
  const [drivers, setDrivers] = useState<CoreCostDrivers | null>(null);
  const [driversPending, setDriversPending] = useState(false);
  const [driversError, setDriversError] = useState(false);
  const driversCacheRef = useRef(new Map<string, CoreCostDrivers>());

  useEffect(() => {
    if (!focusPeriodStart || !focusPeriodEnd) return;
    const cacheKey = `${focusPeriodStart}:${focusPeriodEnd}:${dataScopeKey}`;
    const cached = driversCacheRef.current.get(cacheKey);
    if (cached) {
      setDrivers(cached);
      setDriversPending(false);
      setDriversError(false);
      return;
    }
    let cancelled = false;
    setDriversPending(true);
    setDriversError(false);
    getCostDriversAction({
      periodStart: focusPeriodStart,
      periodEnd: focusPeriodEnd,
      connectionId,
      targetId,
      topN: 5,
    }).then((response) => {
      if (cancelled) return;
      if (response.data) driversCacheRef.current.set(cacheKey, response.data);
      setDrivers(response.data ?? null);
      setDriversError(Boolean(response.error) || !response.data);
      setDriversPending(false);
    });
    return () => {
      cancelled = true;
    };
  }, [focusPeriodStart, focusPeriodEnd, dataScopeKey, connectionId, targetId]);

  const increasesByCurrency = groupDriversByCurrency(drivers?.increases ?? []);
  const decreasesByCurrency = groupDriversByCurrency(drivers?.decreases ?? []);
  const driverCurrencies = [
    ...new Set([...increasesByCurrency.keys(), ...decreasesByCurrency.keys()]),
  ].sort();

  // ---------------------------------------------------------------------
  // Forecast — where is spend headed? Deterministic period-to-date daily-rate
  // projection to the end of the *selected* period. Unlike Cost Drivers above,
  // this has a `cost_summary` fallback in Core, so it is not gated behind
  // `hasCompleteFocusCoverage` — only behind the period actually being
  // currently in progress, which `ForecastService` itself requires
  // (`period_start <= now < period_end`). That check is Core's alone — the
  // client never re-derives "now" itself; a past custom range simply comes
  // back with `periodNotInProgress` set on the action's response.
  // ---------------------------------------------------------------------
  const [forecast, setForecast] = useState<CoreCostForecast | null>(null);
  const [forecastNotInProgress, setForecastNotInProgress] = useState(false);
  const [forecastPending, setForecastPending] = useState(false);
  const [forecastError, setForecastError] = useState(false);
  const forecastCacheRef = useRef(new Map<string, CoreCostForecast>());

  useEffect(() => {
    if (!resultMatchesDisplayedRange) return;
    const cacheKey = `${displayedPeriodStart}:${displayedPeriodEnd}:${dataScopeKey}`;
    const cached = forecastCacheRef.current.get(cacheKey);
    if (cached) {
      setForecast(cached);
      setForecastNotInProgress(false);
      setForecastPending(false);
      setForecastError(false);
      return;
    }
    let cancelled = false;
    setForecastPending(true);
    setForecastError(false);
    getCostForecastAction({
      periodStart: displayedPeriodStart,
      periodEnd: displayedPeriodEnd,
      connectionId,
      targetId,
    }).then((response) => {
      if (cancelled) return;
      if (response.data) forecastCacheRef.current.set(cacheKey, response.data);
      setForecast(response.data ?? null);
      setForecastNotInProgress(Boolean(response.periodNotInProgress));
      setForecastError(
        Boolean(response.error) &&
          !response.periodNotInProgress &&
          !response.data,
      );
      setForecastPending(false);
    });
    return () => {
      cancelled = true;
    };
  }, [
    resultMatchesDisplayedRange,
    displayedPeriodStart,
    displayedPeriodEnd,
    dataScopeKey,
    connectionId,
    targetId,
  ]);

  // ---------------------------------------------------------------------
  // Budget pacing (plan vs. actual vs. a naive trailing-average forecast)
  // ---------------------------------------------------------------------
  const budgetsByCurrency = groupBudgetsByCurrency(budgets);
  const [activeBudgetByCurrency, setActiveBudgetByCurrency] = useState<
    Record<string, string>
  >({});
  const [pacingByBudgetId, setPacingByBudgetId] = useState<
    Record<string, CoreCostExplorerPoint[]>
  >({});
  const [pacingPendingIds, setPacingPendingIds] = useState<Set<string>>(
    new Set(),
  );
  const pacingCacheRef = useRef(new Map<string, CoreCostExplorerPoint[]>());
  const activeBudgetIdsKey = [...budgetsByCurrency.entries()]
    .map(([currency, list]) => activeBudgetByCurrency[currency] ?? list[0]!.id)
    .join(",");

  useEffect(() => {
    const ids = activeBudgetIdsKey ? activeBudgetIdsKey.split(",") : [];
    const toFetch = ids.filter((id) => !pacingCacheRef.current.has(id));
    if (toFetch.length === 0) return;
    let cancelled = false;
    setPacingPendingIds((prev) => new Set([...prev, ...toFetch]));
    Promise.all(
      toFetch.map(async (id) => {
        const budget = budgets.find((candidate) => candidate.id === id);
        if (!budget) return;
        const period = resolveBudgetPeriod(budget);
        const response = await queryCostExplorerAction({
          period_start: period.start.toISOString(),
          period_end: period.end.toISOString(),
          metric: CANONICAL_METRIC,
          connection_id: connectionId,
          target_id: targetId,
          granularity: "daily",
          group_by: [],
          scope: budget.scope,
        });
        if (cancelled) return;
        const items = response.data?.items ?? [];
        pacingCacheRef.current.set(id, items);
        setPacingByBudgetId((prev) => ({ ...prev, [id]: items }));
      }),
    ).finally(() => {
      if (cancelled) return;
      setPacingPendingIds((prev) => {
        const next = new Set(prev);
        for (const id of toFetch) next.delete(id);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [activeBudgetIdsKey, budgets, connectionId, targetId]);

  const trendByCurrency = new Map<string, CoreCostExplorerPoint[]>();
  for (const point of trendPoints) {
    const list = trendByCurrency.get(point.currency) ?? [];
    list.push(point);
    trendByCurrency.set(point.currency, list);
  }
  for (const list of trendByCurrency.values()) {
    list.sort((a, b) => a.bucket_start.localeCompare(b.bucket_start));
  }

  const previousTotalByCurrency = new Map<string, number>();
  for (const point of previousTrendPoints) {
    previousTotalByCurrency.set(
      point.currency,
      (previousTotalByCurrency.get(point.currency) ?? 0) + Number(point.amount),
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              Spend overview
            </h2>
            {overview ? <SourceBadge source={overview.source} /> : null}
          </div>
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
          {OVERVIEW_PERIOD_PRESETS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={pending}
              onClick={() => {
                setPreset(option.id);
                runQuery(overviewPresetRange(option.id));
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
        {preset === "custom" ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">
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
          <p className="text-muted-foreground mb-3 text-xs">
            Current period spend and the dimension breakdown use FOCUS only.{" "}
            {focusCoverageLabel ? (
              <span className="text-foreground font-medium">
                {focusCoverageLabel}.
              </span>
            ) : resultMatchesDisplayedRange ? (
              <span className="text-foreground font-medium">
                Complete FOCUS coverage is unavailable for this period.
              </span>
            ) : (
              <span className="text-foreground font-medium">
                Resolving coverage…
              </span>
            )}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overview.by_currency.map((currency, index) => {
              const currentTotal = sumAmounts(
                trendByCurrency.get(currency.currency) ?? [],
              );
              const previousTotal =
                previousTotalByCurrency.get(currency.currency) ?? 0;
              const absoluteDelta = currentTotal - previousTotal;
              const change =
                previousTotal !== 0
                  ? (absoluteDelta / Math.abs(previousTotal)) * 100
                  : null;
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
                    label={`${currency.currency} · Current period`}
                    tone={
                      hasCompleteFocusCoverage &&
                      trendAvailable &&
                      change !== null &&
                      change < 0
                        ? "success"
                        : "default"
                    }
                    value={
                      !resultMatchesDisplayedRange ? (
                        <span className="text-base tracking-normal">
                          Loading…
                        </span>
                      ) : !hasCompleteFocusCoverage ? (
                        <>
                          <span className="block text-base tracking-normal">
                            Unavailable
                          </span>
                          <span className="text-muted-foreground mt-1 block text-xs font-normal tracking-normal">
                            FOCUS coverage is incomplete
                          </span>
                        </>
                      ) : !trendAvailable ? (
                        <>
                          <span className="block text-base tracking-normal">
                            Unavailable
                          </span>
                          <span className="text-muted-foreground mt-1 block text-xs font-normal tracking-normal">
                            FOCUS query failed
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="block">
                            {formatAmount(currentTotal, currency.currency)}
                          </span>
                          <span className="mt-1 flex items-center gap-1 text-xs font-normal tracking-normal">
                            <ChangeIcon size={12} />
                            {!previousTrendAvailable
                              ? "Previous period unavailable"
                              : change === null
                                ? "No previous spend"
                                : `${formatAmount(Math.abs(absoluteDelta), currency.currency)} (${Math.abs(change).toFixed(1)}%) vs previous period`}
                          </span>
                        </>
                      )
                    }
                  />
                </div>
              );
            })}
          </div>

          {[...budgetsByCurrency.entries()].map(
            ([currency, currencyBudgets]) => {
              const activeBudgetId =
                activeBudgetByCurrency[currency] ?? currencyBudgets[0]!.id;
              const activeBudget =
                currencyBudgets.find(
                  (budget) => budget.id === activeBudgetId,
                ) ?? currencyBudgets[0]!;
              const budgetAmount = Number(activeBudget.amount);
              const period = resolveBudgetPeriod(activeBudget);
              const points = pacingByBudgetId[activeBudget.id] ?? [];
              const pending = pacingPendingIds.has(activeBudget.id);
              const series = buildPacingSeries(points, period);
              const {
                actualMarkers,
                actualPolyline,
                forecastPolyline,
                budgetLineY,
              } = buildPacingChart(series, budgetAmount, period);
              const overBudget =
                series.projectedTotal !== null &&
                series.projectedTotal > budgetAmount;
              const lastActual = series.actual[series.actual.length - 1];
              return (
                <div
                  key={`${result.rangeKey}-pacing-${currency}`}
                  className="border-border-soft bg-dashboard-panel mt-4 rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">
                      Budget pacing · {currency}
                    </h3>
                    {currencyBudgets.length > 1 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currencyBudgets.map((budget) => (
                          <button
                            key={budget.id}
                            type="button"
                            onClick={() =>
                              setActiveBudgetByCurrency((prev) => ({
                                ...prev,
                                [currency]: budget.id,
                              }))
                            }
                            className={
                              budget.id === activeBudgetId
                                ? "border-accent/30 bg-accent/10 text-accent rounded-full border px-3 py-1.5 text-xs font-medium"
                                : "border-foreground/10 text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-xs font-medium"
                            }
                          >
                            {budget.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {series.projectedTotal !== null ? (
                    <p
                      className={`mt-1 text-xs ${overBudget ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}
                    >
                      {formatAmount(series.projectedTotal, currency)} projected
                      by {formatDayLabel(period.end.toISOString())} vs.{" "}
                      {formatAmount(budgetAmount, currency)} budget
                    </p>
                  ) : lastActual ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatAmount(lastActual.cumulative, currency)} spent of{" "}
                      {formatAmount(budgetAmount, currency)} budget for this
                      period.
                    </p>
                  ) : null}
                  {points.length === 0 ? (
                    <p className="text-muted-foreground mt-3 text-sm">
                      {pending
                        ? "Loading…"
                        : "No spend recorded yet for this budget's scope."}
                    </p>
                  ) : (
                    <>
                      <svg
                        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                        preserveAspectRatio="none"
                        className="mt-3 h-32 w-full overflow-visible"
                        aria-label={`${currency} budget pacing for ${activeBudget.name}`}
                        role="img"
                      >
                        <line
                          x1="0"
                          x2={CHART_WIDTH}
                          y1={budgetLineY}
                          y2={budgetLineY}
                          stroke="var(--accent-secondary)"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                        <polyline
                          points={actualPolyline}
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {forecastPolyline ? (
                          <polyline
                            points={forecastPolyline}
                            fill="none"
                            stroke={overBudget ? "#f59e0b" : "var(--accent)"}
                            strokeWidth="2"
                            strokeDasharray="5 4"
                            strokeLinecap="round"
                          />
                        ) : null}
                        {actualMarkers.map(({ x, y, point }) => (
                          <circle
                            key={point.date}
                            cx={x}
                            cy={y}
                            r={3}
                            fill="var(--accent)"
                            stroke="var(--dashboard-panel)"
                            strokeWidth="1.5"
                          >
                            <title>
                              {formatDayLabel(point.date)}:{" "}
                              {formatAmount(point.cumulative, currency)}
                            </title>
                          </circle>
                        ))}
                      </svg>
                      <p className="text-muted-foreground mt-2 text-[11px]">
                        {formatDayLabel(period.start.toISOString())}–
                        {formatDayLabel(period.end.toISOString())} · dashed line
                        is the {formatAmount(budgetAmount, currency)} budget
                        target
                        {forecastPolyline
                          ? "; the lighter dashed tail is an estimate — a trailing 7-day daily average projected across the rest of the period, not a statistical forecast"
                          : ""}
                        .
                      </p>
                    </>
                  )}
                </div>
              );
            },
          )}

          <div className="border-border-soft bg-dashboard-panel mt-4 rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">
                  Breakdown by dimension
                </h3>
                <p className="text-muted-foreground mt-1 text-xs">
                  {focusCoverageLabel
                    ? `${focusCoverageLabel}.`
                    : resultMatchesDisplayedRange
                      ? "Complete FOCUS coverage is unavailable for this period."
                      : "Resolving FOCUS coverage…"}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BREAKDOWN_DIMENSIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={!hasCompleteFocusCoverage || dimensionPending}
                    onClick={() => setDimension(option)}
                    className={
                      option === dimension
                        ? "border-accent/30 bg-accent/10 text-accent rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                        : "border-foreground/10 text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    }
                  >
                    {SCOPE_DIMENSION_LABELS[option]}
                  </button>
                ))}
              </div>
            </div>
            {!resultMatchesDisplayedRange ? (
              <p className="text-muted-foreground mt-3 text-sm">Loading…</p>
            ) : !hasCompleteFocusCoverage ? (
              <p className="text-muted-foreground mt-3 text-sm">
                This FOCUS-only breakdown is unavailable until the selected
                period has complete coverage.
              </p>
            ) : dimensionPending ? (
              <p className="text-muted-foreground mt-3 text-sm">Loading…</p>
            ) : dimensionError ? (
              <p className="text-muted-foreground mt-3 text-sm">
                The FOCUS breakdown could not be loaded. Try again.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {overview.by_currency.map((currency) => {
                  const points =
                    dimensionByCurrency.get(currency.currency) ?? [];
                  const grouped = new Map<string, number>();
                  for (const point of points) {
                    const label = point.group[dimension] ?? "Unassigned";
                    grouped.set(
                      label,
                      (grouped.get(label) ?? 0) + Number(point.amount),
                    );
                  }
                  const sorted = [...grouped.entries()].sort(
                    (a, b) => Math.abs(b[1]) - Math.abs(a[1]),
                  );
                  const top = sorted.slice(0, 6);
                  const otherAmount = sorted
                    .slice(6)
                    .reduce((sum, [, amount]) => sum + amount, 0);
                  const maxAmount = Math.max(
                    ...top.map(([, amount]) => Math.abs(amount)),
                    Math.abs(otherAmount),
                    1,
                  );
                  return (
                    <div key={currency.currency}>
                      <h4 className="text-muted-foreground text-xs font-semibold">
                        {currency.currency}
                      </h4>
                      {top.length === 0 ? (
                        <p className="text-muted-foreground mt-2 text-sm">
                          No breakdown is available.
                        </p>
                      ) : (
                        <div className="mt-2 space-y-3">
                          {top.map(([label, amount], index) => (
                            <div
                              key={label}
                              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
                            >
                              <span className="truncate text-xs font-medium">
                                {label}
                              </span>
                              <span className="font-mono text-xs">
                                {formatAmount(amount, currency.currency)}
                              </span>
                              <span className="bg-foreground/5 col-span-2 h-1.5 overflow-hidden rounded-full">
                                <span
                                  className="bg-accent block h-full origin-left animate-[demo-bar_.5s_ease-out_both] rounded-full motion-reduce:animate-none"
                                  style={{
                                    width: `${(Math.abs(amount) / maxAmount) * 100}%`,
                                    opacity: 1 - index * 0.12,
                                    animationDelay: `${index * 60}ms`,
                                  }}
                                />
                              </span>
                            </div>
                          ))}
                          {otherAmount !== 0 ? (
                            <div className="border-foreground/10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t pt-3">
                              <span className="text-muted-foreground truncate text-xs font-medium">
                                Other
                              </span>
                              <span className="text-muted-foreground font-mono text-xs">
                                {formatAmount(otherAmount, currency.currency)}
                              </span>
                              <span className="bg-foreground/5 col-span-2 h-1.5 overflow-hidden rounded-full">
                                <span
                                  className="bg-foreground/30 block h-full origin-left animate-[demo-bar_.5s_ease-out_both] rounded-full motion-reduce:animate-none"
                                  style={{
                                    width: `${(Math.abs(otherAmount) / maxAmount) * 100}%`,
                                  }}
                                />
                              </span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-border-soft bg-dashboard-panel mt-4 rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
            <div>
              <h3 className="text-sm font-semibold">
                Cost Drivers — why did spend change?
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                Service-level totals for{" "}
                {focusCoverageLabel
                  ? "this FOCUS range"
                  : "the selected period"}{" "}
                vs. the immediately preceding period of equal length,
                full-outer-aligned so a service present in only one period still
                appears.
              </p>
            </div>
            {!resultMatchesDisplayedRange ? (
              <p className="text-muted-foreground mt-3 text-sm">Loading…</p>
            ) : !hasCompleteFocusCoverage ? (
              <p className="text-muted-foreground mt-3 text-sm">
                Cost Drivers are unavailable until the selected period has
                complete FOCUS coverage.
              </p>
            ) : driversPending ? (
              <p className="text-muted-foreground mt-3 text-sm">Loading…</p>
            ) : driversError ? (
              <p className="text-muted-foreground mt-3 text-sm">
                Cost Drivers could not be loaded. Try again.
              </p>
            ) : driverCurrencies.length === 0 ? (
              <p className="text-muted-foreground mt-3 text-sm">
                No service moved enough to rank for this period.
              </p>
            ) : (
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                {driverCurrencies.map((currency) => {
                  const increases = increasesByCurrency.get(currency) ?? [];
                  const decreases = decreasesByCurrency.get(currency) ?? [];
                  return (
                    <Fragment key={currency}>
                      <div>
                        <h4 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                          <TrendingUp size={13} className="text-red-500" />
                          Top increases · {currency}
                        </h4>
                        {increases.length === 0 ? (
                          <p className="text-muted-foreground mt-2 text-sm">
                            Nothing grew this period.
                          </p>
                        ) : (
                          <div className="mt-2 space-y-2.5">
                            {increases.map((driver, index) => (
                              <div
                                key={`${driver.value ?? "unassigned"}-${index}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5"
                              >
                                <span className="truncate text-xs font-medium">
                                  {driver.value ?? "Unassigned service"}
                                </span>
                                <span className="font-mono text-xs text-red-500">
                                  +
                                  {formatAmount(
                                    Number(driver.absolute_delta),
                                    currency,
                                  )}
                                </span>
                                <span className="text-muted-foreground col-span-2 text-[11px]">
                                  {formatAmount(
                                    Number(driver.previous_amount),
                                    currency,
                                  )}{" "}
                                  →{" "}
                                  {formatAmount(
                                    Number(driver.current_amount),
                                    currency,
                                  )}
                                  {driver.percentage_change !== null
                                    ? ` (+${driver.percentage_change.toFixed(1)}%)`
                                    : " (new)"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                          <TrendingDown
                            size={13}
                            className="text-emerald-500"
                          />
                          Top decreases · {currency}
                        </h4>
                        {decreases.length === 0 ? (
                          <p className="text-muted-foreground mt-2 text-sm">
                            Nothing shrank this period.
                          </p>
                        ) : (
                          <div className="mt-2 space-y-2.5">
                            {decreases.map((driver, index) => (
                              <div
                                key={`${driver.value ?? "unassigned"}-${index}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5"
                              >
                                <span className="truncate text-xs font-medium">
                                  {driver.value ?? "Unassigned service"}
                                </span>
                                <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                                  {formatAmount(
                                    Number(driver.absolute_delta),
                                    currency,
                                  )}
                                </span>
                                <span className="text-muted-foreground col-span-2 text-[11px]">
                                  {formatAmount(
                                    Number(driver.previous_amount),
                                    currency,
                                  )}{" "}
                                  →{" "}
                                  {formatAmount(
                                    Number(driver.current_amount),
                                    currency,
                                  )}
                                  {driver.percentage_change !== null
                                    ? ` (${driver.percentage_change.toFixed(1)}%)`
                                    : " (dropped)"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-border-soft bg-dashboard-panel mt-4 rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">
                Forecast — where is spend headed?
              </h3>
              {forecast ? <SourceBadge source={forecast.source} /> : null}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              A deterministic period-to-date daily-rate projection to the end of
              the selected period — not a statistical or ML forecast.
            </p>
            {!resultMatchesDisplayedRange || forecastPending ? (
              <p className="text-muted-foreground mt-3 text-sm">Loading…</p>
            ) : forecastNotInProgress ? (
              <p className="text-muted-foreground mt-3 text-sm">
                Forecast only applies to a period that is still in progress —
                pick a range that includes today.
              </p>
            ) : forecastError ? (
              <p className="text-muted-foreground mt-3 text-sm">
                Forecast could not be loaded. Try again.
              </p>
            ) : !forecast ||
              forecast.insufficient_data ||
              forecast.by_currency.length === 0 ? (
              <p className="text-muted-foreground mt-3 text-sm">
                Not enough complete days yet in this period to project a
                forecast.
              </p>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {forecast.by_currency.map((currency) => (
                    <StatCard
                      key={currency.currency}
                      label={`${currency.currency} · Projected total`}
                      value={
                        <>
                          <span className="block">
                            {formatAmount(
                              Number(currency.forecast_amount),
                              currency.currency,
                            )}
                          </span>
                          <span className="text-muted-foreground mt-1 block text-xs font-normal tracking-normal">
                            {formatAmount(
                              Number(currency.observed_amount),
                              currency.currency,
                            )}{" "}
                            so far
                            {currency.daily_rate !== null
                              ? ` · ${formatAmount(Number(currency.daily_rate), currency.currency)}/day`
                              : ""}
                          </span>
                        </>
                      }
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mt-3 text-[11px]">
                  Based on {forecast.complete_days} complete day
                  {forecast.complete_days === 1 ? "" : "s"} (through{" "}
                  {formatDayLabel(forecast.data_through)}), extrapolated across
                  the remaining {forecast.remaining_days} day
                  {forecast.remaining_days === 1 ? "" : "s"} of the period.
                </p>
              </>
            )}
          </div>

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
                    {currency.financial_breakdown === null ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Detailed breakdown unavailable — showing Cost Explorer
                        totals. Connect FOCUS billing export for a full
                        gross/tax/credits/net reconciliation.
                      </p>
                    ) : (
                      <>
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
                          <span className="text-sm font-semibold">
                            Net cost
                          </span>
                          <span className="font-mono text-sm font-semibold">
                            {formatAmount(
                              Number(currency.financial_breakdown.net_cost),
                              currency.currency,
                            )}
                          </span>
                        </div>
                        {currency.financial_breakdown.discount_amount !==
                        null ? (
                          <p className="text-muted-foreground mt-2 text-xs">
                            Discount vs. list price:{" "}
                            {formatAmount(
                              Number(
                                currency.financial_breakdown.discount_amount,
                              ),
                              currency.currency,
                            )}
                          </p>
                        ) : null}
                      </>
                    )}
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
