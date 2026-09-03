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
  listResources,
  listResourceFilters,
  listCostSummaries,
} from "@/lib/core/api";
import { SYNC_RUNS_PAGE_SIZE } from "@/lib/sync/datasets";
import { RESOURCES_PAGE_SIZE } from "@/lib/inventory/resources";
import { COST_SUMMARIES_PAGE_SIZE } from "@/lib/billing/cost-summaries";
import { PageHeader } from "@/components/dashboard/primitives";
import { ConnectionDetailClient } from "@/components/dashboard/connection-detail-client";

export const metadata: Metadata = {
  title: "Connection",
  robots: { index: false, follow: false },
};

export default async function ConnectionDetailPage({
  params,
}: PageProps<"/dashboard/integrations/[connectionId]">) {
  const { connectionId } = await params;
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
    resources,
    resourceFilters,
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
    listResources(organization.organization_id, connectionId, token, {
      limit: RESOURCES_PAGE_SIZE,
      offset: 0,
    }),
    listResourceFilters(organization.organization_id, connectionId, token),
  ]);
  const integration =
    integrations.find((item) => item.id === connection.integration_id) ?? null;

  // Core's cost-summaries read 403s when `billing.read` isn't enabled on this
  // connection (unlike `listResources`, which just returns an empty page) —
  // only attempt the fetch once we already know it will succeed.
  const billingReadEnabled = connectionCapabilities.some(
    (row) => row.enabled && row.capability.slug === "billing.read",
  );
  const costSummaries = billingReadEnabled
    ? await listCostSummaries(
        organization.organization_id,
        connectionId,
        token,
        {
          limit: COST_SUMMARIES_PAGE_SIZE,
          offset: 0,
        },
      )
    : { items: [], total: 0 };

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
        capabilities={capabilities}
        initialConnectionCapabilities={connectionCapabilities}
        initialScopes={scopes}
        awsSetup={awsSetup}
        initialTargets={targets}
        initialSyncRuns={syncRuns.items}
        initialSyncTotal={syncRuns.total}
        initialSyncPolicies={syncPolicies.items}
        initialResources={resources.items}
        initialResourceTotal={resources.total}
        initialResourceFilters={resourceFilters}
        initialCostSummaries={costSummaries.items}
        initialCostSummaryTotal={costSummaries.total}
      />
    </div>
  );
}
