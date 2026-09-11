import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseCostDataScope } from "@/lib/billing/cost-data-scope";
import {
  CoreApiError,
  getAllocationBreakdown,
  listAllocations,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { AllocationsClient } from "@/components/dashboard/cost/allocations-client";
import { CostDataScope } from "@/components/dashboard/cost/cost-data-scope";

export const metadata: Metadata = {
  title: "Allocations — Cost",
  robots: { index: false, follow: false },
};

export default async function CostAllocationsPage({
  params,
  searchParams,
}: PageProps<"/dashboard/products/[slug]/allocations">) {
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
  const [allocations, initialBreakdown] = await Promise.all([
    listAllocations(organization.organization_id, token),
    getAllocationBreakdown(organization.organization_id, token, {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      metric: "effective_cost",
      connectionId: costDataScope.connectionId,
      targetId: costDataScope.targetId,
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
  ]);

  return (
    <>
      <CostDataScope
        organizationId={organization.organization_id}
        token={token}
      />
      <AllocationsClient
        key={`${costDataScope.connectionId ?? "all"}:${costDataScope.targetId ?? "all"}`}
        initialAllocations={allocations.items}
        initialBreakdown={initialBreakdown}
        initialPeriodStart={periodStart.toISOString().slice(0, 10)}
        initialPeriodEnd={now.toISOString().slice(0, 10)}
        connectionId={costDataScope.connectionId}
        targetId={costDataScope.targetId}
      />
    </>
  );
}
