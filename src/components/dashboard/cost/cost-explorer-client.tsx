"use client";

import { useMemo, useState, useTransition } from "react";
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

function startIso(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

function inclusiveEndIso(date: string) {
  const end = new Date(`${date}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return end.toISOString();
}

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
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
  }>(() => ({
    dataScopeKey,
    items: initialItems,
    metric: "effective_cost",
  }));
  const items =
    result.dataScopeKey === dataScopeKey ? result.items : initialItems;
  const resultMetric =
    result.dataScopeKey === dataScopeKey ? result.metric : "effective_cost";
  const [periodStart, setPeriodStart] = useState(initialPeriodStart);
  const [periodEnd, setPeriodEnd] = useState(initialPeriodEnd);
  const [metric, setMetric] = useState<CostUsageMetric>("effective_cost");
  const [granularity, setGranularity] = useState<ExplorerGranularity>("daily");
  const [groupBy, setGroupBy] = useState<CostExplorerGroupByField[]>([
    { dimension: "service_name" },
  ]);
  const [tagGroupKey, setTagGroupKey] = useState("");
  const [scope, setScope] = useState<CoreScopeCondition[]>([]);
  const [scopeEditorKey, setScopeEditorKey] = useState(0);
  const [selectedSavedViewId, setSelectedSavedViewId] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
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
      const result = await queryCostExplorerAction({
        period_start: startIso(periodStart),
        period_end: inclusiveEndIso(periodEnd),
        metric,
        connection_id: connectionId,
        target_id: targetId,
        granularity,
        group_by: groupBy,
        scope,
      });
      if (result.error) return setError(result.error);
      setResult({
        dataScopeKey,
        items: result.data?.items ?? [],
        metric,
      });
      setSelectedSavedViewId("");
    });
  }

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
      const result = await runCostExplorerSavedViewAction({
        savedViewId: view.id,
        periodStart: startIso(periodStart),
        periodEnd: inclusiveEndIso(periodEnd),
        connectionId,
        targetId,
      });
      if (result.error) return setError(result.error);
      setResult({
        dataScopeKey,
        items: result.data?.items ?? [],
        metric: "effective_cost",
      });
    });
  }

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
            key={scopeEditorKey}
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
                {items.slice(0, 250).map((point, index) => {
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
            {items.length > 250 ? (
              <p className="text-muted-foreground border-foreground/10 border-t px-4 py-3 text-xs">
                Showing the first 250 of {items.length} result rows. Narrow the
                period or increase granularity to reduce the result.
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
