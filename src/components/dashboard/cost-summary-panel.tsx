"use client";
import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { Route } from "next";
import Link from "next/link";
import { RefreshCw, Search } from "lucide-react";
import type { CoreCostSummary, CostBasis } from "@/lib/core/api";
import { listCostSummariesAction } from "@/app/dashboard/integrations/actions";
import {
  COST_BASIS_FILTER_ORDER,
  COST_SUMMARIES_PAGE_SIZE,
  PERIOD_PRESETS,
  type PeriodPresetId,
  costBasisLabel,
  customRange,
  formatCostAmount,
  formatCostPeriod,
  presetRange,
  type DateRange,
} from "@/lib/billing/cost-summaries";
import { EmptyState, StatusBadge } from "./primitives";
import { CostSummaryTotals } from "./cost-summary-totals";
import { cn } from "@/lib/utils";

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-accent/25 bg-accent/10 text-accent"
          : "border-foreground/10 text-muted-foreground hover:bg-foreground/5",
      )}
    >
      {children}
    </button>
  );
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function updateCostsUrl(values: Record<string, string | null>) {
  const url = new URL(window.location.href);
  Object.entries(values).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  });
  window.history.replaceState(null, "", url);
}

function CostSummaryRow({ costSummary }: { costSummary: CoreCostSummary }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 text-sm md:grid-cols-[minmax(12rem,2fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(7rem,0.7fr)]">
      <div className="min-w-0">
        <p className="truncate font-medium">{costSummary.service_name}</p>
        <p className="text-muted-foreground mt-0.5 font-mono text-xs">
          {formatCostPeriod(costSummary.period_start, costSummary.period_end)}
        </p>
      </div>
      <div className="text-muted-foreground hidden text-xs md:block">
        <span className="text-foreground block font-medium">
          {costSummary.service_provider}
        </span>
        <span className="mt-0.5 block truncate">
          {costSummary.billing_authority}
        </span>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <StatusBadge status="neutral">
          {costBasisLabel(costSummary.cost_basis)}
        </StatusBadge>
        {costSummary.is_estimated ? (
          <StatusBadge status="warning">Estimated</StatusBadge>
        ) : null}
      </div>
      <span className="text-right font-mono text-sm font-medium">
        {formatCostAmount(costSummary.amount, costSummary.currency)}
      </span>
    </div>
  );
}

interface CostSummaryFilters {
  costBasis: CostBasis;
  serviceName: string;
}

