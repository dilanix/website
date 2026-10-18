"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { Route } from "next";
import Link from "next/link";
import { Bookmark, Play, Search } from "lucide-react";
import {
  queryCostExplorerAction,
  runCostExplorerSavedViewAction,
} from "@/app/dashboard/products/cost-actions";
import type {
  CoreCostExplorerPoint,
  CoreSavedView,
  CoreScopeCondition,
  CostExplorerGroupByField,
  CostUsageMetric,
  ExplorerGranularity,
  ScopeDimension,
} from "@/lib/core/api";
import { EmptyState } from "@/components/dashboard/primitives";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  SCOPE_DIMENSION_LABELS,
  ScopeEditor,
} from "@/components/dashboard/cost/scope-editor";
import { useDashboardFilterState } from "@/lib/dashboard/filter-storage";
import { formatAmount } from "@/components/dashboard/cost/format";

const METRIC_LABELS: Record<CostUsageMetric, string> = {
  billed_cost: "Billed cost",
  effective_cost: "Effective cost",
  list_cost: "List cost",
  contracted_cost: "Contracted cost",
};

const GRANULARITY_LABELS: Record<ExplorerGranularity, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

type GroupByDimension = Exclude<ScopeDimension, "tag">;

const GROUP_BY_DIMENSIONS = (
  Object.keys(SCOPE_DIMENSION_LABELS) as ScopeDimension[]
).filter((dimension): dimension is GroupByDimension => dimension !== "tag");

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isCostUsageMetric(value: unknown): value is CostUsageMetric {
  return typeof value === "string" && value in METRIC_LABELS;
}

function isExplorerGranularity(value: unknown): value is ExplorerGranularity {
  return typeof value === "string" && value in GRANULARITY_LABELS;
}

function isGroupBy(value: unknown): value is CostExplorerGroupByField[] {
  return (
    Array.isArray(value) &&
    value.every(
      (field) =>
        field &&
        typeof field === "object" &&
        "dimension" in field &&
        typeof field.dimension === "string" &&
        field.dimension in SCOPE_DIMENSION_LABELS &&
        (!("tag_key" in field) ||
          field.tag_key === null ||
          typeof field.tag_key === "string"),
    )
  );
}

type ExplorerViewMode = "summary" | "detailed";

function isExplorerViewMode(value: unknown): value is ExplorerViewMode {
  return value === "summary" || value === "detailed";
}

function isScope(value: unknown): value is CoreScopeCondition[] {
  return (
    Array.isArray(value) &&
    value.every(
      (condition) =>
        condition &&
        typeof condition === "object" &&
        "dimension" in condition &&
        typeof condition.dimension === "string" &&
        condition.dimension in SCOPE_DIMENSION_LABELS &&
        "operator" in condition &&
        ["eq", "in", "not_in"].includes(String(condition.operator)) &&
        "value" in condition &&
        (typeof condition.value === "string" ||
          (Array.isArray(condition.value) &&
            condition.value.every(
              (item: unknown) => typeof item === "string",
            ))),
    )
  );
}

