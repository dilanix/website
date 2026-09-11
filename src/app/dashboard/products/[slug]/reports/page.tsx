import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listReports } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { ReportsClient } from "@/components/dashboard/cost/reports-client";

export const metadata: Metadata = {
  title: "Reports — Cost",
  robots: { index: false, follow: false },
};

export default async function CostReportsPage({
  params,
}: PageProps<"/dashboard/products/[slug]/reports">) {
  const { slug } = await params;
  if (slug !== "cost") notFound();

  const { token, organization } = await requireDashboardOrganization();
  const { items } = await listReports(organization.organization_id, token);

  return <ReportsClient initialReports={items} />;
}
