import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseCostDataScope } from "@/lib/billing/cost-data-scope";
import {
  getAnomalyNotificationSettings,
  listAnomalies,
  listNotificationChannels,
  listNotificationDestinations,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { AnomaliesClient } from "@/components/dashboard/cost/anomalies-client";
import {
  costTargetLabels,
  loadCostDataScopeOptions,
} from "@/components/dashboard/cost/cost-data-scope";
import { CostDataScopeSelector } from "@/components/dashboard/cost/cost-data-scope-selector";

export const metadata: Metadata = {
  title: "Anomalies — Cost",
  robots: { index: false, follow: false },
};

export default async function CostAnomaliesPage({
  params,
  searchParams,
}: PageProps<"/dashboard/products/[slug]/anomalies">) {
  const { slug } = await params;
  if (slug !== "cost") notFound();
  const { connectionId, targetId } = parseCostDataScope(await searchParams);

  const { token, organization } = await requireDashboardOrganization();
  const organizationId = organization.organization_id;
  const [
    { items },
    notificationSettings,
    { items: channels },
    { items: destinations },
    scopeOptions,
  ] = await Promise.all([
    listAnomalies(organizationId, token, { connectionId, targetId }),
    getAnomalyNotificationSettings(organizationId, token),
    listNotificationChannels(organizationId, token),
    listNotificationDestinations(organizationId, token),
    loadCostDataScopeOptions(organizationId, token),
  ]);

  return (
    <>
      <CostDataScopeSelector
        connections={scopeOptions.connections}
        targets={scopeOptions.targets}
      />
      <AnomaliesClient
        // Another connection/target is another list, not an update of this one.
        key={`${connectionId}:${targetId}`}
        initialAnomalies={items}
        accountLabels={costTargetLabels(
          scopeOptions.connections,
          scopeOptions.targets,
        )}
        notificationSettings={notificationSettings}
        channels={channels}
        destinations={destinations}
      />
    </>
  );
}
