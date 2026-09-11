import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CoreApiError,
  getAllocationBreakdown,
  listAllocations,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { AllocationsClient } from "@/components/dashboard/cost/allocations-client";

export const metadata: Metadata = {
  title: "Allocations — Cost",
  robots: { index: false, follow: false },
};

export default async function CostAllocationsPage({
  params,
}: PageProps<"/dashboard/products/[slug]/allocations">) {
  const { slug } = await params;
  if (slug !== "cost") notFound();

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
    <AllocationsClient
      initialAllocations={allocations.items}
      initialBreakdown={initialBreakdown}
      initialPeriodStart={periodStart.toISOString().slice(0, 10)}
      initialPeriodEnd={now.toISOString().slice(0, 10)}
    />
  );
}
