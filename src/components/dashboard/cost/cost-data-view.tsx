import Link from "next/link";
import {
  listConnectionCapabilities,
  listConnections,
  listCostSummaries,
  listCostUsage,
  listIntegrations,
  listOrganizationCapabilities,
  listTargets,
  integrationCapabilityCode,
  type CostBasis,
} from "@/lib/core/api";
import {
  COST_BASIS_FILTER_ORDER,
  COST_SUMMARIES_PAGE_SIZE,
  PERIOD_PRESETS,
  type PeriodPresetId,
} from "@/lib/billing/cost-summaries";
import { COST_USAGE_PAGE_SIZE } from "@/lib/billing/cost-usage";
import { CostSummaryPanel } from "@/components/dashboard/cost-summary-panel";
import { CostUsagePanel } from "@/components/dashboard/cost-usage-panel";
import { EmptyState, Section } from "@/components/dashboard/primitives";

function value(param: string | string[] | undefined) {
  return Array.isArray(param) ? (param[0] ?? "") : (param ?? "");
}

export async function CostDataView({
  view,
  organizationId,
  token,
  connectionId,
  targetId,
  searchParams,
}: {
  view: "services" | "resources";
  organizationId: string;
  token: string;
  connectionId: string | null;
  targetId: string | null;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!connectionId) {
    return (
      <EmptyState
        title="Choose a connection"
        description={`Select a cost data connection above to inspect ${view} at provider detail level.`}
      />
    );
  }

  const [
    capabilities,
    targets,
    organizationCapabilities,
    connections,
    integrations,
  ] = await Promise.all([
    listConnectionCapabilities(organizationId, connectionId, token, false),
    listTargets(organizationId, connectionId, token),
    listOrganizationCapabilities(organizationId, token),
    listConnections(organizationId, token),
    listIntegrations(token),
  ]);
  const costReadEnabled = capabilities.some(
    (row) => row.enabled && row.capability.slug === "billing.read",
  );
  const connection = connections.find((item) => item.id === connectionId);
  const providerSlug = integrations.find(
    (integration) => integration.id === connection?.integration_id,
  )?.slug;
  const focusEnabled = Boolean(
    providerSlug &&
    organizationCapabilities.some(
      (capability) =>
        capability.access_status === "active" &&
        capability.code ===
          integrationCapabilityCode(providerSlug, "billing.cost_usage"),
    ),
  );
  const settingsHref = `/dashboard/integrations/${connectionId}?tab=access`;

  if (view === "resources") {
    if (!focusEnabled) {
      return (
        <EmptyState
          title="Resource-level cost data is unavailable"
          description="Enable a normalized FOCUS cost export to inspect individual resource charges."
          actions={
            <Link
              href={settingsHref}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              Open connection access
            </Link>
          }
        />
      );
    }
    const usage = costReadEnabled
      ? await listCostUsage(organizationId, connectionId, token, {
          limit: COST_USAGE_PAGE_SIZE,
          offset: 0,
          targetId,
        })
      : { items: [], total: 0 };
    return (
      <Section title="Resource cost detail">
        <CostUsagePanel
          key={`${connectionId}:${targetId ?? "all"}`}
          connectionId={connectionId}
          targetId={targetId}
          targets={targets}
          costReadEnabled={costReadEnabled}
          focusExportEnabled
          connectionSettingsHref={settingsHref}
          initialCostUsage={usage.items}
          initialTotal={usage.total}
        />
      </Section>
    );
  }

  const requestedBasis = value(searchParams.basis) as CostBasis;
  const initialCostBasis = COST_BASIS_FILTER_ORDER.includes(requestedBasis)
    ? requestedBasis
    : "net_unblended";
  const requestedPeriod = value(searchParams.period);
  const periodIds = PERIOD_PRESETS.map((preset) => preset.id) as string[];
  const initialPeriod: PeriodPresetId | "custom" =
    requestedPeriod === "custom" || periodIds.includes(requestedPeriod)
      ? (requestedPeriod as PeriodPresetId | "custom")
      : "30d";
  const serviceName = value(searchParams.service);
  const summaries = costReadEnabled
    ? await listCostSummaries(organizationId, connectionId, token, {
        limit: COST_SUMMARIES_PAGE_SIZE,
        offset: 0,
        targetId,
        costBasis: initialCostBasis,
        serviceName: serviceName || null,
      })
    : { items: [], total: 0 };

  return (
    <Section title="Service cost detail">
      <CostSummaryPanel
        key={`${connectionId}:${targetId ?? "all"}`}
        connectionId={connectionId}
        targetId={targetId}
        targets={targets}
        costReadEnabled={costReadEnabled}
        connectionSettingsHref={settingsHref}
        initialCostSummaries={summaries.items}
        initialTotal={summaries.total}
        initialCostBasis={initialCostBasis}
        initialServiceName={serviceName}
        initialPeriod={initialPeriod}
        initialCustomStart={value(searchParams.start)}
        initialCustomEnd={value(searchParams.end)}
        preferInitialFilters={[
          "basis",
          "service",
          "period",
          "start",
          "end",
        ].some((key) => searchParams[key] !== undefined)}
      />
    </Section>
  );
}
