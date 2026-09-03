"use client";
import { type FormEvent, type ReactNode, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import type { CoreCostSummary, CostBasis } from "@/lib/core/api";
import { listCostSummariesAction } from "@/app/dashboard/integrations/actions";
import {
  COST_BASIS_FILTER_ORDER,
  COST_SUMMARIES_PAGE_SIZE,
  costBasisLabel,
  formatCostAmount,
  formatCostPeriod,
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

function CostSummaryRow({ costSummary }: { costSummary: CoreCostSummary }) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{costSummary.service_name}</p>
        <p className="text-muted-foreground mt-0.5 font-mono text-xs">
          {formatCostPeriod(costSummary.period_start, costSummary.period_end)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <StatusBadge status="neutral">
          {costBasisLabel(costSummary.cost_basis)}
        </StatusBadge>
        {costSummary.is_estimated ? (
          <StatusBadge status="warning">Estimated</StatusBadge>
        ) : null}
        <span className="w-24 text-right font-mono text-sm font-medium">
          {formatCostAmount(costSummary.amount, costSummary.currency)}
        </span>
      </div>
    </div>
  );
}

interface CostSummaryFilters {
  costBasis: CostBasis | null;
  serviceName: string;
}

export function CostSummaryPanel({
  connectionId,
  billingReadEnabled,
  initialCostSummaries,
  initialTotal,
}: {
  connectionId: string;
  /** Whether `billing.read` is enabled on this connection — Core's read API
   * 403s rather than returning an empty page when it isn't
   * (`CostSummaryService.list_cost_summaries`), so this panel never even
   * attempts to fetch until it's true. */
  billingReadEnabled: boolean;
  initialCostSummaries: CoreCostSummary[];
  initialTotal: number;
}) {
  const [costSummaries, setCostSummaries] = useState(initialCostSummaries);
  const [total, setTotal] = useState(initialTotal);
  const [filters, setFilters] = useState<CostSummaryFilters>({
    costBasis: null,
    serviceName: "",
  });
  const [serviceNameInput, setServiceNameInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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

  function selectCostBasis(next: CostBasis | null) {
    const nextFilters = { ...filters, costBasis: next };
    setFilters(nextFilters);
    reload(nextFilters);
  }

  function submitServiceNameFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters = { ...filters, serviceName: serviceNameInput.trim() };
    setFilters(nextFilters);
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

  if (!billingReadEnabled) {
    return (
      <EmptyState
        title="Billing read is not enabled"
        description="Enable the Billing Read capability on this connection's Capabilities tab, then run a billing sync to see AWS Cost Explorer data here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <CostSummaryTotals connectionId={connectionId} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Cost basis
            </span>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={filters.costBasis === null}
                onClick={() => selectCostBasis(null)}
              >
                All
              </FilterChip>
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
            className="flex items-center gap-2"
          >
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Service
            </span>
            <input
              value={serviceNameInput}
              onChange={(event) => setServiceNameInput(event.target.value)}
              placeholder="e.g. Amazon EC2"
              className="border-foreground/15 bg-background focus:border-accent h-8 w-44 rounded-lg border px-2.5 text-xs outline-none"
            />
          </form>
        </div>
        <button
          onClick={() => reload(filters)}
          disabled={refreshing}
          className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            className={refreshing ? "animate-spin" : undefined}
          />
          Refresh
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {costSummaries.length === 0 ? (
        <EmptyState
          title="No cost data yet"
          description="Run a billing sync for this connection to collect AWS Cost Explorer data here."
        />
      ) : (
        <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
          {costSummaries.map((costSummary) => (
            <CostSummaryRow key={costSummary.id} costSummary={costSummary} />
          ))}
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
