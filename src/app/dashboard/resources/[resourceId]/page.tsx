import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { ResourceDetailView } from "@/components/dashboard/resource-detail-view";
import { CoreApiError, findResource, getConnection } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";

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

  return (
    <ResourceDetailView
      resource={resource}
      connectionName={connection.name}
      backHref={resourcesHref(query)}
    />
  );
}
