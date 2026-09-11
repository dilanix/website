import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listBudgets } from "@/lib/core/api";
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
  const { items } = await listBudgets(organization.organization_id, token);

  return <BudgetsClient initialBudgets={items} />;
}
