"use client";
import { type FormEvent, useState, useTransition } from "react";
import type { Route } from "next";
import Link from "next/link";
import { RefreshCw, Search } from "lucide-react";
import type { CoreCostUsage, CostUsageMetric } from "@/lib/core/api";
import { listCostUsageAction } from "@/app/dashboard/integrations/actions";
import {
  COST_USAGE_METRIC_FILTER_ORDER,
  COST_USAGE_PAGE_SIZE,
  costUsageMetricLabel,
} from "@/lib/billing/cost-usage";
import {
  formatCostAmount,
  formatCostPeriod,
} from "@/lib/billing/cost-summaries";
import { EmptyState, StatusBadge } from "./primitives";
import { FilterChip } from "./cost-summary-panel";
import { cn } from "@/lib/utils";

function CostUsageRow({
  costUsage,
  metric,
}: {
  costUsage: CoreCostUsage;
  metric: CostUsageMetric;
}) {
  const amount = costUsage[metric];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 text-sm md:grid-cols-[minmax(11rem,2fr)_minmax(8rem,1fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(7rem,0.7fr)]">
      <div className="min-w-0">
        <p className="truncate font-medium">{costUsage.service_name}</p>
        <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
          {costUsage.resource_id ??
            formatCostPeriod(
              costUsage.charge_period_start,
              costUsage.charge_period_end,
            )}
        </p>
      </div>
      <div className="text-muted-foreground hidden text-xs md:block">
        <span className="text-foreground block truncate font-medium">
          {costUsage.region_name ?? costUsage.region_id ?? "—"}
        </span>
        <span className="mt-0.5 block truncate">
          {costUsage.billing_account_id}
        </span>
      </div>
      <div className="text-muted-foreground hidden truncate text-xs md:block">
        {costUsage.sku_id ?? costUsage.sku_meter ?? "—"}
      </div>
      <div className="hidden md:block">
        <StatusBadge status="neutral">{costUsage.charge_category}</StatusBadge>
      </div>
      <span className="text-right font-mono text-sm font-medium">
        {amount !== null
          ? formatCostAmount(amount, costUsage.billing_currency)
          : "—"}
      </span>
    </div>
  );
}

interface CostUsageFilters {
  serviceName: string;
  billingAccountId: string;
}

/**
 * Raw FOCUS detail-row browser — the `billing.cost_usage` counterpart to
 * `CostSummaryPanel`. Deliberately simpler: no URL-persisted filter state (this
 * panel's filters are independent of, and would otherwise collide in the query
 * string with, `CostSummaryPanel`'s own `service`/`basis` params), and no period
 * picker of its own — FOCUS rows are browsed by service/account here, with
 * period-level totals already covered by `UnifiedCostTotals` above.
 */
