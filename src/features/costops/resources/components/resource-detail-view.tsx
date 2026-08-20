"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Section } from "@/components/dashboard/primitives";
import { useCostOps } from "../../costops-context";
import { formatDateTime } from "../../utils";
import { ResourceStateBadge, ResourceTypeBadge } from "./resource-badges";
import {
  CURATED_CONFIGURATION_KEYS,
  formatConfigurationValue,
  formatMetadataValue,
  formatRegion,
  humanize,
  resourceDisplayName,
} from "../presentation";
import type { CloudResource } from "../types";
import type { ResourceAnalytics } from "../analytics/types";
import { ResourceUtilization } from "./resource-utilization";
import { RESOURCE_METRIC_DEFINITIONS } from "../analytics/metric-definitions";
import type { ResourceEvidence } from "../analytics/evidence-types";
import { ResourceEvidencePanel } from "./resource-evidence";

export function ResourceDetailView({
  resource,
  initialAnalytics,
  initialEvidence,
}: {
  resource: CloudResource;
  initialAnalytics: ResourceAnalytics | null;
  initialEvidence: ResourceEvidence | null;
}) {
  const { integrations } = useCostOps();
  const integration = integrations.find(
    (item) => item.id === resource.integrationId,
  );
  const overview: [string, React.ReactNode][] = [
    [
      "Resource type",
      <ResourceTypeBadge key="type" type={resource.resourceType} />,
    ],
    ["Resource class", resource.resourceClass ?? "—"],
    ["Region", formatRegion(resource.region)],
    ["Availability zone", resource.availabilityZone ?? "—"],
    ["State", <ResourceStateBadge key="state" state={resource.state} />],
    ["Provider", resource.provider.toUpperCase()],
    ["Integration", integration?.name ?? "—"],
    ["External ID", resource.externalId],
  ];
  const configEntries = configurationEntries(resource);
  const metricDefinition = RESOURCE_METRIC_DEFINITIONS[resource.resourceType];
  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link
          href="/dashboard/costops/resources"
          className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={15} /> Resources
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {resourceDisplayName(resource)}
            </h1>
            {resource.name ? (
              <p className="text-muted-foreground mt-1 font-mono text-xs break-all">
                {resource.externalId}
              </p>
            ) : null}
            <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span>{resource.provider.toUpperCase()}</span>
              <span>·</span>
              <ResourceTypeBadge type={resource.resourceType} />
              <span>·</span>
              <span className="font-mono">{formatRegion(resource.region)}</span>
            </div>
          </div>
          <ResourceStateBadge state={resource.state} />
        </div>
      </header>
      <Section title="Overview">
        <DefinitionGrid entries={overview} />
      </Section>
      <Section title="Configuration">
        {configEntries.length ? (
          <DefinitionGrid
            entries={configEntries.map(([key, value]) => [
              humanize(key),
              <MetadataValue key={key} name={key} value={value} />,
            ])}
          />
        ) : (
          <CompactEmpty
            title="No configuration metadata"
            description="Configuration details were not available during the latest inventory collection."
          />
        )}
      </Section>
      {metricDefinition && initialAnalytics ? (
        <ResourceUtilization
          analytics={initialAnalytics}
          definition={metricDefinition}
        />
      ) : metricDefinition ? (
        <Section title="Utilization & Performance">
          <CompactEmpty
            title="Analytics unavailable"
            description="Monitoring data could not be loaded. Try refreshing this page."
          />
        </Section>
      ) : null}
      {metricDefinition ? (
        <ResourceEvidencePanel evidence={initialEvidence} />
      ) : null}
      <Section title="Tags">
        {Object.keys(resource.tags).length ? (
          <DefinitionGrid
            entries={Object.entries(resource.tags)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, value]) => [key, value])}
          />
        ) : (
          <CompactEmpty
            title="No tags"
            description="No tags were returned for this resource."
          />
        )}
      </Section>
      <Section title="Discovery">
        <p className="text-muted-foreground -mt-2 mb-4 text-xs leading-5">
          Inventory collection timestamps, separate from monitoring metric
          observation times above.
        </p>
        <DefinitionGrid
          entries={[
            ["First discovered", formatDateTime(resource.firstSeenAt)],
            ["Last seen", formatDateTime(resource.lastSeenAt)],
            ["Inventory record updated", formatDateTime(resource.updatedAt)],
          ]}
        />
      </Section>
    </div>
  );
}
export function configurationEntries(
  resource: CloudResource,
): [string, unknown][] {
  const entries = Object.entries(resource.configuration);
  const order = CURATED_CONFIGURATION_KEYS[resource.resourceType];
  if (!order) return entries.sort(([a], [b]) => a.localeCompare(b));
  const rank = new Map(order.map((key, index) => [key, index]));
  return entries.sort(
    ([a], [b]) =>
      (rank.get(a) ?? 999) - (rank.get(b) ?? 999) || a.localeCompare(b),
  );
}
function DefinitionGrid({ entries }: { entries: [string, React.ReactNode][] }) {
  return (
    <dl className="border-foreground/10 grid overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([label, value]) => (
        <div
          key={label}
          className="border-foreground/7 min-w-0 border-b px-5 py-4 sm:border-r lg:nth-[3n]:border-r-0"
        >
          <dt className="text-muted-foreground text-xs break-words">{label}</dt>
          <dd className="mt-2 text-sm break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
function MetadataValue({ name, value }: { name: string; value: unknown }) {
  if (value && typeof value === "object")
    return (
      <pre className="text-muted-foreground max-h-64 overflow-auto font-mono text-xs leading-5 whitespace-pre-wrap">
        {formatMetadataValue(value)}
      </pre>
    );
  return <span>{formatConfigurationValue(name, value)}</span>;
}
function CompactEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-foreground/10 bg-foreground/[0.015] rounded-xl border border-dashed px-5 py-8">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}
