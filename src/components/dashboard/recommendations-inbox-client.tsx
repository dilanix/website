"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, RefreshCw, Search, Undo2 } from "lucide-react";
import {
  getRecommendationAction,
  listAllRecommendationsAction,
} from "@/app/dashboard/recommendations/actions";
import {
  dismissRecommendationAction,
  restoreRecommendationAction,
} from "@/app/dashboard/products/cost-actions";
import type {
  CoreUnifiedRecommendation,
  CoreUnifiedRecommendationListResponse,
  RecommendationStatus,
} from "@/lib/core/api";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import {
  FinalRecommendation,
  NonActionableResult,
  ReviewProgress,
  ReviewQuestions,
  useRecommendationReview,
} from "@/components/dashboard/recommendation-review";
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

/** Pulls the resource's own AWS identifier (e.g. `i-0abc123`, `vol-0abc123`)
 * and, when tagged, its human-assigned `Name` out of the analyzer's
 * `resource_identity` evidence entry — older recommendations created before
 * analyzers started emitting it won't have one. */
function resourceIdentity(recommendation: CoreUnifiedRecommendation) {
  const evidence = recommendation.evidence.find(
    (item) => item.evidence_key === "resource_identity",
  );
  const externalId = evidence?.value.external_id;
  if (typeof externalId !== "string") return null;
  const name = evidence?.value.name;
  return typeof name === "string" && name.length > 0
    ? `${name} (${externalId})`
    : externalId;
}

const EVIDENCE_LABELS: Record<string, string> = {
  resource_identity: "Resource",
  cpu_utilization: "CPU utilization",
  volume_state: "Volume state",
  pricing_quote: "Pricing",
};

function evidenceFieldLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatEvidenceFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return value.toLocaleString("en-US");
  return String(value);
}

