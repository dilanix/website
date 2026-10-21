import {
  listConnectionCapabilities,
  listConnections,
  listTargets,
} from "@/lib/core/api";
import { CostDataScopeSelector } from "./cost-data-scope-selector";

export async function CostDataScope({
  organizationId,
  token,
}: {
  organizationId: string;
  token: string;
}) {
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

  return (
    <CostDataScopeSelector
      connections={accessible.map((item) => item.connection)}
      targets={accessible.flatMap((item) => item.targets)}
    />
  );
}
