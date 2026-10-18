"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { queryCostBreakdownAction } from "@/app/dashboard/products/cost-actions";
import type {
  CoreCostBreakdown,
  CoreCostBreakdownItem,
  CoreScopeCondition,
  CostBreakdownChangeStatus,
  ScopeDimension,
} from "@/lib/core/api";
import { StatusBadge } from "@/components/dashboard/primitives";
import { formatAmount } from "@/components/dashboard/cost/format";
import { SCOPE_DIMENSION_LABELS } from "@/components/dashboard/cost/scope-editor";

/** The dimensions offered for an Overview breakdown, in drill-down order:
 * clicking a value narrows to it and moves to the next dimension not yet
 * used. `resource_id` is the deepest level; tags are a side branch. */
export const BREAKDOWN_DIMENSIONS: ScopeDimension[] = [
  "provider_name",
  "billing_account_id",
  "service_name",
  "region_id",
  "resource_id",
  "tag",
];

const TOP_N = 8;

type DrillStep = {
  dimension: ScopeDimension;
  tagKey: string | null;
  value: string;
};

const STATUS_LABELS: Record<CostBreakdownChangeStatus, string> = {
  new: "New",
  removed: "Gone",
  increased: "Up",
  decreased: "Down",
  unchanged: "Flat",
};

function nextDimension(
  current: ScopeDimension,
  path: DrillStep[],
): ScopeDimension | null {
  const used = new Set([...path.map((step) => step.dimension), current]);
  const ordered: ScopeDimension[] = BREAKDOWN_DIMENSIONS.filter(
    (dimension) => dimension !== "tag",
  );
  const start = ordered.indexOf(current);
  return (
    ordered.slice(start + 1).find((dimension) => !used.has(dimension)) ?? null
  );
}

function stepScope(path: DrillStep[]): CoreScopeCondition[] {
  return path.map((step) => ({
    dimension: step.dimension,
    tag_key: step.dimension === "tag" ? step.tagKey : null,
    operator: "eq",
    value: step.value,
  }));
}

function stepLabel(step: { dimension: ScopeDimension; tagKey: string | null }) {
  return step.dimension === "tag"
    ? `Tag ${step.tagKey}`
    : SCOPE_DIMENSION_LABELS[step.dimension];
}

function deltaClass(delta: number) {
  if (delta > 0) return "text-amber-600 dark:text-amber-300";
  if (delta < 0) return "text-success";
  return "text-muted-foreground";
}

function formatDelta(delta: number, currency: string) {
  return `${delta > 0 ? "+" : ""}${formatAmount(delta, currency)}`;
}

function formatChange(item: { change_percent: number | null }) {
  return item.change_percent === null
    ? "—"
    : `${item.change_percent > 0 ? "+" : ""}${item.change_percent.toFixed(1)}%`;
}

/**
 * Comparison-ready breakdown of the Overview period by one dimension —
 * current vs. the preceding equal-length period, with Core's own
 * new/removed status and a reconciling "Other" — and filter-preserving
 * drill-down: clicking a value adds it as a scope condition and moves to the
 * next dimension. All arithmetic comes from Core (`POST .../cost/breakdown/query`).
 */
