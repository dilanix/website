import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseCostDataScope } from "@/lib/billing/cost-data-scope";
import {
  CoreApiError,
  listSavedViews,
  queryCostExplorer,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { CostExplorerClient } from "@/components/dashboard/cost/cost-explorer-client";
import { CostDataScope } from "@/components/dashboard/cost/cost-data-scope";

export const metadata: Metadata = {
  title: "Explorer — Cost",
  robots: { index: false, follow: false },
};

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function ProductExplorerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  if (slug !== "cost") notFound();
  const costDataScope = parseCostDataScope(await searchParams);

  const { token, organization } = await requireDashboardOrganization();
  const now = new Date();
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );

  const [initialResult, savedViews] = await Promise.all([
    queryCostExplorer(organization.organization_id, token, {
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      metric: "effective_cost",
      connection_id: costDataScope.connectionId,
      target_id: costDataScope.targetId,
      granularity: "daily",
      group_by: [{ dimension: "service_name" }],
      scope: [],
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
    listSavedViews(organization.organization_id, token),
  ]);

  return (
    <>
      <CostDataScope
        organizationId={organization.organization_id}
        token={token}
      />
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Cost Explorer
          </h2>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-6">
            Analyze normalized spend across the selected data scope by period,
            metric, dimension, and filters. Amounts in different currencies stay
            separate.
          </p>
        </div>
        {initialResult === null ? (
          <div className="border-border-soft bg-dashboard-panel rounded-2xl border p-8 text-center shadow-[0_16px_44px_var(--shadow-card)]">
            <h3 className="font-semibold">Cost Explorer is unavailable</h3>
            <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm leading-6">
              This organization does not have the FOCUS cost-usage capability
              granted yet. Ask an administrator to enable it and sync the
              billing cost-usage dataset.
            </p>
          </div>
        ) : (
          <CostExplorerClient
            key={`${costDataScope.connectionId ?? "all"}:${costDataScope.targetId ?? "all"}`}
            initialItems={initialResult.items}
            initialPeriodStart={dateInputValue(periodStart)}
            initialPeriodEnd={dateInputValue(now)}
            savedViews={savedViews.items}
            connectionId={costDataScope.connectionId}
            targetId={costDataScope.targetId}
          />
        )}
      </div>
    </>
  );
}
