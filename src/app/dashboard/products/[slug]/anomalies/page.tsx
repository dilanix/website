import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAnomalyNotificationSettings,
  listAnomalies,
  listNotificationChannels,
  listNotificationDestinations,
} from "@/lib/core/api";
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
  const organizationId = organization.organization_id;
  const [
    { items },
    notificationSettings,
    { items: channels },
    { items: destinations },
  ] = await Promise.all([
    listAnomalies(organizationId, token),
    getAnomalyNotificationSettings(organizationId, token),
    listNotificationChannels(organizationId, token),
    listNotificationDestinations(organizationId, token),
  ]);

  return (
    <AnomaliesClient
      initialAnomalies={items}
      notificationSettings={notificationSettings}
      channels={channels}
      destinations={destinations}
    />
  );
}
