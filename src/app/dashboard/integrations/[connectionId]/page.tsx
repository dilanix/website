import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import {
  CoreApiError,
  getConnection,
  getConnectionAwsSetup,
  listIntegrations,
  listIntegrationCapabilities,
  listConnectionCapabilities,
  listConnectionScopes,
  listTargets,
  listSyncRuns,
  listSyncPolicies,
} from "@/lib/core/api";
import { SYNC_RUNS_PAGE_SIZE } from "@/lib/sync/datasets";
import { PageHeader } from "@/components/dashboard/primitives";
import {
  ConnectionDetailClient,
  type ConnectionDetailTab,
} from "@/components/dashboard/connection-detail-client";

export const metadata: Metadata = {
  title: "Connection",
  robots: { index: false, follow: false },
};

export default async function ConnectionDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/integrations/[connectionId]">) {
  const { connectionId } = await params;
  const requestedTab = (await searchParams).tab;
  const initialTab: ConnectionDetailTab =
    typeof requestedTab === "string" &&
    ["overview", "access", "activity", "settings"].includes(requestedTab)
      ? (requestedTab as ConnectionDetailTab)
      : "overview";
  const { token, organization } = await requireDashboardOrganization();

  const connection = await getConnection(
    organization.organization_id,
    connectionId,
    token,
  ).catch((error) => {
    if (error instanceof CoreApiError && error.status === 404) return null;
    throw error;
  });
  if (!connection) notFound();

  const [
    integrations,
    capabilities,
    connectionCapabilities,
    scopes,
    awsSetup,
    targets,
    syncRuns,
    syncPolicies,
  ] = await Promise.all([
    listIntegrations(token),
    listIntegrationCapabilities(connection.integration_id, token),
    listConnectionCapabilities(
      organization.organization_id,
      connectionId,
      token,
      false,
    ),
    listConnectionScopes(organization.organization_id, connectionId, token),
    getConnectionAwsSetup(organization.organization_id, connectionId, token),
    listTargets(organization.organization_id, connectionId, token),
    listSyncRuns(organization.organization_id, connectionId, token, {
      limit: SYNC_RUNS_PAGE_SIZE,
      offset: 0,
    }),
    listSyncPolicies(organization.organization_id, connectionId, token),
  ]);
  const integration =
    integrations.find((item) => item.id === connection.integration_id) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={connection.name}
        description={
          integration
            ? `Connected to ${integration.name}.`
            : "Integration connection."
        }
      />
      <ConnectionDetailClient
        connection={connection}
        integrationName={integration?.name ?? "Cloud provider"}
        initialTab={initialTab}
        capabilities={capabilities}
        initialConnectionCapabilities={connectionCapabilities}
        initialScopes={scopes}
        awsSetup={awsSetup}
        initialTargets={targets}
        initialSyncRuns={syncRuns.items}
        initialSyncTotal={syncRuns.total}
        initialSyncPolicies={syncPolicies.items}
      />
    </div>
  );
}
