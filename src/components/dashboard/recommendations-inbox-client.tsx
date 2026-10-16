"use client";

import { useMemo, useState, useTransition } from "react";
import { Info, Search } from "lucide-react";
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
import { EmptyState } from "@/components/dashboard/primitives";
import {
  ExpandableRow,
  ExpandableTable,
  RowMenu,
  RowTag,
  StatePill,
  type PillTone,
  type RowMenuItem,
} from "@/components/dashboard/expandable-table";
import { ResourceCategoryIcon } from "@/components/dashboard/resource-category-icon";
import {
  BeforeYouContinue,
  NonActionableResult,
  RecommendationInsight,
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
  return {
    amount: `${amount} ${impact.currency ?? ""}`.trim(),
    unit: `per ${impact.period}`,
  };
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

/** A whole-environment recommendation carries `environment` evidence instead
 * of one resource. */
function environmentScope(recommendation: CoreUnifiedRecommendation) {
  const environment = recommendation.evidence.find(
    (item) => item.evidence_key === "environment",
  )?.value;
  if (!environment || typeof environment.name !== "string") return null;
  const count = environment.member_count;
  return typeof count === "number"
    ? `Environment ${environment.name} · ${count} resources`
    : `Environment ${environment.name}`;
}

/** Account-level recommendations (e.g. a Savings Plan purchase) carry
 * `commitment_scope` instead of one resource. */
function commitmentScope(recommendation: CoreUnifiedRecommendation) {
  const scope = recommendation.evidence.find(
    (item) => item.evidence_key === "commitment_scope",
  )?.value;
  if (!scope) return null;
  const count = scope.instance_count;
  return typeof count === "number"
    ? `AWS account · ${count} instance${count === 1 ? "" : "s"}`
    : "AWS account";
}

const EVIDENCE_LABELS: Record<string, string> = {
  resource_identity: "Resource",
  commitment_scope: "Commitment scope",
  savings_plan: "Savings Plan",
  steady_usage: "Steady on-demand usage",
  instance_savings_plan_alternative: "Alternative: EC2 Instance Savings Plan",
  cpu_utilization: "CPU utilization",
  volume_state: "Volume state",
  pricing_quote: "Pricing",
  environment: "Environment",
  environment_plan: "Savings by action",
  environment_traffic: "Client traffic",
  consumer_traffic: "Client traffic",
};

// Internal identifiers that mean nothing to a reader.
const HIDDEN_EVIDENCE_FIELDS = new Set(["resource_id"]);

function evidenceFieldLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatEvidenceFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return value.toLocaleString("en-US");
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    // One line per item; objects collapse to "field: value" pairs.
    return value.map(formatEvidenceFieldValue).join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([field]) => !HIDDEN_EVIDENCE_FIELDS.has(field))
      .map(
        ([field, nested]) =>
          `${evidenceFieldLabel(field)}: ${formatEvidenceFieldValue(nested)}`,
      )
      .join(", ");
  }
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

const GRID =
  "md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,0.75fr)_minmax(0,0.85fr)_5.5rem]";

/** What the resource column shows: kind, name and where. */
function resourceSummary(recommendation: CoreUnifiedRecommendation) {
  const identity = recommendation.evidence.find(
    (item) => item.evidence_key === "resource_identity",
  )?.value;
  if (identity && typeof identity.external_id === "string") {
    const type =
      typeof identity.provider_resource_type === "string"
        ? identity.provider_resource_type
        : "";
    const [service = "", kind = ""] = type.split(".");
    const name =
      typeof identity.name === "string" && identity.name
        ? identity.name
        : identity.external_id;
    return {
      family: service,
      kind: [service.toUpperCase(), kind.replace(/_/g, " ")]
        .filter(Boolean)
        .join(" "),
      name,
      detail:
        name !== identity.external_id
          ? `${identity.external_id}`
          : typeof identity.region === "string"
            ? identity.region
            : null,
      region: typeof identity.region === "string" ? identity.region : null,
    };
  }
  const scope =
    environmentScope(recommendation) ?? commitmentScope(recommendation);
  return scope
    ? {
        family: "",
        kind: scope.split(" · ")[0],
        name: scope,
        detail: null,
        region: null,
      }
    : null;
}

