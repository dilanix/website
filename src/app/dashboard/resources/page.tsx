import type { Metadata } from "next";
import Link from "next/link";
import {
  listConnections,
  listIntegrations,
  listResourceFilters,
  listResources,
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
  const [integrations, connections] = await Promise.all([
    listIntegrations(token),
    listConnections(organization.organization_id, token),
  ]);

  const query = await searchParams;
  const requestedId = requestedConnectionId(query.connection);
  const selectedConnection =
    connections.find((connection) => connection.id === requestedId) ??
    connections.find((connection) => connection.status === "connected") ??
    connections[0];

  if (!selectedConnection) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Resources"
          description="Explore cloud resources across every connected provider."
        />
        <EmptyState
          title="Connect a cloud provider first"
          description="Resources from AWS accounts, Azure subscriptions, and GCP projects will appear here after the first sync."
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
        connections={connections}
        selectedConnectionId={selectedConnection.id}
      />
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
        />
      </Section>
    </div>
  );
}
