import type { Metadata } from "next";
import {
  listIntegrations,
  listConnections,
  listOrganizationCapabilities,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { PageHeader } from "@/components/dashboard/primitives";
import { IntegrationsClient } from "@/components/dashboard/integrations-client";
import { GuideButton } from "@/components/guides/guide-button";
import { INTEGRATIONS_GUIDE_KEY } from "@/lib/guides/definitions/integrations";
import { integrationsAnchors } from "@/lib/tours/definitions/integrations";

export const metadata: Metadata = {
  title: "Integrations",
  robots: { index: false, follow: false },
};

export default async function IntegrationsPage() {
  const { token, organization } = await requireDashboardOrganization();
  const [integrations, connections, organizationCapabilities] =
    await Promise.all([
      listIntegrations(token, "active"),
      listConnections(organization.organization_id, token),
      listOrganizationCapabilities(organization.organization_id, token),
    ]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Integrations"
        description="Connect cloud providers and manage the accounts, subscriptions, and projects that supply data to Dilanix."
        action={
          <GuideButton
            guideKey={INTEGRATIONS_GUIDE_KEY}
            anchor={integrationsAnchors.howItWorks}
          />
        }
      />
      <IntegrationsClient
        integrations={integrations}
        initialConnections={connections}
        organizationCapabilities={organizationCapabilities}
      />
    </div>
  );
}