export function CostSummaryPanel({
  connectionId,
  costReadEnabled,
  connectionSettingsHref,
  initialCostSummaries,
  initialTotal,
  initialCostBasis = "net_unblended",
  initialServiceName = "",
  initialPeriod = "30d",
  initialCustomStart = "",
  initialCustomEnd = "",
}: {
  connectionId: string;
  /** Whether `billing.read` is enabled on this connection — Core's read API
   * 403s rather than returning an empty page when it isn't
   * (`CostSummaryService.list_cost_summaries`), so this panel never even
   * attempts to fetch until it's true. */
  costReadEnabled: boolean;
  connectionSettingsHref: string;
  initialCostSummaries: CoreCostSummary[];
  initialTotal: number;
  initialCostBasis?: CostBasis;
  initialServiceName?: string;
  initialPeriod?: PeriodPresetId | "custom";
  initialCustomStart?: string;
  initialCustomEnd?: string;
}) {
  const [costSummaries, setCostSummaries] = useState(initialCostSummaries);
  const [total, setTotal] = useState(initialTotal);
  const [filters, setFilters] = useState<CostSummaryFilters>({
    costBasis: initialCostBasis,
    serviceName: initialServiceName,
  });
  const [serviceNameInput, setServiceNameInput] = useState(initialServiceName);
  const [presetId, setPresetId] = useState<PeriodPresetId | "custom">(
    initialPeriod,
  );
  const [customStart, setCustomStart] = useState(initialCustomStart);
  const [customEnd, setCustomEnd] = useState(initialCustomEnd);
  const [pending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

  const range: DateRange | null = useMemo(() => {
    if (presetId === "custom") {
      if (!customStart || !customEnd || customStart > customEnd) return null;
      return customRange(customStart, customEnd);
    }
    return presetRange(presetId);
  }, [presetId, customStart, customEnd]);
  const visibleCostSummaries = useMemo(() => {
    if (!range) return [];
    return costSummaries.filter((summary) => {
      const start = new Date(summary.period_start).getTime();
      return start >= range.start.getTime() && start < range.end.getTime();
    });
  }, [costSummaries, range]);

  function reload(next: CostSummaryFilters) {
    setRefreshing(true);
    setError("");
    startTransition(async () => {
      const result = await listCostSummariesAction(connectionId, {
        limit: COST_SUMMARIES_PAGE_SIZE,
        offset: 0,
        costBasis: next.costBasis,
        serviceName: next.serviceName || null,
      });
      setRefreshing(false);
      if (result.error) return setError(result.error);
      if (result.data) {
        setCostSummaries(result.data.items);
        setTotal(result.data.total);
      }
    });
  }

  function selectCostBasis(next: CostBasis) {
    const nextFilters = { ...filters, costBasis: next };
    setFilters(nextFilters);
    updateCostsUrl({ basis: next });
    reload(nextFilters);
  }

  function submitServiceNameFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters = { ...filters, serviceName: serviceNameInput.trim() };
    setFilters(nextFilters);
    updateCostsUrl({ service: nextFilters.serviceName || null });
    reload(nextFilters);
  }

  function loadMore() {
    setLoadingMore(true);
    startTransition(async () => {
      const result = await listCostSummariesAction(connectionId, {
        limit: COST_SUMMARIES_PAGE_SIZE,
        offset: costSummaries.length,
        costBasis: filters.costBasis,
        serviceName: filters.serviceName || null,
      });
      setLoadingMore(false);
      if (result.error) return setError(result.error);
      if (result.data) {
        setCostSummaries((current) => [...current, ...result.data!.items]);
      }
    });
  }

  function selectPeriod(next: PeriodPresetId | "custom") {
    if (next === "custom" && (!customStart || !customEnd)) {
      const base =
        presetId === "custom" ? presetRange("30d") : presetRange(presetId);
      const start = toDateInputValue(base.start);
      const end = toDateInputValue(
        new Date(base.end.getTime() - 24 * 60 * 60 * 1000),
      );
      setCustomStart(start);
      setCustomEnd(end);
      updateCostsUrl({ period: "custom", start, end });
    } else {
      updateCostsUrl({
        period: next === "30d" ? null : next,
        start: next === "custom" ? customStart : null,
        end: next === "custom" ? customEnd : null,
      });
    }
    setPresetId(next);
  }

  function refreshAll() {
    setRefreshVersion((current) => current + 1);
    reload(filters);
  }

  if (!costReadEnabled) {
    return (
      <EmptyState
        title="Cost access is not enabled"
        description="Enable the provider's cost-read capability under Access, then run a cost sync to collect spend data."
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
              Period
            </span>
            <div className="flex flex-wrap gap-2">
              {PERIOD_PRESETS.map((preset) => (
                <FilterChip
                  key={preset.id}
                  active={presetId === preset.id}
                  onClick={() => selectPeriod(preset.id)}
                >
                  {preset.label}
                </FilterChip>
              ))}
              <FilterChip
                active={presetId === "custom"}
                onClick={() => selectPeriod("custom")}
              >
                Custom
              </FilterChip>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshAll}
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

        {presetId === "custom" ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Range
            </span>
            <input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(event) => {
                setCustomStart(event.target.value);
                updateCostsUrl({ start: event.target.value || null });
              }}
              className="border-foreground/15 bg-background focus:border-accent h-8 rounded-lg border px-2 text-xs outline-none"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(event) => {
                setCustomEnd(event.target.value);
                updateCostsUrl({ end: event.target.value || null });
              }}
              className="border-foreground/15 bg-background focus:border-accent h-8 rounded-lg border px-2 text-xs outline-none"
            />
          </div>
        ) : null}

        <div className="border-border-soft mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Cost basis
            </span>
            <div className="flex flex-wrap gap-2">
              {COST_BASIS_FILTER_ORDER.map((costBasis) => (
                <FilterChip
                  key={costBasis}
                  active={filters.costBasis === costBasis}
                  onClick={() => selectCostBasis(costBasis)}
                >
                  {costBasisLabel(costBasis)}
                </FilterChip>
              ))}
            </div>
          </div>
          <form
            onSubmit={submitServiceNameFilter}
            className="flex min-w-56 flex-1 items-center gap-2 sm:max-w-sm"
          >
            <span className="sr-only">Service</span>
            <span className="relative block w-full">
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
            <button
              type="submit"
              className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-3 py-2 text-xs font-medium"
            >
              Apply
            </button>
          </form>
        </div>
      </div>

      <CostSummaryTotals
        connectionId={connectionId}
        range={range}
        costBasis={filters.costBasis}
        refreshKey={refreshVersion}
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Service costs</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {visibleCostSummaries.length} in selected period ·{" "}
            {costSummaries.length} of {total} rows loaded
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
            onClick={refreshAll}
            className="font-medium text-amber-700 hover:underline dark:text-amber-300"
          >
            Try again
          </button>
        </div>
      ) : null}

      {visibleCostSummaries.length === 0 ? (
        <EmptyState
          title={
            costSummaries.length
              ? "No costs in this period"
              : "No cost data yet"
          }
          description={
            costSummaries.length
              ? "Choose a wider period or adjust the service and cost-basis filters."
              : "Run a cost sync for this connection to collect provider spend data here."
          }
        />
      ) : (
        <div className="border-border-soft overflow-hidden rounded-2xl border">
          <div className="border-border-soft bg-foreground/[0.025] text-muted-foreground hidden grid-cols-[minmax(12rem,2fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(7rem,0.7fr)] gap-3 border-b px-4 py-3 text-[11px] font-semibold tracking-wide uppercase md:grid">
            <span>Service / period</span>
            <span>Provider / authority</span>
            <span>Basis</span>
            <span className="text-right">Amount</span>
          </div>
          <div className="divide-border-soft divide-y">
            {visibleCostSummaries.map((costSummary) => (
              <CostSummaryRow key={costSummary.id} costSummary={costSummary} />
            ))}
          </div>
        </div>
      )}

      {costSummaries.length < total ? (
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
