import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  listBudgetStatuses,
  listBudgets,
  listNotificationChannels,
  listNotificationDestinations,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { BudgetsClient } from "@/components/dashboard/cost/budgets-client";

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
  const [{ items }, statuses, { items: channels }, { items: destinations }] =
    await Promise.all([
      listBudgets(organization.organization_id, token),
      // Status is a read-time projection; a failure here must not hide the budgets.
      listBudgetStatuses(organization.organization_id, token).catch(() => ({
        items: [],
      })),
      listNotificationChannels(organization.organization_id, token),
      listNotificationDestinations(organization.organization_id, token),
    ]);

  return (
    <BudgetsClient
      initialBudgets={items}
      initialStatuses={statuses.items}
      channels={channels}
      destinations={destinations}
    />
  );
}
