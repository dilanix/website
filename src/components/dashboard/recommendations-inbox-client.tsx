"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, Search, Sparkles, Undo2 } from "lucide-react";
import { listAllRecommendationsAction } from "@/app/dashboard/recommendations/actions";
import {
  dismissRecommendationAction,
  explainRecommendationAction,
  restoreRecommendationAction,
} from "@/app/dashboard/products/cost-actions";
import type {
  CoreUnifiedRecommendation,
  CoreUnifiedRecommendationListResponse,
  RecommendationStatus,
} from "@/lib/core/api";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { cn } from "@/lib/utils";
import { useDashboardFilterState } from "@/lib/dashboard/filter-storage";

const STATUS_FILTERS: { id: RecommendationStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "dismissed", label: "Dismissed" },
  { id: "resolved", label: "Resolved" },
];

const ALL_OPTION = "all";

function isRecommendationFilter(
  value: unknown,
): value is RecommendationStatus | "all" {
  return STATUS_FILTERS.some((filter) => filter.id === value);
}

function priorityTone(priority: CoreUnifiedRecommendation["priority"]) {
  return priority === "high" ? ("warning" as const) : ("neutral" as const);
}

function statusTone(status: RecommendationStatus) {
  if (status === "resolved") return "success" as const;
  if (status === "active") return "warning" as const;
  return "neutral" as const;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function savingsLabel(recommendation: CoreUnifiedRecommendation) {
  const impact = recommendation.impacts.find(
    (item) => item.impact_type === "cost_savings" && item.amount !== null,
  );
  if (!impact || impact.amount === null) return null;
  const amount = Number(impact.amount).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
  return `${amount} ${impact.currency ?? ""} / ${impact.period}`;
}

function sortRecommendations(items: CoreUnifiedRecommendation[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.last_detected_at).getTime() -
      new Date(left.last_detected_at).getTime(),
  );
}

function uniqueSorted(values: (string | null | undefined)[]) {
  return Array.from(
    new Set(values.filter((value): value is string => !!value)),
  ).sort();
}

/** Only Cost's own dismiss/restore/explain endpoints exist today — a
 * recommendation from a future product isn't actionable from this inbox
 * until that product ships its own equivalent endpoints. */
function isActionable(recommendation: CoreUnifiedRecommendation) {
  return recommendation.product_key === "cost";
}