/** Icon tile tint per service family — presentation only. */
const FAMILY_TINTS: Record<string, string> = {
  ec2: "border-orange-500/25 bg-orange-500/10 text-orange-500",
  ecr: "border-amber-500/25 bg-amber-500/10 text-amber-500",
  ecs: "border-amber-500/25 bg-amber-500/10 text-amber-500",
  rds: "border-violet-500/25 bg-violet-500/10 text-violet-500",
  dynamodb: "border-violet-500/25 bg-violet-500/10 text-violet-500",
  elasticache: "border-red-500/25 bg-red-500/10 text-red-500",
  s3: "border-emerald-500/25 bg-emerald-500/10 text-emerald-500",
  lambda: "border-yellow-500/25 bg-yellow-500/10 text-yellow-500",
  elasticloadbalancingv2: "border-pink-500/25 bg-pink-500/10 text-pink-500",
};

const FAMILY_CATEGORIES: Record<string, string> = {
  ec2: "compute",
  lambda: "compute",
  ecr: "container",
  ecs: "container",
  eks: "container",
  rds: "database",
  dynamodb: "database",
  elasticache: "cache",
  s3: "storage",
  efs: "storage",
  elasticloadbalancingv2: "network",
};

function reviewState(
  recommendation: CoreUnifiedRecommendation,
  reviewing: boolean,
): { tone: PillTone; label: string; spinning?: boolean } {
  if (reviewing)
    return { tone: "accent", label: "Re-checking", spinning: true };
  if (recommendation.status === "resolved")
    return { tone: "success", label: "Resolved" };
  if (recommendation.status === "dismissed")
    return { tone: "neutral", label: "Dismissed" };
  const outcome = recommendation.ai_review?.outcome;
  if (outcome === "completed")
    return { tone: "success", label: "Ready to fix" };
  if (outcome === "needs_input")
    return { tone: "warning", label: "Needs your input" };
  return { tone: "neutral", label: "No change advised" };
}

