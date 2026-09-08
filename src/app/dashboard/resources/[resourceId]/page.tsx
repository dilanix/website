import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { ResourceDetailView } from "@/components/dashboard/resource-detail-view";
import {
  CoreApiError,
  findResource,
  getConnection,
  getMetricUtilizationSummary,
  listMetricDatapoints,
  listResources,
  type CoreMetricDatapointListResponse,
  type CoreMetricUtilizationSummaryListResponse,
  type CoreResource,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";

const METRIC_SUMMARY_RESOURCE_LIMIT = 100;

export const metadata: Metadata = {
  title: "Resource details",
  robots: { index: false, follow: false },
};

interface ResourceDetailSearchParams {
  connection?: string | string[];
  category?: string | string[];
  type?: string | string[];
  region?: string | string[];
  lifecycle?: string | string[];
  q?: string | string[];
  sort?: string | string[];
  direction?: string | string[];
}

function scalarParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function resourcesHref(query: ResourceDetailSearchParams): Route {
  const params = new URLSearchParams();
  const values = {
    connection: scalarParam(query.connection),
    category: scalarParam(query.category),
    type: scalarParam(query.type),
    region: scalarParam(query.region),
    lifecycle: scalarParam(query.lifecycle),
    q: scalarParam(query.q),
    sort: scalarParam(query.sort),
    direction: scalarParam(query.direction),
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value && !(key === "lifecycle" && value === "active")) {
      params.set(key, value);
    }
  });
  const search = params.toString();
  return `/dashboard/resources${search ? `?${search}` : ""}` as Route;
}

async function listEcsClusterServices(
  organizationId: string,
  connectionId: string,
  cluster: CoreResource,
  token: string,
): Promise<CoreResource[]> {
  const services: CoreResource[] = [];
  let offset = 0;

  while (true) {
    const page = await listResources(organizationId, connectionId, token, {
      limit: 100,
      offset,
      category: "container",
      resourceType: "container.service",
      region: cluster.region,
      lifecycleStatus: cluster.lifecycle_status,
    });
    services.push(
      ...page.items.filter(
        (resource) =>
          resource.provider_resource_type === "ecs.service" &&
          resource.external_id.startsWith(`${cluster.external_id}/`),
      ),
    );
    offset += page.items.length;
    if (page.items.length === 0 || offset >= page.total) break;
  }

  return services;
}

async function getMetricSummaries(
  organizationId: string,
  connectionId: string,
  resourceIds: string[],
  token: string,
): Promise<CoreMetricUtilizationSummaryListResponse> {
  const batches: string[][] = [];
  for (
    let offset = 0;
    offset < resourceIds.length;
    offset += METRIC_SUMMARY_RESOURCE_LIMIT
  ) {
    batches.push(
      resourceIds.slice(offset, offset + METRIC_SUMMARY_RESOURCE_LIMIT),
    );
  }
  const responses = await Promise.all(
    batches.map((batch) =>
      getMetricUtilizationSummary(organizationId, connectionId, token, {
        resourceIds: batch,
      }),
    ),
  );
  return { items: responses.flatMap((response) => response.items) };
}

export default async function ResourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ resourceId: string }>;
  searchParams: Promise<ResourceDetailSearchParams>;
}) {
  const [{ resourceId }, query, { token, organization }] = await Promise.all([
    params,
    searchParams,
    requireDashboardOrganization(),
  ]);
  const connectionId = scalarParam(query.connection);
  if (!connectionId) notFound();

  const connection = await getConnection(
    organization.organization_id,
    connectionId,
    token,
  ).catch((error) => {
    if (error instanceof CoreApiError && error.status === 404) return null;
    throw error;
  });
  if (!connection) notFound();

  const resource = await findResource(
    organization.organization_id,
    connectionId,
    resourceId,
    token,
    {
      category: scalarParam(query.category) || null,
      resourceType: scalarParam(query.type) || null,
      region: scalarParam(query.region) || null,
      preferredLifecycleStatus: scalarParam(query.lifecycle) || null,
    },
  );
  if (!resource) notFound();

  let clusterServices: CoreResource[] = [];
  let clusterMetricSummary: CoreMetricUtilizationSummaryListResponse = {
    items: [],
  };
  let initialMetricSummary: CoreMetricUtilizationSummaryListResponse = {
    items: [],
  };
  let initialMetrics: CoreMetricDatapointListResponse = {
    items: [],
    total: 0,
  };

  if (resource.provider_resource_type === "ecs.cluster") {
    clusterServices = await listEcsClusterServices(
      organization.organization_id,
      connectionId,
      resource,
      token,
    );
    clusterMetricSummary = await getMetricSummaries(
      organization.organization_id,
      connectionId,
      clusterServices.map((service) => service.id),
      token,
    );
    const initialService = clusterServices.find((service) =>
      clusterMetricSummary.items.some(
        (summary) => summary.resource_id === service.id,
      ),
    );
    const initialSeries = initialService
      ? clusterMetricSummary.items.find(
          (summary) => summary.resource_id === initialService.id,
        )
      : undefined;
    if (initialService && initialSeries) {
      initialMetrics = await listMetricDatapoints(
        organization.organization_id,
        connectionId,
        token,
        {
          resourceId: initialService.id,
          limit: 100,
          offset: 0,
          namespace: initialSeries.namespace,
          metricName: initialSeries.metric_name,
        },
      );
    }
  } else {
    initialMetricSummary = await getMetricUtilizationSummary(
      organization.organization_id,
      connectionId,
      token,
      { resourceIds: [resource.id] },
    );
    const initialSeries = initialMetricSummary.items[0];
    if (initialSeries) {
      initialMetrics = await listMetricDatapoints(
        organization.organization_id,
        connectionId,
        token,
        {
          resourceId: resource.id,
          limit: 100,
          offset: 0,
          namespace: initialSeries.namespace,
          metricName: initialSeries.metric_name,
        },
      );
    }
  }

  return (
    <ResourceDetailView
      resource={resource}
      connectionName={connection.name}
      backHref={resourcesHref(query)}
      clusterServices={clusterServices}
      clusterMetricSummary={clusterMetricSummary}
      initialMetricSummary={initialMetricSummary}
      initialMetrics={initialMetrics}
    />
  );
}