export function RecommendationsInboxClient({
  initial,
}: {
  initial: CoreUnifiedRecommendationListResponse;
}) {
  const [recommendations, setRecommendations] = useState(() =>
    sortRecommendations(initial.items),
  );
  const [total, setTotal] = useState(initial.total);
  const [offset, setOffset] = useState(initial.items.length);
  const [statusFilter, setStatusFilter] = useDashboardFilterState<
    RecommendationStatus | "all"
  >("recommendations.status", "all", isRecommendationFilter);
  const [productFilter, setProductFilter] = useState(ALL_OPTION);
  const [analyzerFilter, setAnalyzerFilter] = useState(ALL_OPTION);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // A best-effort snapshot of what products/analyzers exist, taken once from
  // the first unfiltered page load — never shrinks as filters narrow the
  // live list below. A recommendation from a product/analyzer that only
  // appears past the first page's row count won't show up as a filter
  // option until it's been seen; there is no dedicated "distinct values"
  // endpoint yet.
  const [productOptions] = useState(() =>
    uniqueSorted(initial.items.map((item) => item.product_key)),
  );
  const [analyzerOptions] = useState(() =>
    uniqueSorted(initial.items.map((item) => item.analyzer_key)),
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return recommendations;
    return recommendations.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        (item.summary ?? "").toLowerCase().includes(query),
    );
  }, [recommendations, search]);

  function applyUpdate(updated: CoreUnifiedRecommendation) {
    setRecommendations((current) =>
      sortRecommendations(
        current.map((item) =>
          item.id === updated.id ? { ...item, ...updated } : item,
        ),
      ),
    );
  }

  async function refetch(next: {
    status: RecommendationStatus | "all";
    product: string;
    analyzer: string;
  }) {
    setError("");
    setLoading(true);
    const result = await listAllRecommendationsAction(
      {
        productKey: next.product === ALL_OPTION ? null : next.product,
        status: next.status,
        analyzerKey: next.analyzer === ALL_OPTION ? null : next.analyzer,
      },
      0,
    );
    setLoading(false);
    if (result.error) return setError(result.error);
    if (result.data) {
      setRecommendations(sortRecommendations(result.data.items));
      setTotal(result.data.total);
      setOffset(result.data.items.length);
    }
  }

  function onStatusChange(next: RecommendationStatus | "all") {
    setStatusFilter(next);
    void refetch({
      status: next,
      product: productFilter,
      analyzer: analyzerFilter,
    });
  }

  function onProductChange(next: string) {
    setProductFilter(next);
    setAnalyzerFilter(ALL_OPTION);
    void refetch({ status: statusFilter, product: next, analyzer: ALL_OPTION });
  }

  function onAnalyzerChange(next: string) {
    setAnalyzerFilter(next);
    void refetch({
      status: statusFilter,
      product: productFilter,
      analyzer: next,
    });
  }

  function runAction(
    recommendation: CoreUnifiedRecommendation,
    action: (id: string) => ReturnType<typeof dismissRecommendationAction>,
  ) {
    setError("");
    setPendingId(recommendation.id);
    startTransition(async () => {
      const result = await action(recommendation.id);
      setPendingId(null);
      if (result.error) return setError(result.error);
      if (result.data) applyUpdate({ ...recommendation, ...result.data });
    });
  }

  async function loadMore() {
    setError("");
    setLoading(true);
    const result = await listAllRecommendationsAction(
      {
        productKey: productFilter === ALL_OPTION ? null : productFilter,
        status: statusFilter,
        analyzerKey: analyzerFilter === ALL_OPTION ? null : analyzerFilter,
      },
      offset,
    );
    setLoading(false);
    if (result.error) return setError(result.error);
    if (result.data) {
      setRecommendations((current) =>
        sortRecommendations([...current, ...result.data!.items]),
      );
      setTotal(result.data.total);
      setOffset(offset + result.data.items.length);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground max-w-2xl text-sm leading-6">
        Every deterministic recommendation across every product you have access
        to, in one place — never gated by a single product&apos;s own access
        grant. Filter by product, analyzer, status, or search by title.
      </p>

      <div
        role="tablist"
        aria-label="Filter recommendations by status"
        className="border-foreground/10 flex gap-1 border-b"
      >
        {STATUS_FILTERS.map((item) => {
          const active = statusFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onStatusChange(item.id)}
              className={cn(
                "relative px-3 py-2.5 text-sm transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {active ? (
                <span
                  aria-hidden="true"
                  className="bg-accent absolute -bottom-px left-0 h-px w-full"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Product</span>
          <select
            value={productFilter}
            onChange={(event) => onProductChange(event.target.value)}
            className="border-border-soft bg-card-strong/60 rounded-md border px-2 py-1.5 text-xs"
          >
            <option value={ALL_OPTION}>All products</option>
            {productOptions.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Analyzer</span>
          <select
            value={analyzerFilter}
            onChange={(event) => onAnalyzerChange(event.target.value)}
            className="border-border-soft bg-card-strong/60 rounded-md border px-2 py-1.5 text-xs"
          >
            <option value={ALL_OPTION}>All analyzers</option>
            {analyzerOptions.map((analyzer) => (
              <option key={analyzer} value={analyzer}>
                {analyzer}
              </option>
            ))}
          </select>
        </label>

        <label className="border-border-soft bg-card-strong/60 flex min-w-48 flex-1 items-center gap-2 rounded-md border px-2 py-1.5 text-xs">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title or summary…"
            className="w-full bg-transparent text-xs outline-none"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {loading && visible.length === 0 ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : visible.length === 0 ? (
        <EmptyState
          title="No matching recommendations"
          description="Analyzers run on an hourly schedule against every verified cloud connection. Findings show up here as soon as one completes, or try clearing a filter."
        />
      ) : (
        <div className="border-border-soft overflow-hidden rounded-xl border">
          <div className="divide-border-soft divide-y">
            {visible.map((recommendation) => {
              const savings = savingsLabel(recommendation);
              const isPending = pendingId === recommendation.id;
              const actionable = isActionable(recommendation);
              return (
                <div
                  key={recommendation.id}
                  className="flex flex-col gap-3 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status="neutral">
                          {recommendation.product_key}
                        </StatusBadge>
                        <p className="text-sm font-semibold">
                          {recommendation.title}
                        </p>
                        {recommendation.priority ? (
                          <StatusBadge
                            status={priorityTone(recommendation.priority)}
                          >
                            {recommendation.priority}
                          </StatusBadge>
                        ) : null}
                        <StatusBadge status={statusTone(recommendation.status)}>
                          {recommendation.status}
                        </StatusBadge>
                      </div>
                      {recommendation.summary ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {recommendation.summary}
                        </p>
                      ) : null}
                      <p className="text-muted-foreground mt-1 text-xs">
                        {savings ? `${savings} · ` : ""}
                        {recommendation.analyzer_key} · first detected{" "}
                        {formatDate(recommendation.first_detected_at)} · last
                        seen {formatDate(recommendation.last_detected_at)}
                      </p>
                    </div>
                    {actionable ? (
                      <div className="flex shrink-0 items-center gap-3">
                        {recommendation.status === "active" ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              runAction(
                                recommendation,
                                dismissRecommendationAction,
                              )
                            }
                            className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                        ) : null}
                        {recommendation.status === "dismissed" ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              runAction(
                                recommendation,
                                restoreRecommendationAction,
                              )
                            }
                            className="text-success inline-flex items-center gap-1 text-xs disabled:opacity-50"
                          >
                            <Undo2 size={13} /> Restore
                          </button>
                        ) : null}
                        {recommendation.status !== "resolved" &&
                        !recommendation.explanation ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              runAction(
                                recommendation,
                                explainRecommendationAction,
                              )
                            }
                            className="text-accent inline-flex items-center gap-1 text-xs disabled:opacity-50"
                          >
                            <Sparkles size={13} />{" "}
                            {isPending ? "Explaining…" : "Explain with AI"}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {recommendation.explanation ? (
                    <div className="border-border-soft bg-card-strong/40 rounded-lg border p-3 text-xs">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Sparkles size={12} className="text-accent" /> AI
                        explanation
                      </p>
                      <p className="text-muted-foreground mt-1.5 leading-5">
                        {recommendation.explanation.summary}
                      </p>
                      {recommendation.explanation.risk_notes.length > 0 ? (
                        <ul className="text-muted-foreground mt-2 list-disc space-y-0.5 pl-4">
                          {recommendation.explanation.risk_notes.map(
                            (note, index) => (
                              <li key={index}>{note}</li>
                            ),
                          )}
                        </ul>
                      ) : null}
                      {recommendation.explanation.suggested_steps.length > 0 ? (
                        <ol className="text-muted-foreground mt-2 list-decimal space-y-0.5 pl-4">
                          {recommendation.explanation.suggested_steps.map(
                            (step, index) => (
                              <li key={index}>{step}</li>
                            ),
                          )}
                        </ol>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recommendations.length < total ? (
        <button
          type="button"
          disabled={loading}
          onClick={loadMore}
          className="border-border-soft text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 rounded-lg border px-3 py-2 text-xs disabled:opacity-50"
        >
          <ChevronDown size={13} /> {loading ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
