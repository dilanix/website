import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listBudgetStatuses, listBudgets } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { BudgetsClient } from "@/components/dashboard/cost/budgets-client";
import { loadCostDataScopeOptions } from "@/components/dashboard/cost/cost-data-scope";

export const metadata: Metadata = {
  title: "Budgets — Cost",
  robots: { index: false, follow: false },
};

export default async function CostBudgetsPage({
  params,
}: PageProps<"/dashboard/products/[slug]/budgets">) {
  const { slug } = await params;
  if (slug !== "cost") notFound();

  const { token, organization } = await requireDashboardOrganization();
  const [{ items }, statuses, { connections, targets }] = await Promise.all([
    listBudgets(organization.organization_id, token),
    // Status is a read-time projection; a failure here must not hide the budgets.
    listBudgetStatuses(organization.organization_id, token).catch(() => ({
      items: [],
    })),
    loadCostDataScopeOptions(organization.organization_id, token),
  ]);

  return (
    <BudgetsClient
      initialBudgets={items}
      initialStatuses={statuses.items}
      connections={connections}
      targets={targets}
    />
  );
}
