"use client";
import {
  type FormEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import type { Route } from "next";
import Link from "next/link";
import { ChevronDown, RefreshCw, Search } from "lucide-react";
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
import { ResourceMetadata } from "./resource-metadata";
import { useDashboardFilterState } from "@/lib/dashboard/filter-storage";

function costValue(value: string | null, currency: string | null) {
  if (value === null) return null;
  return currency ? formatCostAmount(value, currency) : value;
}

function costUsageDetails(costUsage: CoreCostUsage): Record<string, unknown> {
  const pricingCurrency =
    costUsage.pricing_currency ?? costUsage.billing_currency;
  return {
    billing: {
      billing_account_id: costUsage.billing_account_id,
      billing_account_name: costUsage.billing_account_name,
      billing_account_type: costUsage.billing_account_type,
      sub_account_id: costUsage.sub_account_id,
      sub_account_name: costUsage.sub_account_name,
      sub_account_type: costUsage.sub_account_type,
      invoice_id: costUsage.invoice_id,
      invoice_issuer_name: costUsage.invoice_issuer_name,
      billing_period_start: costUsage.billing_period_start,
      billing_period_end: costUsage.billing_period_end,
    },
    service: {
      provider_name: costUsage.provider_name,
      publisher_name: costUsage.publisher_name,
      service_category: costUsage.service_category,
      service_name: costUsage.service_name,
      service_subcategory: costUsage.service_subcategory,
    },
    resource: {
      resource_id: costUsage.resource_id,
      resource_name: costUsage.resource_name,
      resource_type: costUsage.resource_type,
    },
    region_and_zone: {
      region_id: costUsage.region_id,
      region_name: costUsage.region_name,
      availability_zone: costUsage.availability_zone,
    },
    sku: {
      sku_id: costUsage.sku_id,
      sku_meter: costUsage.sku_meter,
      sku_price_id: costUsage.sku_price_id,
      sku_price_details: costUsage.sku_price_details,
    },
    charge: {
      charge_period_start: costUsage.charge_period_start,
      charge_period_end: costUsage.charge_period_end,
      charge_category: costUsage.charge_category,
      charge_class: costUsage.charge_class,
      charge_description: costUsage.charge_description,
      charge_frequency: costUsage.charge_frequency,
      pricing_category: costUsage.pricing_category,
    },
    usage: {
      pricing_quantity: costUsage.pricing_quantity,
      pricing_unit: costUsage.pricing_unit,
      consumed_quantity: costUsage.consumed_quantity,
      consumed_unit: costUsage.consumed_unit,
    },
    costs: {
      billing_currency: costUsage.billing_currency,
      pricing_currency: costUsage.pricing_currency,
      billed_cost: costValue(costUsage.billed_cost, costUsage.billing_currency),
      effective_cost: costValue(
        costUsage.effective_cost,
        costUsage.billing_currency,
      ),
      list_cost: costValue(costUsage.list_cost, costUsage.billing_currency),
      contracted_cost: costValue(
        costUsage.contracted_cost,
        costUsage.billing_currency,
      ),
      list_unit_price: costValue(costUsage.list_unit_price, pricingCurrency),
      contracted_unit_price: costValue(
        costUsage.contracted_unit_price,
        pricingCurrency,
      ),
      pricing_currency_effective_cost: costValue(
        costUsage.pricing_currency_effective_cost,
        pricingCurrency,
      ),
      pricing_currency_list_unit_price: costValue(
        costUsage.pricing_currency_list_unit_price,
        pricingCurrency,
      ),
      pricing_currency_contracted_unit_price: costValue(
        costUsage.pricing_currency_contracted_unit_price,
        pricingCurrency,
      ),
    },
    commitment_discount: {
      id: costUsage.commitment_discount_id,
      type: costUsage.commitment_discount_type,
      category: costUsage.commitment_discount_category,
      status: costUsage.commitment_discount_status,
      name: costUsage.commitment_discount_name,
      quantity: costUsage.commitment_discount_quantity,
      unit: costUsage.commitment_discount_unit,
    },
    capacity_reservation: {
      id: costUsage.capacity_reservation_id,
      status: costUsage.capacity_reservation_status,
    },
    tags: costUsage.tags,
    provider_extra: costUsage.provider_extra,
    provenance: {
      row_id: costUsage.id,
      organization_id: costUsage.organization_id,
      connection_id: costUsage.connection_id,
      target_id: costUsage.target_id,
      billing_authority: costUsage.billing_authority,
      source_type: costUsage.source_type,
      export_arn: costUsage.export_arn,
      manifest_execution_id: costUsage.manifest_execution_id,
      source_object_key: costUsage.source_object_key,
      schema_version: costUsage.schema_version,
      collector_version: costUsage.collector_version,
      normalizer_version: costUsage.normalizer_version,
      sync_job_id: costUsage.sync_job_id,
      created_at: costUsage.created_at,
      updated_at: costUsage.updated_at,
    },
  };
}

function CostUsageRow({
  costUsage,
  metric,
  expanded,
  onToggle,
}: {
  costUsage: CoreCostUsage;
  metric: CostUsageMetric;
  expanded: boolean;
  onToggle: () => void;
}) {
  const amount = costUsage[metric];
  return (
    <article>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="hover:bg-foreground/[0.025] grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 p-4 text-left text-sm md:grid-cols-[minmax(11rem,2fr)_minmax(8rem,1fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(7rem,0.7fr)_auto]"
      >
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
          <StatusBadge status="neutral">
            {costUsage.charge_category}
          </StatusBadge>
        </div>
        <span className="text-right font-mono text-sm font-medium">
          {amount !== null
            ? formatCostAmount(amount, costUsage.billing_currency)
            : "—"}
        </span>
        <ChevronDown
          size={15}
          className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded ? (
        <div className="border-border-soft bg-foreground/[0.015] border-t p-4 sm:p-5">
          <ResourceMetadata metadata={costUsageDetails(costUsage)} />
        </div>
      ) : null}
    </article>
  );
}

