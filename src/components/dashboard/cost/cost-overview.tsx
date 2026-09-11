import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  Bookmark,
  CircleDollarSign,
  FileText,
  Tags,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import {
  CoreApiError,
  getCostOverview,
  listAllocations,
  listAnomalies,
  listBudgets,
  listReports,
  listSavedViews,
  queryCostExplorer,
} from "@/lib/core/api";
import { presetRange } from "@/lib/billing/cost-summaries";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/primitives";
import { SpendOverviewClient } from "@/components/dashboard/cost/spend-overview-client";
import { formatAmount } from "@/components/dashboard/cost/format";

export async function CostOverview({
  organizationId,
  token,
  connectionId,
  targetId,
}: {
  organizationId: string;
  token: string;
  connectionId: string | null;
  targetId: string | null;
}) {
  // "30d" (a rolling window, not calendar-month-to-date) matches the default
  // `SpendOverviewClient` itself renders, so the first paint never mismatches
  // what a client-side re-query for the same default would produce.
  const initialRange = presetRange("30d");
  const scopeQuery = new URLSearchParams();
  if (connectionId) scopeQuery.set("connection", connectionId);
  if (targetId) scopeQuery.set("target", targetId);
  const scopeSuffix = scopeQuery.size ? `?${scopeQuery.toString()}` : "";
  const periodStartIso = initialRange.start.toISOString();
  const periodEndIso = initialRange.end.toISOString();
  const [
    overview,
    budgets,
    allocations,
    anomalies,
    savedViews,
    reports,
    trend,
  ] = await Promise.all([
    getCostOverview(organizationId, token, {
      periodStart: periodStartIso,
      periodEnd: periodEndIso,
      connectionId,
      targetId,
      topN: 5,
    }).catch((error: unknown) => {
      if (
        error instanceof CoreApiError &&
        error.status === 403 &&
        error.message.includes("aws.billing.cost_usage")
      ) {
        return null;
      }
      throw error;
    }),
    listBudgets(organizationId, token),
    listAllocations(organizationId, token),
    listAnomalies(organizationId, token),
    listSavedViews(organizationId, token),
    listReports(organizationId, token),
    // Same product API as the overview above (`cost/explorer/query`) — the
    // trend chart never reaches into `billing`'s own Cost-Explorer-sourced
    // surface, which belongs to `/dashboard/costs`, not this product.
    queryCostExplorer(organizationId, token, {
      period_start: periodStartIso,
      period_end: periodEndIso,
      metric: "effective_cost",
      connection_id: connectionId,
      target_id: targetId,
      granularity: "daily",
      group_by: [],
      scope: [],
    }).catch(() => ({ items: [] })),
  ]);

  const enabledBudgets = budgets.items.filter((budget) => budget.enabled);
  const budgetedByCurrency = new Map<string, number>();
  for (const budget of enabledBudgets) {
    budgetedByCurrency.set(
      budget.currency,
      (budgetedByCurrency.get(budget.currency) ?? 0) + Number(budget.amount),
    );
  }
  const budgetsAtRisk = budgets.items.filter(
    (budget) => budget.enabled && budget.notified_thresholds.length > 0,
  ).length;

  const openAnomalies = anomalies.items.filter(
    (anomaly) => anomaly.status === "open",
  );
  const recentAnomalies = anomalies.items.slice(0, 5);
  const enabledAllocations = allocations.items.filter(
    (allocation) => allocation.enabled,
  ).length;

  const quickLinks = [
    {
      href: "budgets" as const,
      title: "Budgets",
      description: `${budgets.items.length} defined, ${enabledBudgets.length} active`,
      icon: Wallet,
      iconClassName: "border-cyan-500/20 bg-cyan-500/10 text-cyan-500",
    },
    {
      href: "allocations" as const,
      title: "Allocations",
      description: `${allocations.items.length} defined, ${enabledAllocations} enabled`,
      icon: Tags,
      iconClassName: "border-violet-500/20 bg-violet-500/10 text-violet-500",
    },
    {
      href: "anomalies" as const,
      title: "Anomalies",
      description: `${openAnomalies.length} open`,
      icon: TriangleAlert,
      iconClassName: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    },
    {
      href: "saved-views" as const,
      title: "Saved Views",
      description: `${savedViews.items.length} saved`,
      icon: Bookmark,
      iconClassName: "border-blue-500/20 bg-blue-500/10 text-blue-500",
    },
    {
      href: "reports" as const,
      title: "Reports",
      description: `${reports.items.length} defined`,
      icon: FileText,
      iconClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <SpendOverviewClient
        initialOverview={overview}
        initialTrendPoints={trend.items}
        initialRange={initialRange}
        connectionId={connectionId}
        targetId={targetId}
        scopeSuffix={scopeSuffix}
      />

      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Cost management
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Budgeted spend"
            value={
              budgetedByCurrency.size === 0 ? (
                "—"
              ) : (
                <span className="text-lg">
                  {[...budgetedByCurrency.entries()]
                    .map(([currency, amount]) => formatAmount(amount, currency))
                    .join(" + ")}
                </span>
              )
            }
          />
          <StatCard
            label="Budgets at risk"
            tone={budgetsAtRisk > 0 ? "default" : "success"}
            value={budgetsAtRisk}
          />
          <StatCard
            label="Open anomalies"
            tone={openAnomalies.length > 0 ? "default" : "success"}
            value={openAnomalies.length}
          />
          <StatCard label="Allocations enabled" value={enabledAllocations} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Quick access</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={
                  `/dashboard/products/cost/${item.href}${scopeSuffix}` as Route
                }
                className="group border-border-soft bg-dashboard-panel hover:border-accent/30 flex items-center gap-3 rounded-2xl border p-4 shadow-[0_16px_44px_var(--shadow-card)] transition-all"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${item.iconClassName}`}
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {item.title}
                  </span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {item.description}
                  </span>
                </span>
                <ArrowRight
                  size={14}
                  className="text-muted-foreground shrink-0 opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-90"
                />
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Recent anomalies
        </h2>
        {recentAnomalies.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">
            No anomalies detected yet — checked hourly against a trailing 7-day
            spend average.
          </p>
        ) : (
          <ul className="border-border-soft mt-4 divide-y rounded-xl border">
            {recentAnomalies.map((anomaly) => (
              <li
                key={anomaly.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="flex min-w-0 items-center gap-2.5 text-sm">
                  <CircleDollarSign
                    size={14}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="truncate">
                    {Number(anomaly.actual_amount).toLocaleString("en-US")}{" "}
                    {anomaly.currency} vs.{" "}
                    {Number(anomaly.expected_amount).toLocaleString("en-US")}{" "}
                    expected ({Number(anomaly.deviation_percent).toFixed(0)}%)
                  </span>
                </span>
                <StatusBadge
                  status={
                    anomaly.status === "resolved"
                      ? "success"
                      : anomaly.status === "open"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {anomaly.status}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
