import type { Metadata } from "next";
import Link from "next/link";
import {
  listConnections,
  listConnectionCapabilities,
  listCostSummaries,
  listCostUsage,
  listIntegrations,
  listOrganizationCapabilities,
  integrationCapabilityCode,
} from "@/lib/core/api";
import type { CostBasis } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import {
  COST_BASIS_FILTER_ORDER,
  COST_SUMMARIES_PAGE_SIZE,
  PERIOD_PRESETS,
  presetRange,
  type PeriodPresetId,
} from "@/lib/billing/cost-summaries";
import { COST_USAGE_PAGE_SIZE } from "@/lib/billing/cost-usage";
import { CloudConnectionSelector } from "@/components/dashboard/cloud-connection-selector";
import { CostSummaryPanel } from "@/components/dashboard/cost-summary-panel";
import { CostUsagePanel } from "@/components/dashboard/cost-usage-panel";
import { UnifiedCostTotals } from "@/components/dashboard/unified-cost-totals";
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
  const costConnections = connections.filter((connection) => {
    const providerSlug = integrationsById.get(connection.integration_id)?.slug;
    return Boolean(
      providerSlug &&
      activeOrganizationCapabilities.has(
        integrationCapabilityCode(providerSlug, "billing.read"),
      ),
    );
  });

  const query = await searchParams;
  const requestedId = requestedConnectionId(query.connection);
  const selectedConnection =
    costConnections.find((connection) => connection.id === requestedId) ??
    costConnections.find((connection) => connection.status === "connected") ??
    costConnections[0];

  if (!selectedConnection) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Costs"
          description="Analyze cloud spend across every connected provider."
        />
        <EmptyState
          title={
            connections.length
              ? "Cost access is unavailable"
              : "Connect a cloud provider first"
          }
          description={
            connections.length
              ? "Your organization does not have access to cost data for its configured providers."
              : "Cloud costs will appear here after a provider connection with cost access is synced."
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

  const connectionCapabilities = await listConnectionCapabilities(
    organization.organization_id,
    selectedConnection.id,
    token,
    false,
  );
  const selectedIntegration = integrationsById.get(
    selectedConnection.integration_id,
  );
  const providerSlug = selectedIntegration?.slug;
  const connectionUsable = selectedConnection.status === "connected";
  const costReadGranted = Boolean(
    providerSlug &&
    activeOrganizationCapabilities.has(
      integrationCapabilityCode(providerSlug, "billing.read"),
    ),
  );
  const costReadEnabled =
    connectionUsable &&
    costReadGranted &&
    connectionCapabilities.some(
      (row) => row.enabled && row.capability.slug === "billing.read",
    );
  const focusCostUsageEnabled = Boolean(
    providerSlug &&
    activeOrganizationCapabilities.has(
      integrationCapabilityCode(providerSlug, "billing.cost_usage"),
    ),
  );
  const focusCostUsageActive = costReadEnabled && focusCostUsageEnabled;
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
  const connectionSettingsHref = `/dashboard/integrations/${selectedConnection.id}?tab=access`;
  const [costSummaries, costUsage] = await Promise.all([
    costReadEnabled
      ? listCostSummaries(
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
      : Promise.resolve({ items: [], total: 0 }),
    focusCostUsageActive
      ? listCostUsage(
          organization.organization_id,
          selectedConnection.id,
          token,
          {
            limit: COST_USAGE_PAGE_SIZE,
            offset: 0,
          },
        )
      : Promise.resolve({ items: [], total: 0 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Costs"
        description="Analyze cloud-provider spend by connection, service, period, and cost basis."
      />
      <CloudConnectionSelector
        basePath="/dashboard/costs"
        integrations={integrations}
        connections={costConnections}
        selectedConnectionId={selectedConnection.id}
        showResources={Boolean(
          providerSlug &&
          activeOrganizationCapabilities.has(
            integrationCapabilityCode(providerSlug, "inventory.read"),
          ),
        )}
        showCosts={costReadGranted}
      />
      {!connectionUsable ? (
        <EmptyState
          title="Connection is not active"
          description="Enable and verify this connection before collecting new cost data."
        />
      ) : !costReadGranted ? (
        <EmptyState
          title="Cost access is unavailable"
          description="Your organization does not have access to this provider's cost capability."
        />
      ) : null}
      {connectionUsable && costReadGranted ? (
        <>
          <Section title="Cost overview">
            {costReadEnabled ? (
              <UnifiedCostTotals
                key={selectedConnection.id}
                connectionId={selectedConnection.id}
                range={presetRange("30d")}
              />
            ) : (
              <EmptyState
                title="Cost access is not enabled"
                description="Enable the provider's cost-read capability under Access, then run a cost sync to collect spend data."
                actions={
                  <Link
                    href={connectionSettingsHref}
                    className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
                  >
                    Configure access
                  </Link>
                }
              />
            )}
          </Section>
          <Section title="Cost Explorer breakdown">
            <CostSummaryPanel
              key={selectedConnection.id}
              connectionId={selectedConnection.id}
              costReadEnabled={costReadEnabled}
              connectionSettingsHref={connectionSettingsHref}
              initialCostSummaries={costSummaries.items}
              initialTotal={costSummaries.total}
              initialCostBasis={initialCostBasis}
              initialServiceName={initialServiceName}
              initialPeriod={initialPeriod}
              initialCustomStart={stringParam(query.start)}
              initialCustomEnd={stringParam(query.end)}
            />
          </Section>
          {focusCostUsageEnabled ? (
            <Section title="FOCUS cost usage">
              <CostUsagePanel
                key={selectedConnection.id}
                connectionId={selectedConnection.id}
                costReadEnabled={costReadEnabled}
                focusExportEnabled
                connectionSettingsHref={connectionSettingsHref}
                initialCostUsage={costUsage.items}
                initialTotal={costUsage.total}
              />
            </Section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
