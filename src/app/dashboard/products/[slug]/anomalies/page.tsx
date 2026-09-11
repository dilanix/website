import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listAnomalies } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { AnomaliesClient } from "@/components/dashboard/cost/anomalies-client";

export const metadata: Metadata = {
  title: "Anomalies — Cost",
  robots: { index: false, follow: false },
};

export default async function CostAnomaliesPage({
  params,
}: PageProps<"/dashboard/products/[slug]/anomalies">) {
  const { slug } = await params;
  if (slug !== "cost") notFound();

  const { token, organization } = await requireDashboardOrganization();
  const { items } = await listAnomalies(organization.organization_id, token);

  return <AnomaliesClient initialAnomalies={items} />;
}
