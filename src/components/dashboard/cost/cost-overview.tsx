import { Fragment } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  Bookmark,
  CircleDollarSign,
  FileText,
  Minus,
  Tags,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import {
  CoreApiError,
  getCostOverview,
  getUnifiedCostTotals,
  listAllocations,
  listAnomalies,
  listBudgets,
  listReports,
  listSavedViews,
  type CoreUnifiedCostTotals,
} from "@/lib/core/api";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currency}`;
}

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
  const now = new Date();
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const scopeQuery = new URLSearchParams();
  if (connectionId) scopeQuery.set("connection", connectionId);
  if (targetId) scopeQuery.set("target", targetId);
  const scopeSuffix = scopeQuery.size ? `?${scopeQuery.toString()}` : "";
  const [overview, budgets, allocations, anomalies, savedViews, reports, unifiedTotals] =
    await Promise.all([
      getCostOverview(organizationId, token, {
        periodStart: periodStart.toISOString(),
        periodEnd: now.toISOString(),
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
      // Only available for a single selected connection — AWS Cost Explorer
      // has no cross-account aggregate, unlike the org-wide FOCUS overview above.
      connectionId
        ? getUnifiedCostTotals(organizationId, connectionId, token, {
            periodStart: periodStart.toISOString(),
            periodEnd: now.toISOString(),
            targetId,
          }).catch((): CoreUnifiedCostTotals | null => null)
        : Promise.resolve<CoreUnifiedCostTotals | null>(null),
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
      <div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Spend overview
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Current calendar month compared with the immediately preceding
              period of equal length. Includes provider credits and
              discounts — for an AWS Console-style total with credits
              excluded, see{" "}
              <Link
                href={`/dashboard/costs${scopeSuffix}` as Route}
                className="text-accent font-medium"
              >
                Dashboard → Costs
              </Link>
              .
            </p>
          </div>
          <Link
            href={`/dashboard/products/cost/explorer${scopeSuffix}` as Route}
            className="text-accent inline-flex items-center gap-1 text-xs font-semibold"
          >
            Open Explorer <ArrowRight size={13} />
          </Link>
        </div>

        {overview === null ? (
          <div className="mt-4">
            <EmptyState
              title="Cost analytics is unavailable"
              description="This organization does not have the FOCUS cost-usage capability granted yet. Existing budgets, anomalies, and other cost-management configuration remain available below."
            />
          </div>
        ) : overview.by_currency.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No cost data this month"
              description="Run a billing sync for a connected provider, then return here to see organization-wide spend."
            />
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {overview.by_currency.map((currency) => {
                const change = currency.change_percent;
                const ChangeIcon =
                  change === null || change === 0
                    ? Minus
                    : change > 0
                      ? TrendingUp
                      : TrendingDown;
                return (
                  <StatCard
                    key={currency.currency}
                    label={`${currency.currency} spend this month`}
                    tone={change !== null && change < 0 ? "success" : "default"}
                    value={
                      <>
                        <span className="block">
                          {formatAmount(
                            Number(currency.current_total),
                            currency.currency,
                          )}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-xs font-normal tracking-normal">
                          <ChangeIcon size={12} />
                          {change === null
                            ? "No previous spend"
                            : `${Math.abs(change).toFixed(1)}% vs previous period`}
                        </span>
                      </>
                    }
                  />
                );
              })}
            </div>

            {unifiedTotals ? (
              <div className="border-border-soft bg-dashboard-panel mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-[0_16px_44px_var(--shadow-card)]">
                <div>
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                    AWS Console-style total · this connection
                  </p>
                  <p className="mt-0.5 text-sm font-medium">
                    {unifiedTotals.currency
                      ? formatAmount(
                          Number(unifiedTotals.total_amount),
                          unifiedTotals.currency,
                        )
                      : "No data"}{" "}
                    <span className="text-muted-foreground font-normal">
                      (credits excluded)
                    </span>
                  </p>
                </div>
                <Link
                  href={`/dashboard/costs${scopeSuffix}` as Route}
                  className="text-accent inline-flex items-center gap-1 text-xs font-semibold"
                >
                  Full breakdown <ArrowRight size={13} />
                </Link>
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {overview.by_currency.map((currency) => {
                const otherAmount = Number(currency.other_total);
                const maxServiceAmount = Math.max(
                  ...currency.top_services.map((service) =>
                    Math.abs(Number(service.amount)),
                  ),
                  Math.abs(otherAmount),
                  1,
                );
                const maxCategoryAmount = Math.max(
                  ...currency.by_charge_category.map((item) =>
                    Math.abs(Number(item.amount)),
                  ),
                  1,
                );
                return (
                  <Fragment key={currency.currency}>
                    <div className="border-border-soft bg-dashboard-panel rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
                      <h3 className="text-sm font-semibold">
                        Top services · {currency.currency}
                      </h3>
                      {currency.top_services.length === 0 ? (
                        <p className="text-muted-foreground mt-3 text-sm">
                          No service breakdown is available.
                        </p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {currency.top_services.map((service, index) => {
                            const amount = Number(service.amount);
                            return (
                              <div
                                key={`${service.service_name ?? "unassigned"}-${index}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
                              >
                                <span className="truncate text-xs font-medium">
                                  {service.service_name ?? "Unassigned service"}
                                </span>
                                <span className="font-mono text-xs">
                                  {formatAmount(amount, currency.currency)}
                                </span>
                                <span className="bg-foreground/5 col-span-2 h-1.5 overflow-hidden rounded-full">
                                  <span
                                    className="bg-accent block h-full rounded-full"
                                    style={{
                                      width: `${(Math.abs(amount) / maxServiceAmount) * 100}%`,
                                      opacity: 1 - index * 0.12,
                                    }}
                                  />
                                </span>
                              </div>
                            );
                          })}
                          {otherAmount !== 0 ? (
                            <div className="border-foreground/10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t pt-3">
                              <span className="text-muted-foreground truncate text-xs font-medium">
                                Other services &amp; credits
                              </span>
                              <span className="text-muted-foreground font-mono text-xs">
                                {formatAmount(otherAmount, currency.currency)}
                              </span>
                              <span className="bg-foreground/5 col-span-2 h-1.5 overflow-hidden rounded-full">
                                <span
                                  className="bg-foreground/30 block h-full rounded-full"
                                  style={{
                                    width: `${(Math.abs(otherAmount) / maxServiceAmount) * 100}%`,
                                  }}
                                />
                              </span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="border-border-soft bg-dashboard-panel rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
                      <h3 className="text-sm font-semibold">
                        By charge type · {currency.currency}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Usage minus credits/discounts nets to the total above.
                      </p>
                      {currency.by_charge_category.length === 0 ? (
                        <p className="text-muted-foreground mt-3 text-sm">
                          No charge-type breakdown is available.
                        </p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {currency.by_charge_category.map((item) => {
                            const amount = Number(item.amount);
                            return (
                              <div
                                key={item.category}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
                              >
                                <span className="truncate text-xs font-medium">
                                  {item.category}
                                </span>
                                <span
                                  className={`font-mono text-xs ${amount < 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                                >
                                  {formatAmount(amount, currency.currency)}
                                </span>
                                <span className="bg-foreground/5 col-span-2 h-1.5 overflow-hidden rounded-full">
                                  <span
                                    className={`block h-full rounded-full ${amount < 0 ? "bg-emerald-500" : "bg-accent"}`}
                                    style={{
                                      width: `${(Math.abs(amount) / maxCategoryAmount) * 100}%`,
                                    }}
                                  />
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </>
        )}
      </div>

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
