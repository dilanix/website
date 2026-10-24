import {
  listConnectionCapabilities,
  listConnections,
  listTargets,
  type CoreIntegrationConnection,
  type CoreIntegrationTarget,
} from "@/lib/core/api";
import { CostDataScopeSelector } from "./cost-data-scope-selector";

/** The connections with `billing.read` and their targets — what the Cost
 *  data scope picker offers. */
export async function loadCostDataScopeOptions(
  organizationId: string,
  token: string,
): Promise<{
  connections: CoreIntegrationConnection[];
  targets: CoreIntegrationTarget[];
}> {
  const connections = await listConnections(organizationId, token);
  const connectionData = await Promise.all(
    connections.map(async (connection) => {
      const [capabilities, targets] = await Promise.all([
        listConnectionCapabilities(organizationId, connection.id, token, true),
        listTargets(organizationId, connection.id, token),
      ]);
      const billingReadEnabled = capabilities.some(
        (row) =>
          row.enabled &&
          row.capability.slug === "billing.read" &&
          row.capability.status === "active",
      );
      return billingReadEnabled ? { connection, targets } : null;
    }),
  );
  const accessible = connectionData.filter((item) => item !== null);
  return {
    connections: accessible.map((item) => item.connection),
    targets: accessible.flatMap((item) => item.targets),
  };
}

/** "Connection · target" for every target, the way the scope picker names
 *  one account. */
export function costTargetLabels(
  connections: CoreIntegrationConnection[],
  targets: CoreIntegrationTarget[],
): Record<string, string> {
  const connectionNames = new Map(
    connections.map((connection) => [connection.id, connection.name]),
  );
  return Object.fromEntries(
    targets.map((target) => [
      target.id,
      `${connectionNames.get(target.connection_id) ?? "Connection"} · ${target.display_name ?? target.external_id}`,
    ]),
  );
}

export async function CostDataScope({
  organizationId,
  token,
}: {
  organizationId: string;
  token: string;
}) {
  const { connections, targets } = await loadCostDataScopeOptions(
    organizationId,
    token,
  );
  return <CostDataScopeSelector connections={connections} targets={targets} />;
}