export function CostBreakdownPanel({
  periodStart,
  periodEnd,
  connectionId,
  targetId,
}: {
  periodStart: string;
  periodEnd: string;
  connectionId: string | null;
  targetId: string | null;
}) {
  const [dimension, setDimension] = useState<ScopeDimension>("service_name");
  const [tagKey, setTagKey] = useState("");
  const [appliedTagKey, setAppliedTagKey] = useState<string | null>(null);
  const [path, setPath] = useState<DrillStep[]>([]);
  const [data, setData] = useState<CoreCostBreakdown | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef(new Map<string, CoreCostBreakdown>());

  const scopeKey = `${connectionId ?? "all"}:${targetId ?? "all"}`;
  const needsTagKey = dimension === "tag" && !appliedTagKey;
  const requestKey = JSON.stringify([
    periodStart,
    periodEnd,
    scopeKey,
    dimension,
    appliedTagKey,
    path,
  ]);

  useEffect(() => {
    if (needsTagKey) return;
    const cached = cacheRef.current.get(requestKey);
    if (cached) {
      setData(cached);
      setError(null);
      setPending(false);
      return;
    }
    let cancelled = false;
    setPending(true);
    setError(null);
    queryCostBreakdownAction({
      period_start: periodStart,
      period_end: periodEnd,
      dimension,
      tag_key: dimension === "tag" ? appliedTagKey : null,
      connection_id: connectionId,
      target_id: targetId,
      scope: stepScope(path),
      top_n: TOP_N,
    }).then((response) => {
      if (cancelled) return;
      if (response.data) {
        cacheRef.current.set(requestKey, response.data);
        setData(response.data);
      } else {
        setData(null);
        setError(
          response.coverageRequired
            ? "This breakdown needs complete FOCUS billing coverage for the period and the one before it."
            : (response.error ?? "The breakdown could not be loaded."),
        );
      }
      setPending(false);
    });
    return () => {
      cancelled = true;
    };
    // `requestKey` already encodes every input below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, needsTagKey]);

  function chooseDimension(option: ScopeDimension) {
    setDimension(option);
    if (option !== "tag") setAppliedTagKey(null);
  }

  function drill(item: CoreCostBreakdownItem) {
    if (item.value === null) return;
    const next = nextDimension(dimension, path);
    if (!next) return;
    setPath([
      ...path,
      {
        dimension,
        tagKey: dimension === "tag" ? appliedTagKey : null,
        value: item.value,
      },
    ]);
    setDimension(next);
  }

  const canDrill =
    dimension !== "resource_id" && nextDimension(dimension, path) !== null;

  return (
    <div className="border-border-soft bg-dashboard-panel mt-4 rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">
              Breakdown &amp; drill-down
            </h3>
            {data ? (
              <StatusBadge
                status={data.source === "cost_usage" ? "success" : "neutral"}
              >
                {data.source === "cost_usage" ? "FOCUS" : "Cost Explorer"}
              </StatusBadge>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            This period vs. the preceding period of equal length.{" "}
            {canDrill ? "Click a row to drill down." : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BREAKDOWN_DIMENSIONS.filter(
            (option) =>
              !path.some(
                (step) => step.dimension === option && option !== "tag",
              ),
          ).map((option) => (
            <button
              key={option}
              type="button"
              disabled={pending}
              onClick={() => chooseDimension(option)}
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

      {dimension === "tag" ? (
        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedTagKey(tagKey.trim() || null);
          }}
        >
          <input
            value={tagKey}
            onChange={(event) => setTagKey(event.target.value)}
            placeholder="Tag key, e.g. team"
            aria-label="Tag key"
            className="border-border-soft bg-card-strong/70 focus:border-accent/40 h-8 w-48 rounded-lg border px-2.5 text-xs outline-none"
          />
          <button
            type="submit"
            className="border-foreground/10 hover:text-foreground h-8 rounded-lg border px-3 text-xs font-medium"
          >
            Group by tag
          </button>
        </form>
      ) : null}

      {path.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setPath([])}
            className="text-muted-foreground hover:text-foreground"
          >
            All spend
          </button>
          {path.map((step, index) => (
            <span
              key={`${step.dimension}:${step.value}`}
              className="inline-flex items-center gap-1.5"
            >
              <ChevronRight size={12} className="text-muted-foreground" />
              <span className="border-accent/20 bg-accent/8 inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                <span className="text-muted-foreground">
                  {stepLabel(step)}:
                </span>
                <span className="max-w-48 truncate font-medium">
                  {step.value}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${stepLabel(step)} filter`}
                  onClick={() => {
                    setPath(path.slice(0, index));
                    setDimension(step.dimension);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={11} />
                </button>
              </span>
            </span>
          ))}
        </div>
      ) : null}

      {needsTagKey ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Enter a tag key to group spend by its values.
        </p>
      ) : pending && !data ? (
        <p className="text-muted-foreground mt-4 text-sm">Loading…</p>
      ) : error ? (
        <p className="text-muted-foreground mt-4 text-sm">{error}</p>
      ) : data && data.by_currency.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          No spend in this scope for either period.
        </p>
      ) : data ? (
        <div className={`mt-4 space-y-6 ${pending ? "opacity-60" : ""}`}>
          {data.by_currency.map((currency) => {
            const maxAmount = Math.max(
              ...currency.items.map((item) =>
                Math.abs(Number(item.current_amount)),
              ),
              1,
            );
            return (
              <div key={currency.currency}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-muted-foreground text-xs font-semibold">
                    {currency.currency}
                  </h4>
                  <span className="text-muted-foreground text-xs">
                    {formatAmount(
                      Number(currency.current_total),
                      currency.currency,
                    )}{" "}
                    <span
                      className={deltaClass(Number(currency.absolute_delta))}
                    >
                      (
                      {formatDelta(
                        Number(currency.absolute_delta),
                        currency.currency,
                      )}
                      , {formatChange(currency)})
                    </span>
                  </span>
                </div>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-foreground/10 border-b text-left text-[10px] tracking-wide uppercase">
                        <th className="py-2 pr-3 font-medium">
                          {stepLabel({ dimension, tagKey: appliedTagKey })}
                        </th>
                        <th className="py-2 pr-3 text-right font-medium">
                          This period
                        </th>
                        <th className="py-2 pr-3 text-right font-medium">
                          Previous
                        </th>
                        <th className="py-2 pr-3 text-right font-medium">
                          Change
                        </th>
                        <th className="py-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {currency.items.map((item) => {
                        const drillable = canDrill && item.value !== null;
                        const delta = Number(item.absolute_delta);
                        return (
                          <tr
                            key={item.value ?? "__unattributed__"}
                            onClick={drillable ? () => drill(item) : undefined}
                            className={`border-foreground/5 border-b ${drillable ? "hover:bg-foreground/[0.03] cursor-pointer" : ""}`}
                          >
                            <td className="max-w-0 py-2 pr-3">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`truncate font-medium ${item.value === null ? "text-muted-foreground italic" : ""}`}
                                >
                                  {item.value ??
                                    (dimension === "resource_id"
                                      ? "Shared / not attributed to a resource"
                                      : "Not set")}
                                </span>
                                {drillable ? (
                                  <ChevronRight
                                    size={12}
                                    className="text-muted-foreground shrink-0"
                                  />
                                ) : null}
                              </div>
                              <span className="bg-foreground/5 mt-1 block h-1 overflow-hidden rounded-full">
                                <span
                                  className="bg-accent block h-full rounded-full"
                                  style={{
                                    width: `${(Math.abs(Number(item.current_amount)) / maxAmount) * 100}%`,
                                  }}
                                />
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-right font-mono">
                              {formatAmount(
                                Number(item.current_amount),
                                currency.currency,
                              )}
                            </td>
                            <td className="text-muted-foreground py-2 pr-3 text-right font-mono">
                              {formatAmount(
                                Number(item.previous_amount),
                                currency.currency,
                              )}
                            </td>
                            <td
                              className={`py-2 pr-3 text-right font-mono ${deltaClass(delta)}`}
                            >
                              {formatDelta(delta, currency.currency)}
                              <span className="text-muted-foreground ml-1">
                                {formatChange(item)}
                              </span>
                            </td>
                            <td className="py-2 text-right">
                              <StatusBadge
                                status={
                                  item.status === "new" ||
                                  item.status === "increased"
                                    ? "warning"
                                    : item.status === "unchanged"
                                      ? "neutral"
                                      : "success"
                                }
                              >
                                {STATUS_LABELS[item.status]}
                              </StatusBadge>
                            </td>
                          </tr>
                        );
                      })}
                      {currency.other ? (
                        <tr className="text-muted-foreground">
                          <td className="py-2 pr-3">
                            Other ({currency.other.count})
                          </td>
                          <td className="py-2 pr-3 text-right font-mono">
                            {formatAmount(
                              Number(currency.other.current_amount),
                              currency.currency,
                            )}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono">
                            {formatAmount(
                              Number(currency.other.previous_amount),
                              currency.currency,
                            )}
                          </td>
                          <td
                            className={`py-2 pr-3 text-right font-mono ${deltaClass(Number(currency.other.absolute_delta))}`}
                          >
                            {formatDelta(
                              Number(currency.other.absolute_delta),
                              currency.currency,
                            )}
                          </td>
                          <td />
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
