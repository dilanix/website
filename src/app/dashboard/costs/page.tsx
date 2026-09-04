import type { Metadata } from "next";
import Link from "next/link";
import {
  listConnections,
  listConnectionCapabilities,
  listCostSummaries,
  listIntegrations,
} from "@/lib/core/api";
import type { CostBasis } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import {
  COST_BASIS_FILTER_ORDER,
  COST_SUMMARIES_PAGE_SIZE,
  PERIOD_PRESETS,
  type PeriodPresetId,
} from "@/lib/billing/cost-summaries";
import { CloudConnectionSelector } from "@/components/dashboard/cloud-connection-selector";
import { CostSummaryPanel } from "@/components/dashboard/cost-summary-panel";
import {
  EmptyState,
  PageHeader,
  Section,
} from "@/components/dashboard/primitives";

export const metadata: Metadata = {
  title: "Costs",
  robots: { index: false, follow: false },
};

function requestedConnectionId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function CostsPage({
  searchParams,
}: {
  searchParams: Promise<{
    connection?: string | string[];
    basis?: string | string[];
    service?: string | string[];
    period?: string | string[];
    start?: string | string[];
    end?: string | string[];
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
          title="Costs"
          description="Analyze cloud spend across every connected provider."
        />
        <EmptyState
          title="Connect a cloud provider first"
          description="Cloud costs will appear here after a provider connection with cost access is synced."
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

  const connectionCapabilities = await listConnectionCapabilities(
    organization.organization_id,
    selectedConnection.id,
    token,
    false,
  );
  const costReadEnabled = connectionCapabilities.some(
    (row) => row.enabled && row.capability.slug === "billing.read",
  );
  const requestedBasis = stringParam(query.basis) as CostBasis;
  const initialCostBasis = COST_BASIS_FILTER_ORDER.includes(requestedBasis)
    ? requestedBasis
    : "net_unblended";
  const initialServiceName = stringParam(query.service);
  const requestedPeriod = stringParam(query.period);
  const periodIds = PERIOD_PRESETS.map((preset) => preset.id) as string[];
  const initialPeriod: PeriodPresetId | "custom" =
    requestedPeriod === "custom" || periodIds.includes(requestedPeriod)
      ? (requestedPeriod as PeriodPresetId | "custom")
      : "30d";
  const costSummaries = costReadEnabled
    ? await listCostSummaries(
        organization.organization_id,
        selectedConnection.id,
        token,
        {
          limit: COST_SUMMARIES_PAGE_SIZE,
          offset: 0,
          costBasis: initialCostBasis,
          serviceName: initialServiceName || null,
        },
      )
    : { items: [], total: 0 };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Costs"
        description="Analyze cloud-provider spend by connection, service, period, and cost basis."
      />
      <CloudConnectionSelector
        basePath="/dashboard/costs"
        integrations={integrations}
        connections={connections}
        selectedConnectionId={selectedConnection.id}
      />
      <Section title="Cost overview">
        <CostSummaryPanel
          key={selectedConnection.id}
          connectionId={selectedConnection.id}
          costReadEnabled={costReadEnabled}
          connectionSettingsHref={`/dashboard/integrations/${selectedConnection.id}?tab=access`}
          initialCostSummaries={costSummaries.items}
          initialTotal={costSummaries.total}
          initialCostBasis={initialCostBasis}
          initialServiceName={initialServiceName}
          initialPeriod={initialPeriod}
          initialCustomStart={stringParam(query.start)}
          initialCustomEnd={stringParam(query.end)}
        />
      </Section>
    </div>
  );
}
