"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import type { CoreAllocationBreakdown, CostUsageMetric } from "@/lib/core/api";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { StatCard } from "@/components/dashboard/stat-card";

const METRIC_LABELS: Record<CostUsageMetric, string> = {
  billed_cost: "Billed cost",
  effective_cost: "Effective cost",
  list_cost: "List cost",
  contracted_cost: "Contracted cost",
};

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function AllocationBreakdownPanel({
  breakdown,
  available,
  periodStart,
  periodEnd,
  metric,
  resultMetric,
  pending,
  error,
  onPeriodStartChange,
  onPeriodEndChange,
  onMetricChange,
  onRun,
}: {
  breakdown: CoreAllocationBreakdown | null;
  available: boolean;
  periodStart: string;
  periodEnd: string;
  metric: CostUsageMetric;
  resultMetric: CostUsageMetric;
  pending: boolean;
  error: string;
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onMetricChange: (value: CostUsageMetric) => void;
  onRun: () => void;
}) {
  const currencies = useMemo(() => {
    if (!breakdown) return [];
    const result = new Map<string, { total: number; unallocated: number }>();
    for (const item of breakdown.items) {
      const current = result.get(item.currency) ?? {
        total: 0,
        unallocated: 0,
      };
      const amount = Number(item.amount);
      current.total += amount;
      if (item.target_label === "Unallocated") current.unallocated += amount;
      result.set(item.currency, current);
    }
    return [...result.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [breakdown]);

  const maxAmount = Math.max(
    ...(breakdown?.items.map((item) => Math.abs(Number(item.amount))) ?? []),
    0,
  );
  const displayItems = useMemo(
    () =>
      [...(breakdown?.items ?? [])].sort((left, right) => {
        const currencyOrder = left.currency.localeCompare(right.currency);
        if (currencyOrder !== 0) return currencyOrder;
        if (left.target_label === "Unallocated") return 1;
        if (right.target_label === "Unallocated") return -1;
        return Number(right.amount) - Number(left.amount);
      }),
    [breakdown],
  );

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Allocation breakdown
        </h2>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-6">
          Showback/chargeback totals over raw charges. The first enabled rule in
          ascending priority order claims each charge once; unmatched charges
          remain Unallocated.
        </p>
      </div>

      {!available ? (
        <EmptyState
          title="Allocation breakdown is unavailable"
          description="This organization does not have the FOCUS cost-usage capability granted yet. Rules can still be managed below."
        />
      ) : (
        <>
          <div className="border-border-soft bg-dashboard-panel grid gap-3 rounded-2xl border p-4 shadow-[0_16px_44px_var(--shadow-card)] sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Start date</span>
              <input
                type="date"
                value={periodStart}
                max={periodEnd}
                onChange={(event) => onPeriodStartChange(event.target.value)}
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">End date</span>
              <input
                type="date"
                value={periodEnd}
                min={periodStart}
                onChange={(event) => onPeriodEndChange(event.target.value)}
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Metric</span>
              <select
                value={metric}
                onChange={(event) =>
                  onMetricChange(event.target.value as CostUsageMetric)
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
            <button
              type="button"
              onClick={onRun}
              disabled={pending}
              className="bg-accent text-accent-foreground mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw size={14} className={pending ? "animate-spin" : ""} />
              {pending ? "Calculating…" : "Run breakdown"}
            </button>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          ) : null}

          {!breakdown || breakdown.items.length === 0 ? (
            <EmptyState
              title="No charges for this period"
              description="Choose a wider period or sync the billing cost-usage dataset."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {currencies.flatMap(([currency, values]) => {
                  const allocated = values.total - values.unallocated;
                  const coverage = values.total
                    ? (allocated / values.total) * 100
                    : 0;
                  return [
                    <StatCard
                      key={`${currency}-total`}
                      label={`${METRIC_LABELS[resultMetric]} · ${currency}`}
                      value={formatAmount(values.total, currency)}
                    />,
                    <StatCard
                      key={`${currency}-allocated`}
                      label={`Allocated · ${currency}`}
                      tone={values.unallocated === 0 ? "success" : "default"}
                      value={
                        <>
                          <span className="block">
                            {formatAmount(allocated, currency)}
                          </span>
                          <span className="mt-1 block text-xs font-normal tracking-normal">
                            {coverage.toFixed(1)}% of total
                          </span>
                        </>
                      }
                    />,
                  ];
                })}
              </div>

              <div className="border-border-soft bg-dashboard-panel overflow-x-auto rounded-2xl border shadow-[0_16px_44px_var(--shadow-card)]">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead>
                    <tr className="border-foreground/10 border-b">
                      <th className="text-muted-foreground px-4 py-3 font-medium">
                        Target
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-right font-medium">
                        Amount
                      </th>
                      <th className="text-muted-foreground px-4 py-3 text-right font-medium">
                        Share
                      </th>
                      <th className="text-muted-foreground w-40 px-4 py-3 font-medium">
                        Relative cost
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.map((item) => {
                      const amount = Number(item.amount);
                      const currencyTotal =
                        currencies.find(
                          ([currency]) => currency === item.currency,
                        )?.[1].total ?? 0;
                      const unallocated = item.target_label === "Unallocated";
                      return (
                        <tr
                          key={`${item.target_label}-${item.currency}`}
                          className="border-foreground/5 border-b last:border-0"
                        >
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              <span className="font-medium">
                                {item.target_label}
                              </span>
                              {unallocated ? (
                                <StatusBadge status="warning">
                                  Needs allocation
                                </StatusBadge>
                              ) : null}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                            {formatAmount(amount, item.currency)}
                          </td>
                          <td className="text-muted-foreground px-4 py-3 text-right font-mono text-xs">
                            {currencyTotal
                              ? `${((amount / currencyTotal) * 100).toFixed(1)}%`
                              : "0.0%"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-foreground/5 block h-1.5 overflow-hidden rounded-full">
                              <span
                                className={
                                  unallocated
                                    ? "block h-full rounded-full bg-amber-500"
                                    : "bg-accent block h-full rounded-full"
                                }
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
            </>
          )}
        </>
      )}
    </section>
  );
}
