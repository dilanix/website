import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CoreApiError,
  getAnomaly,
  getAnomalyBreakdown,
  type CoreAnomalyBreakdown,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { AnomalyDetailClient } from "@/components/dashboard/cost/anomaly-detail-client";

export const metadata: Metadata = {
  title: "Anomaly — Cost",
  robots: { index: false, follow: false },
};

export default async function CostAnomalyDetailPage({
  params,
}: PageProps<"/dashboard/products/[slug]/anomalies/[anomalyId]">) {
  const { slug, anomalyId } = await params;
  if (slug !== "cost") notFound();

  const { token, organization } = await requireDashboardOrganization();
  const organizationId = organization.organization_id;
  const anomaly = await getAnomaly(organizationId, anomalyId, token).catch(
    (error) => {
      if (error instanceof CoreApiError && [404, 422].includes(error.status))
        return null;
      throw error;
    },
  );
  if (!anomaly) notFound();

  // The breakdown reads live Billing data; the anomaly itself still renders
  // when that read fails.
  let breakdown: CoreAnomalyBreakdown | null = null;
  let breakdownError = "";
  try {
    breakdown = await getAnomalyBreakdown(organizationId, anomalyId, token);
  } catch (error) {
    breakdownError =
      error instanceof Error ? error.message : "Breakdown is unavailable.";
  }

  return (
    <AnomalyDetailClient
      initialAnomaly={anomaly}
      breakdown={breakdown}
      breakdownError={breakdownError}
    />
  );
}
