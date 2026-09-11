import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listAllocations } from "@/lib/core/api";
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
  const { items } = await listAllocations(organization.organization_id, token);

  return <AllocationsClient initialAllocations={items} />;
}
