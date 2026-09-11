import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CoreApiError,
  getCostSummaryTotals,
  integrationCapabilityCode,
  listConnections,
  listIntegrations,
  listOrganizationCapabilities,
} from "@/lib/core/api";
import { EmptyState } from "@/components/dashboard/primitives";

function startOfMonthUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export async function CostUsage({
  organizationId,
  token,
}: {
  organizationId: string;
  token: string;
}) {
  const [connections, integrations, organizationCapabilities] =
    await Promise.all([
      listConnections(organizationId, token),
      listIntegrations(token),
      listOrganizationCapabilities(organizationId, token),
    ]);

  const activeOrganizationCapabilities = new Set(
    organizationCapabilities
      .filter((capability) => capability.access_status === "active")
      .map((capability) => capability.code),
  );
  const integrationsById = new Map(
    integrations.map((integration) => [integration.id, integration]),
  );

  const eligibleConnections = connections.filter((connection) => {
    if (connection.status !== "connected") return false;
    const providerSlug = integrationsById.get(connection.integration_id)?.slug;
    return Boolean(
      providerSlug &&
      activeOrganizationCapabilities.has(
        integrationCapabilityCode(providerSlug, "billing.read"),
      ),
    );
  });

  if (eligibleConnections.length === 0) {
    return (
      <EmptyState
        title="No cost data available yet"
        description="Connect a cloud provider with cost access enabled to see spend here."
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

  const now = new Date();
  const periodStart = startOfMonthUtc(now);

  const results = await Promise.all(
    eligibleConnections.map(async (connection) => {
      try {
        const totals = await getCostSummaryTotals(
          organizationId,
          connection.id,
          token,
          {
            periodStart: periodStart.toISOString(),
            periodEnd: now.toISOString(),
          },
        );
        return {
          connection,
          provider: integrationsById.get(connection.integration_id)?.name ??
            "Cloud provider",
          amount: Number(totals.total_amount),
          currency: totals.currency,
        };
      } catch (error) {
        if (error instanceof CoreApiError) return null;
        throw error;
      }
    }),
  );

  const rows = results.filter((row) => row !== null);
  const excludedCount = eligibleConnections.length - rows.length;
  const mixedCurrencies = new Set(rows.map((row) => row.currency)).size > 1;
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          Current calendar month spend across every connected provider with
          cost access enabled.
        </p>
        <Link
          href="/dashboard/costs"
          className="text-accent inline-flex items-center gap-1 text-xs font-semibold"
        >
          Open full cost explorer <ArrowRight size={13} />
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Cost access is not enabled"
          description="Enable the cost-read capability under a connection's Access tab to see spend here."
        />
      ) : (
        <div className="border-foreground/10 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-foreground/10 border-b">
                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Connection
                </th>
                <th className="text-muted-foreground px-4 py-3 font-medium">
                  Provider
                </th>
                <th className="text-muted-foreground px-4 py-3 text-right font-medium">
                  This month
                </th>
                {!mixedCurrencies ? (
                  <th className="text-muted-foreground px-4 py-3 text-right font-medium">
                    % of total
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.connection.id}
                  className="border-foreground/5 border-b last:border-0"
                >
                  <td className="text-foreground px-4 py-3">
                    {row.connection.name}
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {row.provider}
                  </td>
                  <td className="text-foreground px-4 py-3 text-right font-mono">
                    {row.amount.toLocaleString("en-US")} {row.currency}
                  </td>
                  {!mixedCurrencies ? (
                    <td className="text-muted-foreground px-4 py-3 text-right font-mono">
                      {total > 0
                        ? ((row.amount / total) * 100).toFixed(1)
                        : "0.0"}
                      %
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {excludedCount > 0 ? (
        <p className="text-muted-foreground text-xs">
          {excludedCount} connection{excludedCount === 1 ? "" : "s"} excluded
          — cost access isn&apos;t enabled for {excludedCount === 1 ? "it" : "them"}.
        </p>
      ) : null}
    </div>
  );
}
