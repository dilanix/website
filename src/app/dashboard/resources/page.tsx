import type { Metadata } from "next";
import Link from "next/link";
import {
  listConnections,
  listConnectionCapabilities,
  listIntegrations,
  listOrganizationCapabilities,
  listResourceFilters,
  listResources,
  integrationCapabilityCode,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { RESOURCES_PAGE_SIZE } from "@/lib/inventory/resources";
import { CloudConnectionSelector } from "@/components/dashboard/cloud-connection-selector";
import {
  EmptyState,
  PageHeader,
  Section,
} from "@/components/dashboard/primitives";
import {
  ResourcePanel,
  type ResourceSortKey,
} from "@/components/dashboard/resource-panel";

export const metadata: Metadata = {
  title: "Resources",
  robots: { index: false, follow: false },
};

function requestedConnectionId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{
    connection?: string | string[];
    category?: string | string[];
    type?: string | string[];
    region?: string | string[];
    lifecycle?: string | string[];
    q?: string | string[];
    sort?: string | string[];
    direction?: string | string[];
  }>;
}) {
  const { token, organization } = await requireDashboardOrganization();
  const [integrations, connections, organizationCapabilities] =
    await Promise.all([
      listIntegrations(token),
      listConnections(organization.organization_id, token),
      listOrganizationCapabilities(organization.organization_id, token),
    ]);
  const activeOrganizationCapabilities = new Set(
    organizationCapabilities
      .filter((capability) => capability.access_status === "active")
      .map((capability) => capability.code),
  );
  const integrationsById = new Map(
    integrations.map((integration) => [integration.id, integration]),
  );
  const resourceConnections = connections.filter((connection) => {
    const providerSlug = integrationsById.get(connection.integration_id)?.slug;
    return Boolean(
      providerSlug &&
      activeOrganizationCapabilities.has(
        integrationCapabilityCode(providerSlug, "inventory.read"),
      ),
    );
  });

  const query = await searchParams;
  const hasExplicitFilters = [
    query.category,
    query.type,
    query.region,
    query.lifecycle,
    query.q,
    query.sort,
    query.direction,
  ].some((value) => value !== undefined);
  const requestedId = requestedConnectionId(query.connection);
  const selectedConnection =
    resourceConnections.find((connection) => connection.id === requestedId) ??
    resourceConnections.find(
      (connection) => connection.status === "connected",
    ) ??
    resourceConnections[0];

  if (!selectedConnection) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Resources"
          description="Explore cloud resources across every connected provider."
        />
        <EmptyState
          title={
            connections.length
              ? "Resource access is unavailable"
              : "Connect a cloud provider first"
          }
          description={
            connections.length
              ? "Your organization does not have access to resource inventory for its configured providers."
              : "Resources from AWS accounts, Azure subscriptions, and GCP projects will appear here after the first sync."
          }
          actions={
            <Link
              href="/dashboard/integrations"
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              Open integrations
            </Link>
          }
        />
      </div>
    );
  }

  const requestedLifecycleStatus = stringParam(query.lifecycle);
  const lifecycleStatus = ["active", "missing", "out_of_scope"].includes(
    requestedLifecycleStatus,
  )
    ? requestedLifecycleStatus
    : "active";
  const category = stringParam(query.category) || null;
  const resourceType = stringParam(query.type) || null;
  const region = stringParam(query.region) || null;
  const allowedSorts: ResourceSortKey[] = [
    "name",
    "provider",
    "region",
    "status",
    "lastSeen",
  ];
  const requestedSort = stringParam(query.sort) as ResourceSortKey;
  const initialSort = allowedSorts.includes(requestedSort)
    ? requestedSort
    : "lastSeen";
  const requestedDirection = stringParam(query.direction);
  const initialSortDirection =
    requestedDirection === "asc" || requestedDirection === "desc"
      ? requestedDirection
      : undefined;

  const connectionCapabilities = await listConnectionCapabilities(
    organization.organization_id,
    selectedConnection.id,
    token,
    false,
  );
  const inventoryEnabled = connectionCapabilities.some(
    (row) => row.enabled && row.capability.slug === "inventory.read",
  );
  const selectedProviderSlug = integrationsById.get(
    selectedConnection.integration_id,
  )?.slug;

  if (!inventoryEnabled) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Resources"
          description="Explore cloud resources across every connected provider."
        />
        <CloudConnectionSelector
          basePath="/dashboard/resources"
          integrations={integrations}
          connections={resourceConnections}
          selectedConnectionId={selectedConnection.id}
          showResources
          showCosts={Boolean(
            selectedProviderSlug &&
            activeOrganizationCapabilities.has(
              integrationCapabilityCode(selectedProviderSlug, "billing.read"),
            ),
          )}
        />
        <EmptyState
          title="Resource access is not enabled"
          description="Enable the provider's inventory-read capability under Access before collecting resource data."
          actions={
            selectedConnection.status !== "disabled" ? (
              <Link
                href={`/dashboard/integrations/${selectedConnection.id}?tab=access`}
                className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
              >
                Configure access
              </Link>
            ) : undefined
          }
        />
      </div>
    );
  }

  const [resources, filterOptions] = await Promise.all([
    listResources(organization.organization_id, selectedConnection.id, token, {
      limit: RESOURCES_PAGE_SIZE,
      offset: 0,
      category,
      resourceType,
      region,
      lifecycleStatus,
    }),
    listResourceFilters(
      organization.organization_id,
      selectedConnection.id,
      token,
    ),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resources"
        description="A provider-neutral inventory of your cloud infrastructure. Select a connection, then filter by category, type, region, or lifecycle."
      />
      <CloudConnectionSelector
        basePath="/dashboard/resources"
        integrations={integrations}
        connections={resourceConnections}
        selectedConnectionId={selectedConnection.id}
        showResources
        showCosts={Boolean(
          selectedProviderSlug &&
          activeOrganizationCapabilities.has(
            integrationCapabilityCode(selectedProviderSlug, "billing.read"),
          ),
        )}
      />
      {selectedConnection.status !== "connected" ? (
        <p className="border-accent/30 bg-accent/5 text-accent flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
          <span>
            This connection is not verified, so new resource data cannot sync.
            You&apos;re viewing the last data collected before it was disabled.
          </span>
          <Link
            href={`/dashboard/integrations/${selectedConnection.id}?tab=settings`}
            className="bg-accent text-accent-foreground shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium"
          >
            Go to connection settings
          </Link>
        </p>
      ) : null}
      <Section title="Cloud inventory">
        <ResourcePanel
          key={selectedConnection.id}
          connectionId={selectedConnection.id}
          initialResources={resources.items}
          initialTotal={resources.total}
          initialFilterOptions={filterOptions}
          initialFilters={{
            category,
            resourceType,
            region,
            lifecycleStatus,
          }}
          initialSearchQuery={stringParam(query.q)}
          initialSort={initialSort}
          initialSortDirection={initialSortDirection}
          preferInitialFilters={hasExplicitFilters}
        />
      </Section>
    </div>
  );
}
