import type { Metadata } from "next";
import {
  getSyncHealth,
  listConnectionCapabilities,
  listConnections,
  listIntegrationCapabilities,
  listIntegrations,
  listOrganizationCapabilities,
  listSyncPolicies,
  listSyncRuns,
  listTargets,
  type CoreIntegrationCapability,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { SYNC_RUNS_PAGE_SIZE } from "@/lib/sync/datasets";
import { enabledSyncCapabilitySlugs } from "@/lib/sync/overview";
import { PageHeader } from "@/components/dashboard/primitives";
import { GuideButton } from "@/components/guides/guide-button";
import { SYNC_GUIDE_KEY } from "@/lib/guides/definitions/sync";
import { syncAnchors } from "@/lib/tours/definitions/sync";
import {
  SyncOverviewClient,
  type ConnectionSyncData,
} from "@/components/dashboard/sync-overview-client";

export const metadata: Metadata = {
  title: "Sync",
  robots: { index: false, follow: false },
};

export default async function SyncPage() {
  const { token, organization } = await requireDashboardOrganization();
  const organizationId = organization.organization_id;
  const [connections, integrations, organizationCapabilities] =
    await Promise.all([
      listConnections(organizationId, token),
      listIntegrations(token),
      listOrganizationCapabilities(organizationId, token),
    ]);
  const activeOrganizationCapabilityCodes = organizationCapabilities
    .filter((capability) => capability.access_status === "active")
    .map((capability) => capability.code);

  const capabilitiesByIntegration = new Map<
    string,
    Promise<CoreIntegrationCapability[]>
  >();
  function integrationCapabilities(integrationId: string) {
    if (!capabilitiesByIntegration.has(integrationId))
      capabilitiesByIntegration.set(
        integrationId,
        listIntegrationCapabilities(integrationId, token),
      );
    return capabilitiesByIntegration.get(integrationId)!;
  }

  // One connection that can't be read never hides the others.
  const items: ConnectionSyncData[] = await Promise.all(
    connections.map(async (connection) => {
      const integration = integrations.find(
        (item) => item.id === connection.integration_id,
      );
      const base = {
        connection,
        integrationName: integration?.name ?? "Cloud provider",
        integrationSlug: integration?.slug ?? "",
      };
      try {
        const [
          capabilities,
          connectionCapabilities,
          targets,
          runs,
          policies,
          health,
        ] = await Promise.all([
          integrationCapabilities(connection.integration_id),
          listConnectionCapabilities(organizationId, connection.id, token),
          listTargets(organizationId, connection.id, token),
          listSyncRuns(organizationId, connection.id, token, {
            limit: SYNC_RUNS_PAGE_SIZE,
            offset: 0,
          }),
          listSyncPolicies(organizationId, connection.id, token),
          getSyncHealth(organizationId, connection.id, token),
        ]);
        return {
          ...base,
          error: null,
          enabledCapabilitySlugs: enabledSyncCapabilitySlugs({
            integrationSlug: base.integrationSlug,
            capabilities,
            connectionCapabilities,
            activeOrganizationCapabilityCodes,
          }),
          targets,
          runs: runs.items,
          runsTotal: runs.total,
          policies: policies.items,
          health: health.items,
        };
      } catch {
        return {
          ...base,
          error: "This connection's sync status could not be loaded.",
          enabledCapabilitySlugs: [],
          targets: [],
          runs: [],
          runsTotal: 0,
          policies: [],
          health: [],
        };
      }
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Manage"
        title="Sync"
        description="Every cloud connection's data sync in one place — what is running, what is healthy, and what needs attention."
        action={
          <GuideButton
            guideKey={SYNC_GUIDE_KEY}
            anchor={syncAnchors.howItWorks}
          />
        }
      />
      <SyncOverviewClient
        items={items}
        activeOrganizationCapabilityCodes={activeOrganizationCapabilityCodes}
      />
    </div>
  );
}