interface CostUsageFilters {
  serviceName: string;
  billingAccountId: string;
}

function isCostUsageFilters(value: unknown): value is CostUsageFilters {
  if (!value || typeof value !== "object") return false;
  const filters = value as Record<string, unknown>;
  return (
    typeof filters.serviceName === "string" &&
    typeof filters.billingAccountId === "string"
  );
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isCostUsageMetric(value: unknown): value is CostUsageMetric {
  return COST_USAGE_METRIC_FILTER_ORDER.includes(value as CostUsageMetric);
}

/**
 * Raw FOCUS detail-row browser — the `billing.cost_usage` counterpart to
 * `CostSummaryPanel`. Deliberately simpler: no URL-persisted filter state (this
 * panel's filters are independent of `CostSummaryPanel`'s own filters and are
 * persisted under their own localStorage key. There is no period picker of its
 * own — period-level totals are already covered by `UnifiedCostTotals` above.
 */
export function CostUsagePanel({
  connectionId,
  costReadEnabled,
  focusExportEnabled,
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
  /** Whether the organization holds the `aws.billing.cost_usage` platform
   * capability grant (`OrganizationCapabilityGrantAdmin`) — distinct from
   * `costReadEnabled`, and not something the organization can self-serve
   * from Access: AWS FOCUS export is not yet generally supported, so this
   * defaults to disabled for every organization until Dilanix enables it. */
  focusExportEnabled: boolean;
  connectionSettingsHref: string;
  initialCostUsage: CoreCostUsage[];
  initialTotal: number;
}) {
  const [costUsage, setCostUsage] = useState(initialCostUsage);
  const [total, setTotal] = useState(initialTotal);
  const [metric, setMetric] = useDashboardFilterState<CostUsageMetric>(
    `costs:${connectionId}:usage-metric`,
    "effective_cost",
    isCostUsageMetric,
  );
  const [filters, setFilters, { restored: filtersRestored }] =
    useDashboardFilterState<CostUsageFilters>(
      `costs:${connectionId}:usage-filters`,
      { serviceName: "", billingAccountId: "" },
      isCostUsageFilters,
    );
  const [serviceNameInput, setServiceNameInput] = useDashboardFilterState(
    `costs:${connectionId}:usage-service-input`,
    "",
    isString,
  );
  const [billingAccountInput, setBillingAccountInput] = useDashboardFilterState(
    `costs:${connectionId}:usage-account-input`,
    "",
    isString,
  );
  const [pending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const restoredFiltersApplied = useRef(false);

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
  const restoreFilters = useEffectEvent((next: CostUsageFilters) => {
    reload(next);
  });

  useEffect(() => {
    if (!filtersRestored || restoredFiltersApplied.current) return;
    restoredFiltersApplied.current = true;
    if (filters.serviceName || filters.billingAccountId) {
      window.setTimeout(() => restoreFilters(filters), 0);
    }
  }, [filters, filtersRestored]);

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

  if (!focusExportEnabled) {
    return (
      <EmptyState
        title="FOCUS billing export is not enabled"
        description="AWS FOCUS 1.2 billing export is not yet available for your organization. Contact Dilanix to have it enabled."
      />
    );
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
          <div className="border-border-soft bg-foreground/[0.025] text-muted-foreground hidden grid-cols-[minmax(11rem,2fr)_minmax(8rem,1fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(7rem,0.7fr)_auto] gap-3 border-b px-4 py-3 text-[11px] font-semibold tracking-wide uppercase md:grid">
            <span>Service / resource</span>
            <span>Region / account</span>
            <span>SKU</span>
            <span>Category</span>
            <span className="text-right">{costUsageMetricLabel(metric)}</span>
            <span className="sr-only">Details</span>
          </div>
          <div className="divide-border-soft divide-y">
            {costUsage.map((row) => (
              <CostUsageRow
                key={row.id}
                costUsage={row}
                metric={metric}
                expanded={expandedId === row.id}
                onToggle={() =>
                  setExpandedId((current) =>
                    current === row.id ? null : row.id,
                  )
                }
              />
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
