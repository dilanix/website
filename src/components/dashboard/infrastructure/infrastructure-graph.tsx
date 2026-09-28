import Link from "next/link";
import {
  getInfrastructureGraph,
  integrationCapabilityCode,
  listConnections,
  listIntegrations,
  listOrganizationCapabilities,
  listResourceFilters,
  listTargets,
} from "@/lib/core/api";
import { EmptyState } from "@/components/dashboard/primitives";
import { GraphExplorer } from "./graph-explorer";
import { GraphScopeBar } from "./graph-scope-bar";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function Notice({
  tone,
  children,
}: {
  tone: "info" | "warning";
  children: React.ReactNode;
}) {
  return (
    <p
      className={
        tone === "warning"
          ? "rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-500 dark:text-amber-300"
          : "border-accent/25 bg-accent/5 text-foreground/90 rounded-xl border px-4 py-2.5 text-sm"
      }
    >
      {children}
    </p>
  );
}

/**
 * Infrastructure → Graph: the default Infrastructure section. Loads one
 * bounded scope (an integration target, optionally one region) of the shared
 * Resource Graph; details load on demand from the canvas.
 */
export async function InfrastructureGraph({
  organizationId,
  token,
  searchParams,
}: {
  organizationId: string;
  token: string;
  searchParams: SearchParams;
}) {
  const [integrations, connections, capabilities] = await Promise.all([
    listIntegrations(token),
    listConnections(organizationId, token),
    listOrganizationCapabilities(organizationId, token),
  ]);
  const active = new Set(
    capabilities
      .filter((item) => item.access_status === "active")
      .map((item) => item.code),
  );
  const integrationsById = new Map(integrations.map((item) => [item.id, item]));
  const inventoryConnections = connections.filter((connection) => {
    const slug = integrationsById.get(connection.integration_id)?.slug;
    return Boolean(
      slug && active.has(integrationCapabilityCode(slug, "inventory.read")),
    );
  });
  const connection =
    inventoryConnections.find(
      (item) => item.id === first(searchParams.connection),
    ) ??
    inventoryConnections.find((item) => item.status === "connected") ??
    inventoryConnections[0];

  if (!connection) {
    return (
      <EmptyState
        title={
          connections.length
            ? "Resource access is unavailable"
            : "Connect a cloud provider first"
        }
        description={
          connections.length
            ? "Your organization does not have access to resource inventory for its configured providers."
            : "The infrastructure graph is built from resources Dilanix collects from your connected cloud accounts."
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
    );
  }

  const targets = await listTargets(organizationId, connection.id, token);
  const target =
    targets.find((item) => item.id === first(searchParams.target)) ??
    targets[0];
  if (!target) {
    return (
      <EmptyState
        title="No verified accounts yet"
        description="Verify an account on this connection to collect its resources."
        actions={
          <Link
            href={`/dashboard/integrations/${connection.id}`}
            className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
          >
            Open connection
          </Link>
        }
      />
    );
  }

  const filters = await listResourceFilters(
    organizationId,
    connection.id,
    token,
    target.id,
  );
  const requestedRegion = first(searchParams.region) ?? null;
  const region =
    requestedRegion && filters.regions.includes(requestedRegion)
      ? requestedRegion
      : null;
  const graph = await getInfrastructureGraph(organizationId, token, {
    targetId: target.id,
    region,
  });
  const provider =
    integrationsById.get(connection.integration_id)?.name ?? "Cloud";

  return (
    <div className="flex flex-col gap-3">
      <GraphScopeBar
        connections={inventoryConnections.map((item) => ({
          value: item.id,
          label: `${integrationsById.get(item.integration_id)?.name ?? "Cloud"} · ${item.name}`,
        }))}
        targets={targets.map((item) => ({
          value: item.id,
          label: item.display_name ?? item.external_id,
        }))}
        regions={filters.regions}
        selected={{ connection: connection.id, target: target.id, region }}
        resolvedAt={
          graph.resolution?.status === "succeeded"
            ? graph.resolution.resolved_at
            : null
        }
      />
      {graph.nodes.length === 0 ? (
        <EmptyState
          title="No resources collected for this account yet"
          description={`Run an inventory sync for this ${provider} account; its resources and their relationships will appear here.`}
          actions={
            <Link
              href={`/dashboard/integrations/${connection.id}`}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              Open connection
            </Link>
          }
        />
      ) : (
        <>
          {graph.resolution === null ? (
            <Notice tone="info">
              Relationships for this account are being discovered from its
              latest inventory. Resources are shown now; connections appear
              within a few minutes.
            </Notice>
          ) : graph.resolution.status === "failed" ? (
            <Notice tone="warning">
              Relationship discovery failed for the latest inventory snapshot.
              Showing the last successfully resolved relationships.
            </Notice>
          ) : null}
          {graph.truncated ? (
            <Notice tone="warning">
              Showing {graph.nodes.length.toLocaleString("en-US")} of{" "}
              {graph.total_nodes.toLocaleString("en-US")} resources. Select a
              region to see the complete graph for that scope.
            </Notice>
          ) : null}
          <div className="border-border-soft bg-dashboard-panel relative h-[calc(100dvh-17rem)] min-h-[34rem] overflow-hidden rounded-[1.4rem] border shadow-[0_24px_70px_var(--shadow-card)]">
            <GraphExplorer
              key={`${target.id}:${region ?? "all"}`}
              graph={graph}
            />
          </div>
        </>
      )}
    </div>
  );
}