export function CostUsagePanel({
  connectionId,
  costReadEnabled,
  connectionSettingsHref,
  initialCostUsage,
  initialTotal,
}: {
  connectionId: string;
  /** Whether `billing.read` is enabled on this connection — Core's read API
   * 403s rather than returning an empty page when it isn't
   * (`CostUsageService.list_cost_usages`), so this panel never even attempts
   * to fetch until it's true. */
  costReadEnabled: boolean;
  connectionSettingsHref: string;
  initialCostUsage: CoreCostUsage[];
  initialTotal: number;
}) {
  const [costUsage, setCostUsage] = useState(initialCostUsage);
  const [total, setTotal] = useState(initialTotal);
  const [metric, setMetric] = useState<CostUsageMetric>("effective_cost");
  const [filters, setFilters] = useState<CostUsageFilters>({
    serviceName: "",
    billingAccountId: "",
  });
  const [serviceNameInput, setServiceNameInput] = useState("");
  const [billingAccountInput, setBillingAccountInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  function reload(next: CostUsageFilters) {
    setRefreshing(true);
    setError("");
    startTransition(async () => {
      const result = await listCostUsageAction(connectionId, {
        limit: COST_USAGE_PAGE_SIZE,
        offset: 0,
        serviceName: next.serviceName || null,
        billingAccountId: next.billingAccountId || null,
      });
      setRefreshing(false);
      if (result.error) return setError(result.error);
      if (result.data) {
        setCostUsage(result.data.items);
        setTotal(result.data.total);
      }
    });
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters = {
      serviceName: serviceNameInput.trim(),
      billingAccountId: billingAccountInput.trim(),
    };
    setFilters(nextFilters);
    reload(nextFilters);
  }

  function loadMore() {
    setLoadingMore(true);
    startTransition(async () => {
      const result = await listCostUsageAction(connectionId, {
        limit: COST_USAGE_PAGE_SIZE,
        offset: costUsage.length,
        serviceName: filters.serviceName || null,
        billingAccountId: filters.billingAccountId || null,
      });
      setLoadingMore(false);
      if (result.error) return setError(result.error);
      if (result.data) {
        setCostUsage((current) => [...current, ...result.data!.items]);
      }
    });
  }

  if (!costReadEnabled) {
    return (
      <EmptyState
        title="Cost access is not enabled"
        description="Enable the provider's cost-read capability under Access, then run a cost sync to collect FOCUS spend data."
        actions={
          <Link
            href={connectionSettingsHref as Route}
            className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
          >
            Configure access
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-border-soft bg-card-strong/45 rounded-2xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Metric
            </span>
            <div className="flex flex-wrap gap-2">
              {COST_USAGE_METRIC_FILTER_ORDER.map((candidate) => (
                <FilterChip
                  key={candidate}
                  active={metric === candidate}
                  onClick={() => setMetric(candidate)}
                >
                  {costUsageMetricLabel(candidate)}
                </FilterChip>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => reload(filters)}
            disabled={refreshing}
            className="border-foreground/15 hover:bg-foreground/5 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={refreshing ? "animate-spin" : undefined}
            />
            Refresh
          </button>
        </div>

        <form
          onSubmit={submitFilters}
          className="border-border-soft mt-4 flex flex-wrap items-center gap-3 border-t pt-4"
        >
          <span className="relative block min-w-48 flex-1 sm:max-w-xs">
            <Search
              size={14}
              className="text-muted-foreground pointer-events-none absolute top-2.5 left-3"
            />
            <input
              value={serviceNameInput}
              onChange={(event) => setServiceNameInput(event.target.value)}
              placeholder="Filter by service"
              className="border-foreground/15 bg-background focus:border-accent h-9 w-full rounded-lg border pr-3 pl-9 text-xs outline-none"
            />
          </span>
          <input
            value={billingAccountInput}
            onChange={(event) => setBillingAccountInput(event.target.value)}
            placeholder="Filter by billing account ID"
            className="border-foreground/15 bg-background focus:border-accent h-9 min-w-48 flex-1 rounded-lg border px-3 text-xs outline-none sm:max-w-xs"
          />
          <button
            type="submit"
            className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-3 py-2 text-xs font-medium"
          >
            Apply
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">FOCUS detail rows</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {costUsage.length} of {total} rows loaded
          </p>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => reload(filters)}
            className="font-medium text-amber-700 hover:underline dark:text-amber-300"
          >
            Try again
          </button>
        </div>
      ) : null}

      {costUsage.length === 0 ? (
        <EmptyState
          title="No FOCUS cost data yet"
          description="Enable a FOCUS Data Export sync for this connection to collect detailed AWS spend data here."
        />
      ) : (
        <div
          className={cn(
            "border-border-soft overflow-hidden rounded-2xl border",
            pending && "opacity-70",
          )}
        >
          <div className="border-border-soft bg-foreground/[0.025] text-muted-foreground hidden grid-cols-[minmax(11rem,2fr)_minmax(8rem,1fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(7rem,0.7fr)] gap-3 border-b px-4 py-3 text-[11px] font-semibold tracking-wide uppercase md:grid">
            <span>Service / resource</span>
            <span>Region / account</span>
            <span>SKU</span>
            <span>Category</span>
            <span className="text-right">{costUsageMetricLabel(metric)}</span>
          </div>
          <div className="divide-border-soft divide-y">
            {costUsage.map((row) => (
              <CostUsageRow key={row.id} costUsage={row} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {costUsage.length < total ? (
        <button
          onClick={loadMore}
          disabled={pending || loadingMore}
          className="border-foreground/15 hover:bg-foreground/5 self-center rounded-lg border px-4 py-2 text-xs font-medium disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