function RecommendationRow({
  recommendation,
  pending,
  open,
  onToggleOpen,
  expanded,
  onToggleDetails,
  onAction,
  onUpdated,
}: {
  recommendation: CoreUnifiedRecommendation;
  pending: boolean;
  open: boolean;
  onToggleOpen: () => void;
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
  const resource = resourceSummary(recommendation);
  const guidance = recommendation.ai_review;
  const currency =
    recommendation.impacts.find((item) => item.impact_type === "cost_savings")
      ?.currency ?? null;
  const summary =
    guidance?.outcome === "completed"
      ? guidance.summary
      : recommendation.summary;
  const busy = pending || review.active;
  const state = reviewState(recommendation, review.active);
  const fixableId =
    actionable && recommendation.status !== "resolved"
      ? recommendation.id
      : undefined;

  const menu: RowMenuItem[] = actionable
    ? [
        ...(recommendation.status !== "resolved"
          ? [
              {
                label: "Re-check",
                onSelect: () => void review.start(),
                disabled: busy,
              },
            ]
          : []),
        ...(recommendation.status === "active"
          ? [
              {
                label: "Dismiss",
                onSelect: () =>
                  onAction(recommendation, dismissRecommendationAction),
                disabled: busy,
                tone: "danger" as const,
              },
            ]
          : []),
        ...(recommendation.status === "dismissed"
          ? [
              {
                label: "Restore",
                onSelect: () =>
                  onAction(recommendation, restoreRecommendationAction),
                disabled: busy,
              },
            ]
          : []),
      ]
    : [];

  const evidencePanel =
    recommendation.evidence.length > 0 ? (
      <div className="text-xs">
        <button
          type="button"
          onClick={onToggleDetails}
          className="text-accent underline-offset-2 hover:underline"
        >
          {expanded ? "Hide raw evidence" : "Show raw evidence"}
        </button>
        {expanded ? (
          <div className="border-border-soft bg-card-strong/30 animate-toast-in mt-2 flex flex-col gap-3 rounded-lg border p-3">
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
                      <dd className="whitespace-pre-line">
                        {formatEvidenceFieldValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    ) : null;

  const rightPanel = review.error ? (
    <p role="alert" className="text-xs text-red-500">
      {review.error}
    </p>
  ) : review.active && review.review ? (
    <ReviewProgress review={review.review} />
  ) : review.review?.status === "failed" ? (
    <p className="text-muted-foreground text-xs">
      The check couldn&apos;t be completed. The recommendation is unchanged —
      try again later.
    </p>
  ) : guidance?.outcome === "needs_input" && guidance.questions.length > 0 ? (
    <ReviewQuestions
      key={guidance.questions.map((question) => question.fact_key).join()}
      questions={guidance.questions}
      pending={busy}
      currency={currency}
      onSubmit={(answers) => void review.answer(answers)}
    />
  ) : guidance?.outcome === "completed" ? (
    <BeforeYouContinue review={guidance} recommendationId={fixableId} />
  ) : guidance ? (
    <NonActionableResult review={guidance} />
  ) : null;

  return (
    <ExpandableRow
      id={recommendation.id}
      label={recommendation.title}
      open={open}
      onToggle={onToggleOpen}
      gridClassName={GRID}
      title={
        <>
          <span className="block text-sm font-semibold">
            {recommendation.title}
          </span>
          {summary ? (
            <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs leading-5">
              {summary}
            </span>
          ) : null}
          <span className="mt-2 flex flex-wrap gap-1.5">
            <RowTag>{recommendation.product_key}</RowTag>
            {recommendation.priority && showsSavings(recommendation) ? (
              <RowTag
                tone={
                  recommendation.priority === "high" ? "warning" : "neutral"
                }
              >
                {recommendation.priority} priority
              </RowTag>
            ) : null}
            <RowTag
              tone={recommendation.status === "active" ? "warning" : "neutral"}
            >
              {recommendation.status}
            </RowTag>
          </span>
        </>
      }
      cells={[
        resource ? (
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                FAMILY_TINTS[resource.family] ??
                  "border-border-soft bg-card-strong/60 text-muted-foreground",
              )}
            >
              <ResourceCategoryIcon
                category={FAMILY_CATEGORIES[resource.family] ?? "other"}
                size={16}
              />
            </span>
            <span className="min-w-0 text-xs">
              <span className="text-muted-foreground block">
                {resource.kind}
              </span>
              <span className="block truncate text-sm font-medium">
                {resource.name}
              </span>
              {resource.detail || resource.region ? (
                <span className="text-muted-foreground block truncate">
                  {[
                    resource.detail !== resource.region
                      ? resource.detail
                      : null,
                    resource.region,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                </span>
              ) : null}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
        savings ? (
          <div>
            <span className="text-muted-foreground block text-[11px]">
              Up to
            </span>
            <span className="text-accent block font-mono text-xl font-semibold tracking-tight">
              {savings.amount}
            </span>
            <span className="text-muted-foreground block text-[11px]">
              {savings.unit}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">No estimate</span>
        ),
        <StatePill key="state" tone={state.tone} spinning={state.spinning}>
          {state.label}
        </StatePill>,
        <div key="actions" className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onToggleOpen}
            className="text-accent px-2 py-1 text-xs font-medium hover:underline"
          >
            {open ? "Close" : "Details"}
          </button>
          <RowMenu
            label={`More actions for ${recommendation.title}`}
            items={menu}
          />
        </div>,
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="lg:border-border-soft flex flex-col gap-5 lg:border-r lg:pr-6">
          {guidance?.outcome === "completed" ? (
            <RecommendationInsight
              review={guidance}
              currency={currency}
              recommendationId={fixableId}
            />
          ) : (
            <section aria-label="Why this matters" className="text-sm">
              <h3 className="text-base font-semibold tracking-tight">
                Why this matters
              </h3>
              <p className="text-muted-foreground mt-1.5 leading-6">
                {recommendation.summary ??
                  "Dilanix is still checking this finding."}
              </p>
            </section>
          )}
          {evidencePanel}
          <p className="text-muted-foreground text-[11px]">
            {recommendation.analyzer_key} · first detected{" "}
            {formatDate(recommendation.first_detected_at)} · last seen{" "}
            {formatDate(recommendation.last_detected_at)}
          </p>
        </div>
        <div>{rightPanel}</div>
      </div>
    </ExpandableRow>
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
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function toggleOpen(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

  const needsInput = recommendations.filter(
    (item) =>
      item.status === "active" && item.ai_review?.outcome === "needs_input",
  ).length;
  const ready = recommendations.filter(
    (item) =>
      item.status === "active" && item.ai_review?.outcome === "completed",
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <dl className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {[
          { value: total, label: "recommendations", className: "text-accent" },
          {
            value: needsInput,
            label: "need your input",
            className: "text-amber-500",
          },
          { value: ready, label: "ready to fix", className: "text-success" },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "flex items-baseline gap-2",
              index > 0 && "border-border-soft border-l pl-6",
            )}
          >
            <dt className="sr-only">{stat.label}</dt>
            <dd
              className={cn("font-mono text-2xl font-semibold", stat.className)}
            >
              {stat.value}
            </dd>
            <span aria-hidden className="text-muted-foreground text-sm">
              {stat.label}
            </span>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Filter recommendations by status"
          className="flex flex-wrap gap-2"
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
                  "rounded-xl border px-4 py-2 text-xs font-medium transition-colors",
                  active
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-border-soft text-muted-foreground hover:text-foreground hover:border-foreground/20",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <select
          aria-label="Product"
          value={productFilter}
          onChange={(event) => onProductChange(event.target.value)}
          className="border-border-soft bg-card-strong/60 rounded-xl border px-3 py-2 text-xs"
        >
          <option value={ALL_OPTION}>All products</option>
          {productOptions.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>

        <select
          aria-label="Analyzer"
          value={analyzerFilter}
          onChange={(event) => onAnalyzerChange(event.target.value)}
          className="border-border-soft bg-card-strong/60 rounded-xl border px-3 py-2 text-xs"
        >
          <option value={ALL_OPTION}>All analyzers</option>
          {analyzerOptions.map((analyzer) => (
            <option key={analyzer} value={analyzer}>
              {analyzer}
            </option>
          ))}
        </select>

        <label className="border-border-soft bg-card-strong/60 ml-auto flex min-w-56 flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:max-w-sm">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search recommendations…"
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
        <ExpandableTable
          label="Recommendations"
          columns={[
            "Recommendation",
            "Resource",
            "Potential savings",
            "Status",
            "",
          ]}
          gridClassName={GRID}
          footer={
            <>
              <span className="inline-flex items-center gap-1.5">
                <Info size={13} aria-hidden /> Estimates may change after a
                re-check.
              </span>
              <span className="flex items-center gap-3">
                Showing {visible.length} of {total} recommendations
                {recommendations.length < total ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={loadMore}
                    className="text-accent font-medium hover:underline disabled:opacity-50"
                  >
                    {loading ? "Loading…" : "Load more"}
                  </button>
                ) : null}
              </span>
            </>
          }
        >
          {visible.map((recommendation) => (
            <RecommendationRow
              key={recommendation.id}
              recommendation={recommendation}
              pending={pendingId === recommendation.id}
              open={openIds.has(recommendation.id)}
              onToggleOpen={() => toggleOpen(recommendation.id)}
              expanded={expandedIds.has(recommendation.id)}
              onToggleDetails={() => toggleExpanded(recommendation.id)}
              onAction={runAction}
              onUpdated={applyUpdate}
            />
          ))}
        </ExpandableTable>
      )}
    </div>
  );
}