function formatObservedAt(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Only Cost's own dismiss/restore endpoints exist today — a
 * recommendation from a future product isn't actionable from this inbox
 * until that product ships its own equivalent endpoints. */
function isActionable(recommendation: CoreUnifiedRecommendation) {
  return recommendation.product_key === "cost";
}

/** Savings are only shown for something Dilanix actually recommends — a
 * completed review — never for an unreviewed candidate or one its review
 * found non-actionable. */
function showsSavings(recommendation: CoreUnifiedRecommendation) {
  return recommendation.ai_review?.outcome === "completed";
}

function RecommendationRow({
  recommendation,
  pending,
  expanded,
  onToggleDetails,
  onAction,
  onUpdated,
}: {
  recommendation: CoreUnifiedRecommendation;
  pending: boolean;
  expanded: boolean;
  onToggleDetails: () => void;
  onAction: (
    recommendation: CoreUnifiedRecommendation,
    action: (id: string) => ReturnType<typeof dismissRecommendationAction>,
  ) => void;
  onUpdated: (recommendation: CoreUnifiedRecommendation) => void;
}) {
  const review = useRecommendationReview({
    recommendationId: recommendation.id,
    onFinished: async () => {
      const result = await getRecommendationAction(recommendation.id);
      if (result.data) onUpdated(result.data);
    },
  });
  const savings = showsSavings(recommendation)
    ? savingsLabel(recommendation)
    : null;
  const actionable = isActionable(recommendation);
  const identity = resourceIdentity(recommendation);
  const guidance = recommendation.ai_review;
  const currency =
    recommendation.impacts.find((item) => item.impact_type === "cost_savings")
      ?.currency ?? null;
  const summary =
    guidance?.outcome === "completed"
      ? guidance.summary
      : recommendation.summary;
  const busy = pending || review.active;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status="neutral">
              {recommendation.product_key}
            </StatusBadge>
            <p className="text-sm font-semibold">{recommendation.title}</p>
            {identity ? (
              <code className="border-border-soft bg-card-strong/60 rounded px-1.5 py-0.5 text-[11px]">
                {identity}
              </code>
            ) : null}
            {recommendation.priority && showsSavings(recommendation) ? (
              <StatusBadge status={priorityTone(recommendation.priority)}>
                {recommendation.priority}
              </StatusBadge>
            ) : null}
            <StatusBadge status={statusTone(recommendation.status)}>
              {recommendation.status}
            </StatusBadge>
          </div>
          {summary ? (
            <p className="text-muted-foreground mt-1 text-xs">{summary}</p>
          ) : null}
          <p className="text-muted-foreground mt-1 text-xs">
            {savings ? `${savings} · ` : ""}
            {recommendation.analyzer_key} · first detected{" "}
            {formatDate(recommendation.first_detected_at)} · last seen{" "}
            {formatDate(recommendation.last_detected_at)}
            {recommendation.evidence.length > 0 ? (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={onToggleDetails}
                  className="text-accent underline-offset-2 hover:underline"
                >
                  {expanded ? "Hide details" : "Show details"}
                </button>
              </>
            ) : null}
          </p>
        </div>
        {actionable ? (
          <div className="flex shrink-0 items-center gap-3">
            {recommendation.status === "active" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onAction(recommendation, dismissRecommendationAction)
                }
                className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-50"
              >
                Dismiss
              </button>
            ) : null}
            {recommendation.status !== "resolved" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void review.start()}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={cn(review.active && "animate-spin")}
                />
                {review.active ? "Re-checking…" : "Re-check"}
              </button>
            ) : null}
            {recommendation.status === "dismissed" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onAction(recommendation, restoreRecommendationAction)
                }
                className="text-success inline-flex items-center gap-1 text-xs disabled:opacity-50"
              >
                <Undo2 size={13} /> Restore
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div className="border-border-soft bg-card-strong/30 flex flex-col gap-3 rounded-lg border p-3 text-xs">
          {recommendation.evidence.map((item, index) => (
            <div key={index}>
              <p className="font-medium">
                {EVIDENCE_LABELS[item.evidence_key] ??
                  evidenceFieldLabel(item.evidence_key)}
                <span className="text-muted-foreground ml-2 font-normal">
                  observed {formatObservedAt(item.observed_at)}
                </span>
              </p>
              <dl className="mt-1 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5">
                {Object.entries(item.value).map(([field, value]) => (
                  <div key={field} className="contents">
                    <dt className="text-muted-foreground">
                      {evidenceFieldLabel(field)}
                    </dt>
                    <dd>{formatEvidenceFieldValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      ) : null}

      {review.error ? (
        <p role="alert" className="text-xs text-red-500">
          {review.error}
        </p>
      ) : null}

      {review.active && review.review ? (
        <ReviewProgress review={review.review} />
      ) : review.review?.status === "failed" ? (
        <p className="text-muted-foreground text-xs">
          The check couldn&apos;t be completed. The recommendation is unchanged
          — try again later.
        </p>
      ) : guidance?.outcome === "needs_input" &&
        guidance.questions.length > 0 ? (
        <ReviewQuestions
          key={guidance.questions.map((question) => question.fact_key).join()}
          questions={guidance.questions}
          pending={busy}
          onSubmit={(answers) => void review.answer(answers)}
        />
      ) : guidance?.outcome === "completed" ? (
        <FinalRecommendation review={guidance} currency={currency} />
      ) : guidance &&
        (guidance.outcome === "rejected" ||
          guidance.outcome === "insufficient_evidence") ? (
        <NonActionableResult review={guidance} />
      ) : null}
    </div>
  );
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
    void refetch({
      status: statusFilter,
      product: next,
      analyzer: ALL_OPTION,
    });
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
        Every recommendation across every product you have access to, in one
        place — each with its options, trade-offs, and what to check before
        acting. Filter by product, analyzer, status, or search by title.
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
          description="Analyzers run on an hourly schedule against every verified cloud connection. A finding shows up here once its review has checked what the resource is for, or try clearing a filter."
        />
      ) : (
        <div className="border-border-soft overflow-hidden rounded-xl border">
          <div className="divide-border-soft divide-y">
            {visible.map((recommendation) => (
              <RecommendationRow
                key={recommendation.id}
                recommendation={recommendation}
                pending={pendingId === recommendation.id}
                expanded={expandedIds.has(recommendation.id)}
                onToggleDetails={() => toggleExpanded(recommendation.id)}
                onAction={runAction}
                onUpdated={applyUpdate}
              />
            ))}
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