function startIso(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

function inclusiveEndIso(date: string) {
  const end = new Date(`${date}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return end.toISOString();
}

function formatBucket(point: CoreCostExplorerPoint, hasGranularity: boolean) {
  if (!hasGranularity) return "Selected period";
  const start = new Date(point.bucket_start);
  const end = new Date(point.bucket_end);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year:
      start.getUTCFullYear() === end.getUTCFullYear() ? undefined : "numeric",
    timeZone: "UTC",
  });
  const inclusiveEnd = new Date(end);
  inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() - 1);
  const startLabel = formatter.format(start);
  const endLabel = formatter.format(inclusiveEnd);
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

function groupLabel(point: CoreCostExplorerPoint) {
  const entries = Object.entries(point.group);
  if (entries.length === 0) return "All spend";
  return entries
    .map(([dimension, value]) => {
      const label = dimension.startsWith("tag:")
        ? dimension
        : (SCOPE_DIMENSION_LABELS[dimension as ScopeDimension] ?? dimension);
      return `${label}: ${value ?? "Unassigned"}`;
    })
    .join(" · ");
}

export function CostExplorerClient({
  initialItems,
  initialPeriodStart,
  initialPeriodEnd,
  savedViews,
  connectionId,
  targetId,
}: {
  initialItems: CoreCostExplorerPoint[];
  initialPeriodStart: string;
  initialPeriodEnd: string;
  savedViews: CoreSavedView[];
  connectionId: string | null;
  targetId: string | null;
}) {
  const dataScopeKey = `${connectionId ?? "all"}:${targetId ?? "all"}`;
  const [result, setResult] = useState<{
    dataScopeKey: string;
    items: CoreCostExplorerPoint[];
    metric: CostUsageMetric;
    chargeCategoryTotals: CoreCostExplorerPoint[];
  }>(() => ({
    dataScopeKey,
    items: initialItems,
    metric: "effective_cost",
    chargeCategoryTotals: [],
  }));
  const items =
    result.dataScopeKey === dataScopeKey ? result.items : initialItems;
  const resultMetric =
    result.dataScopeKey === dataScopeKey ? result.metric : "effective_cost";
  const chargeCategoryTotals =
    result.dataScopeKey === dataScopeKey ? result.chargeCategoryTotals : [];
  const [viewMode, setViewMode] = useDashboardFilterState<ExplorerViewMode>(
    "cost.explorer.view-mode",
    "summary",
    isExplorerViewMode,
  );
  const [visibleCount, setVisibleCount] = useState(250);
  const [periodStart, setPeriodStart, { restored: periodStartRestored }] =
    useDashboardFilterState(
      "cost.explorer.period-start",
      initialPeriodStart,
      isString,
    );
  const [periodEnd, setPeriodEnd, { restored: periodEndRestored }] =
    useDashboardFilterState(
      "cost.explorer.period-end",
      initialPeriodEnd,
      isString,
    );
  const [metric, setMetric, { restored: metricRestored }] =
    useDashboardFilterState<CostUsageMetric>(
      "cost.explorer.metric",
      "effective_cost",
      isCostUsageMetric,
    );
  const [granularity, setGranularity, { restored: granularityRestored }] =
    useDashboardFilterState<ExplorerGranularity>(
      "cost.explorer.granularity",
      "daily",
      isExplorerGranularity,
    );
  const [groupBy, setGroupBy, { restored: groupByRestored }] =
    useDashboardFilterState<CostExplorerGroupByField[]>(
      "cost.explorer.group-by",
      [{ dimension: "service_name" }],
      isGroupBy,
    );
  const [tagGroupKey, setTagGroupKey] = useDashboardFilterState(
    "cost.explorer.tag-key",
    "",
    isString,
  );
  const [scope, setScope, { restored: scopeRestored }] =
    useDashboardFilterState<CoreScopeCondition[]>(
      "cost.explorer.scope",
      [],
      isScope,
    );
  const [scopeEditorKey, setScopeEditorKey] = useState(0);
  const [selectedSavedViewId, setSelectedSavedViewId] = useDashboardFilterState(
    "cost.explorer.saved-view",
    "",
    isString,
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const restoredQueryApplied = useRef(false);
  const resultScopeLabel = targetId
    ? `Target ${targetId.slice(0, 8)}…`
    : connectionId
      ? `Connection ${connectionId.slice(0, 8)}…`
      : "All accessible connections";
  const scopeQuery = new URLSearchParams();
  if (connectionId) scopeQuery.set("connection", connectionId);
  if (targetId) scopeQuery.set("target", targetId);
  const scopeSuffix = scopeQuery.size ? `?${scopeQuery.toString()}` : "";

  const totals = useMemo(() => {
    const result = new Map<string, number>();
    for (const point of items) {
      result.set(
        point.currency,
        (result.get(point.currency) ?? 0) + Number(point.amount),
      );
    }
    return [...result.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [items]);

  const maxAmount = useMemo(
    () => Math.max(...items.map((item) => Math.abs(Number(item.amount))), 0),
    [items],
  );

  // One column per group dimension actually present on the result rows —
  // read from the rows themselves (not the current `groupBy` selection) so a
  // saved view's own grouping renders correctly too.
  const groupColumns = useMemo(() => {
    const keys = new Set<string>();
    for (const item of items) {
      for (const key of Object.keys(item.group)) keys.add(key);
    }
    return [...keys].map((key) => ({
      key,
      label: key.startsWith("tag:")
        ? key
        : (SCOPE_DIMENSION_LABELS[key as ScopeDimension] ?? key),
    }));
  }, [items]);

  function toggleGroupBy(dimension: GroupByDimension) {
    setGroupBy((current) =>
      current.some((field) => field.dimension === dimension)
        ? current.filter((field) => field.dimension !== dimension)
        : [...current, { dimension }],
    );
  }

  function toggleTagGrouping() {
    const key = tagGroupKey.trim();
    if (!key) return;
    setGroupBy((current) => {
      const withoutTags = current.filter((field) => field.dimension !== "tag");
      return current.some(
        (field) => field.dimension === "tag" && field.tag_key === key,
      )
        ? withoutTags
        : [...withoutTags, { dimension: "tag", tag_key: key }];
    });
  }

  function runQuery() {
    setError("");
    if (!periodStart || !periodEnd || periodEnd < periodStart) {
      setError("Choose a valid start and end date.");
      return;
    }
    startTransition(async () => {
      const [queryResult, chargeCategoryResult] = await Promise.all([
        queryCostExplorerAction({
          period_start: startIso(periodStart),
          period_end: inclusiveEndIso(periodEnd),
          metric,
          connection_id: connectionId,
          target_id: targetId,
          granularity,
          group_by: groupBy,
          scope,
        }),
        // Always by charge_category alone, regardless of the chosen group_by
        // above — a standing "why is this near zero" answer for the current
        // period/scope, same idea as Overview's own by_charge_category.
        queryCostExplorerAction({
          period_start: startIso(periodStart),
          period_end: inclusiveEndIso(periodEnd),
          metric,
          connection_id: connectionId,
          target_id: targetId,
          granularity: null,
          group_by: [{ dimension: "charge_category" }],
          scope,
        }),
      ]);
      if (queryResult.error) return setError(queryResult.error);
      setVisibleCount(250);
      setResult({
        dataScopeKey,
        items: queryResult.data?.items ?? [],
        metric,
        chargeCategoryTotals: chargeCategoryResult.data?.items ?? [],
      });
      setSelectedSavedViewId("");
    });
  }
  const restoreQuery = useEffectEvent(() => {
    runQuery();
  });

  function runSavedView() {
    const view = savedViews.find((item) => item.id === selectedSavedViewId);
    if (!view) return;
    setError("");
    if (!periodStart || !periodEnd || periodEnd < periodStart) {
      setError("Choose a valid start and end date.");
      return;
    }
    setMetric("effective_cost");
    setGranularity(view.granularity);
    setGroupBy(view.group_by.map((dimension) => ({ dimension })));
    setScope(view.scope);
    setScopeEditorKey((current) => current + 1);
    startTransition(async () => {
      const [savedViewResult, chargeCategoryResult] = await Promise.all([
        runCostExplorerSavedViewAction({
          savedViewId: view.id,
          periodStart: startIso(periodStart),
          periodEnd: inclusiveEndIso(periodEnd),
          connectionId,
          targetId,
        }),
        queryCostExplorerAction({
          period_start: startIso(periodStart),
          period_end: inclusiveEndIso(periodEnd),
          metric: "effective_cost",
          connection_id: connectionId,
          target_id: targetId,
          granularity: null,
          group_by: [{ dimension: "charge_category" }],
          scope: view.scope,
        }),
      ]);
      if (savedViewResult.error) return setError(savedViewResult.error);
      setVisibleCount(250);
      setResult({
        dataScopeKey,
        items: savedViewResult.data?.items ?? [],
        metric: "effective_cost",
        chargeCategoryTotals: chargeCategoryResult.data?.items ?? [],
      });
    });
  }

  useEffect(() => {
    if (
      restoredQueryApplied.current ||
      (!periodStartRestored &&
        !periodEndRestored &&
        !metricRestored &&
        !granularityRestored &&
        !groupByRestored &&
        !scopeRestored)
    ) {
      return;
    }
    restoredQueryApplied.current = true;
    const differsFromInitialQuery =
      periodStart !== initialPeriodStart ||
      periodEnd !== initialPeriodEnd ||
      metric !== "effective_cost" ||
      granularity !== "daily" ||
      JSON.stringify(groupBy) !==
        JSON.stringify([{ dimension: "service_name" }]) ||
      scope.length > 0;
    if (differsFromInitialQuery) window.setTimeout(restoreQuery, 0);
  }, [
    granularity,
    granularityRestored,
    groupBy,
    groupByRestored,
    initialPeriodEnd,
    initialPeriodStart,
    metric,
    metricRestored,
    periodEnd,
    periodEndRestored,
    periodStart,
    periodStartRestored,
    scope,
    scopeRestored,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-border-soft bg-dashboard-panel rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Start date</span>
            <input
              type="date"
              value={periodStart}
              max={periodEnd}
              onChange={(event) => setPeriodStart(event.target.value)}
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">End date</span>
            <input
              type="date"
              value={periodEnd}
              min={periodStart}
              onChange={(event) => setPeriodEnd(event.target.value)}
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Metric</span>
            <select
              value={metric}
              onChange={(event) =>
                setMetric(event.target.value as CostUsageMetric)
              }
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
            >
              {(Object.keys(METRIC_LABELS) as CostUsageMetric[]).map(
                (value) => (
                  <option key={value} value={value}>
                    {METRIC_LABELS[value]}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Granularity</span>
            <select
              value={granularity}
              onChange={(event) =>
                setGranularity(event.target.value as ExplorerGranularity)
              }
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
            >
              {(Object.keys(GRANULARITY_LABELS) as ExplorerGranularity[]).map(
                (value) => (
                  <option key={value} value={value}>
                    {GRANULARITY_LABELS[value]}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        <div className="mt-5">
          <span className="mb-2 block text-sm font-medium">Group by</span>
          <div className="flex flex-wrap gap-1.5">
            {GROUP_BY_DIMENSIONS.map((dimension) => {
              const active = groupBy.some(
                (field) => field.dimension === dimension,
              );
              return (
                <button
                  key={dimension}
                  type="button"
                  onClick={() => toggleGroupBy(dimension)}
                  className={
                    active
                      ? "border-accent/30 bg-accent/10 text-accent rounded-full border px-2.5 py-1 text-[11px] font-medium"
                      : "border-foreground/10 text-muted-foreground hover:text-foreground rounded-full border px-2.5 py-1 text-[11px] font-medium"
                  }
                >
                  {SCOPE_DIMENSION_LABELS[dimension]}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex max-w-sm gap-2">
            <input
              value={tagGroupKey}
              onChange={(event) => setTagGroupKey(event.target.value)}
              placeholder="Tag key, e.g. team"
              className="border-foreground/15 bg-background focus:border-accent h-9 min-w-0 flex-1 rounded-lg border px-3 text-xs outline-none"
            />
            <button
              type="button"
              onClick={toggleTagGrouping}
              disabled={!tagGroupKey.trim()}
              className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-3 text-xs font-medium disabled:opacity-40"
            >
              Group by tag
            </button>
          </div>
          {groupBy.find((field) => field.dimension === "tag") ? (
            <p className="text-accent mt-2 text-xs">
              Grouping by tag:
              {groupBy.find((field) => field.dimension === "tag")?.tag_key}
            </p>
          ) : null}
        </div>

        <div className="mt-5">
          <span className="mb-2 block text-sm font-medium">Filters</span>
          <ScopeEditor
            key={`${scopeEditorKey}:${scopeRestored ? "restored" : "default"}`}
            initialValue={scope}
            onChange={setScope}
            disabled={pending}
          />
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-500">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
            <label className="min-w-52 flex-1 text-sm">
              <span className="mb-1.5 block font-medium">Saved view</span>
              <select
                value={selectedSavedViewId}
                onChange={(event) => setSelectedSavedViewId(event.target.value)}
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
              >
                <option value="">Select a saved view</option>
                {savedViews.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={runSavedView}
              disabled={pending || !selectedSavedViewId}
              className="border-foreground/15 hover:bg-foreground/5 inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium disabled:opacity-40"
            >
              <Play size={13} /> Run view
            </button>
            <Link
              href={
                `/dashboard/products/cost/saved-views${scopeSuffix}` as Route
              }
              className="text-muted-foreground hover:text-foreground inline-flex h-10 items-center gap-1.5 px-2 text-xs font-medium"
            >
              <Bookmark size={13} /> Manage views
            </Link>
          </div>
          <button
            type="button"
            onClick={runQuery}
            disabled={pending}
            className="bg-accent text-accent-foreground inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium disabled:opacity-50"
          >
            <Search size={14} /> {pending ? "Running…" : "Run query"}
          </button>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Results scope:{" "}
        <span className="text-foreground">{resultScopeLabel}</span>
      </p>

      {items.length === 0 ? (
        <EmptyState
          title="No cost data for this query"
          description="Try a wider period, another data scope, or remove some filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {totals.map(([currency, amount]) => (
              <StatCard
                key={currency}
                label={`${METRIC_LABELS[resultMetric]} · ${currency}`}
                value={formatAmount(amount, currency)}
              />
            ))}
            <StatCard label="Result rows" value={items.length} />
          </div>

          {chargeCategoryTotals.length > 0 ? (
            <div className="border-border-soft bg-dashboard-panel rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
              <h3 className="text-sm font-semibold">By charge type</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                Usage minus credits/discounts nets to the totals above — a
                near-zero total usually means a provider credit is offsetting
                usage, not that nothing was spent.
              </p>
              <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {chargeCategoryTotals.map((point) => (
                  <div
                    key={`${point.currency}-${point.group.charge_category}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {point.group.charge_category ?? "Uncategorized"}
                    </span>
                    <span
                      className={`font-mono text-xs ${Number(point.amount) < 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                    >
                      {formatAmount(Number(point.amount), point.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode("summary")}
              className={
                viewMode === "summary"
                  ? "border-accent/30 bg-accent/10 text-accent rounded-full border px-3 py-1.5 text-xs font-medium"
                  : "border-foreground/10 text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-xs font-medium"
              }
            >
              Summary
            </button>
            <button
              type="button"
              onClick={() => setViewMode("detailed")}
              className={
                viewMode === "detailed"
                  ? "border-accent/30 bg-accent/10 text-accent rounded-full border px-3 py-1.5 text-xs font-medium"
                  : "border-foreground/10 text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-xs font-medium"
              }
            >
              Detailed
            </button>
          </div>

          {viewMode === "summary" ? (
            <div className="border-border-soft bg-dashboard-panel overflow-x-auto rounded-2xl border shadow-[0_16px_44px_var(--shadow-card)]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-foreground/10 border-b">
                    <th className="text-muted-foreground px-4 py-3 font-medium">
                      Period
                    </th>
                    <th className="text-muted-foreground px-4 py-3 font-medium">
                      Group
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-right font-medium">
                      Amount
                    </th>
                    <th className="text-muted-foreground w-40 px-4 py-3 font-medium">
                      Relative cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, visibleCount).map((point, index) => {
                    const amount = Number(point.amount);
                    return (
                      <tr
                        key={`${point.bucket_start}-${point.currency}-${groupLabel(point)}-${index}`}
                        className="border-foreground/5 border-b last:border-0"
                      >
                        <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                          {formatBucket(point, Boolean(granularity))}
                        </td>
                        <td className="text-foreground px-4 py-3">
                          {groupLabel(point)}
                        </td>
                        <td className="text-foreground px-4 py-3 text-right font-mono whitespace-nowrap">
                          {formatAmount(amount, point.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-foreground/5 block h-1.5 overflow-hidden rounded-full">
                            <span
                              className="bg-accent block h-full rounded-full"
                              style={{
                                width: `${maxAmount ? (Math.abs(amount) / maxAmount) * 100 : 0}%`,
                              }}
                            />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-border-soft bg-dashboard-panel overflow-x-auto rounded-2xl border shadow-[0_16px_44px_var(--shadow-card)]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-foreground/10 border-b">
                    <th className="text-muted-foreground px-4 py-3 font-medium">
                      Period
                    </th>
                    {groupColumns.map((column) => (
                      <th
                        key={column.key}
                        className="text-muted-foreground px-4 py-3 font-medium"
                      >
                        {column.label}
                      </th>
                    ))}
                    <th className="text-muted-foreground px-4 py-3 font-medium">
                      Currency
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-right font-medium">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, visibleCount).map((point, index) => (
                    <tr
                      key={`${point.bucket_start}-${point.currency}-${groupLabel(point)}-${index}`}
                      className="border-foreground/5 border-b last:border-0"
                    >
                      <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                        {formatBucket(point, Boolean(granularity))}
                      </td>
                      {groupColumns.map((column) => (
                        <td
                          key={column.key}
                          className="text-foreground px-4 py-3"
                        >
                          {point.group[column.key] ?? "Unassigned"}
                        </td>
                      ))}
                      <td className="text-muted-foreground px-4 py-3">
                        {point.currency}
                      </td>
                      <td className="text-foreground px-4 py-3 text-right font-mono whitespace-nowrap">
                        {formatAmount(Number(point.amount), point.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {items.length > visibleCount ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((current) => current + 250)}
                className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-4 py-2 text-xs font-medium"
              >
                Load more ({items.length - visibleCount} remaining)
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
