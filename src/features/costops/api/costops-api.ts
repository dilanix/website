import { coreRequest } from "@/lib/core/api";
import type {
  CloudAccount,
  CostOpsIntegration,
  CostOpsOverview,
  CostOpsProviderCatalogItem,
  CostOpsSnapshot,
  CostSeriesGroupBy,
  CostSeriesPoint,
  CostRecord,
  OverviewPeriod,
  SyncRun,
} from "../types";
import { getCostDateRange } from "../date-ranges";
import type {
  CloudResource,
  CloudResourceFilterOptions,
  CloudResourcePage,
  ResourceQuery,
} from "../resources/types";
import type {
  HealthSignal,
  LatestMetric,
  MetricSeries,
  ResourceAnalytics,
  TimeRange,
} from "../resources/analytics/types";

type ProviderCatalogDto = {
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  is_available: boolean;
};

type IntegrationDto = {
  id: string;
  provider: "aws";
  name: string;
  status: "pending" | "connected" | "error" | "disabled";
  external_account_id: string | null;
  external_account_name: string | null;
  role_arn: string | null;
  last_synced_at: string | null;
  last_sync_status: "pending" | "running" | "succeeded" | "failed" | null;
  auto_sync_interval_minutes: 60 | 360 | 720 | 1440 | null;
  next_sync_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  created_at: string;
  setup?: SetupDto;
};
type SetupDto = {
  cloudformation_supported: boolean;
  cloudformation_url: string | null;
  external_id: string | null;
  role_name: string | null;
  stack_name: string | null;
};
type AccountDto = {
  id: string;
  external_account_id: string;
  name: string | null;
  is_management: boolean;
  is_active: boolean;
};
type SyncDto = {
  id: string;
  sync_type: "initial" | "costs" | "full";
  status: "pending" | "running" | "succeeded" | "failed";
  started_at: string | null;
  finished_at: string | null;
  records_processed: number;
  stage: string;
  progress_current: number;
  progress_total: number;
  progress_message: string | null;
  heartbeat_at: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
};
type OverviewDto = {
  current_period_total: string;
  previous_period_total: string;
  change_percentage: string | null;
  connected_integrations: number;
  total_integrations: number;
  last_synced_at: string | null;
  top_services: { service: string; amount: string }[];
  daily_spend: { date: string; amount: string }[];
};
type CostDto = {
  id: string;
  integration_id: string;
  cloud_account_id: string;
  provider: "aws";
  date: string;
  service: string;
  region: string;
  usage_type: string;
  amount: string;
  currency: string;
};
type CostSeriesDto = { period: string; amount: string };
type ResourceDto = {
  id: string;
  integration_id: string;
  provider: string;
  resource_type: string;
  external_id: string;
  name: string | null;
  region: string;
  availability_zone: string | null;
  state: string | null;
  resource_class: string | null;
  configuration: Record<string, unknown>;
  tags: Record<string, string>;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};
type ResourcePageDto = {
  items: ResourceDto[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  summary: {
    total_resources: number;
    compute_resources: number;
    storage_resources: number;
    resources_with_recommendations: number;
  };
};
type FilterOptionDto = { value: string; label: string; count: number };
type ResourceFilterOptionsDto = {
  providers: FilterOptionDto[];
  resource_types: FilterOptionDto[];
  regions: FilterOptionDto[];
  states: FilterOptionDto[];
};
type MetricSeriesDto = {
  key: string;
  label: string;
  unit: MetricSeries["unit"];
  total_unit: MetricSeries["totalUnit"] | null;
  points: { timestamp: string; value: number }[];
  summary: MetricSeries["summary"] | null;
  availability: Exclude<MetricSeries["availability"], "loading">;
  message: string | null;
};
type LatestMetricDto = {
  key: string;
  label: string;
  value: {
    value: number | null;
    unit: LatestMetric["value"]["unit"];
    observed_at: string | null;
    availability: Exclude<LatestMetric["value"]["availability"], "loading">;
    message: string | null;
  };
};
type HealthSignalDto = Omit<HealthSignal, "timestamp"> & {
  observed_at: string | null;
};
type ResourceAnalyticsDto = {
  resource_id: string;
  generated_at: string;
  freshness_threshold_seconds: number;
  range: TimeRange;
  start_at: string;
  end_at: string;
  latest: Record<string, LatestMetricDto>;
  series: Record<string, MetricSeriesDto>;
  health: { overall: HealthSignalDto; signals: HealthSignalDto[] };
  capacity: {
    resource_class: string;
    attributes: { label: string; value: string }[];
  };
  capacity_analysis: {
    classification: "Low" | "Moderate" | "High";
    observed_metric_keys: string[];
  };
};

const base = (organizationId: string) =>
  `/v1/organizations/${organizationId}/costops`;
const providerCatalogItem = (
  dto: ProviderCatalogDto,
): CostOpsProviderCatalogItem => ({
  slug: dto.slug,
  name: dto.name,
  description: dto.description,
  logoUrl: dto.logo_url,
  isAvailable: dto.is_available,
});
const account = (dto: AccountDto): CloudAccount => ({
  id: dto.id,
  externalAccountId: dto.external_account_id,
  name: dto.name,
  isManagement: dto.is_management,
});
const run = (dto: SyncDto): SyncRun => ({
  id: dto.id,
  integrationId: "",
  status: dto.status,
  recordsProcessed: dto.records_processed,
  stage: dto.stage,
  progressCurrent: dto.progress_current,
  progressTotal: dto.progress_total,
  progressMessage: dto.progress_message,
  heartbeatAt: dto.heartbeat_at,
  errorCode: dto.error_code,
  errorMessage: dto.error_message,
});
function integration(
  dto: IntegrationDto,
  organizationId: string,
  accounts: CloudAccount[] = [],
): CostOpsIntegration {
  return {
    id: dto.id,
    organizationId,
    provider: dto.provider,
    name: dto.name,
    status: dto.status,
    externalAccountId: dto.external_account_id,
    roleArn: dto.role_arn,
    createdAt: dto.created_at,
    lastSyncedAt: dto.last_synced_at,
    lastSyncStatus: dto.last_sync_status,
    autoSyncIntervalMinutes: dto.auto_sync_interval_minutes,
    nextSyncAt: dto.next_sync_at,
    errorCode: dto.last_error_code,
    errorMessage: dto.last_error_message,
    accounts,
    setup: dto.setup
      ? {
          cloudformationSupported: dto.setup.cloudformation_supported,
          cloudformationUrl: dto.setup.cloudformation_url,
          externalId: dto.setup.external_id,
          roleName: dto.setup.role_name,
          stackName: dto.setup.stack_name,
        }
      : undefined,
  };
}
const cost = (
  dto: CostDto,
  accountNames: Map<string, string | null>,
): CostRecord => ({
  id: dto.id,
  date: dto.date,
  integrationId: dto.integration_id,
  accountId: dto.cloud_account_id,
  accountName: accountNames.get(dto.cloud_account_id) ?? null,
  service: dto.service,
  region: dto.region,
  amount: dto.amount,
  currency: dto.currency,
});
export const mapCloudResource = (dto: ResourceDto): CloudResource => ({
  id: dto.id,
  integrationId: dto.integration_id,
  provider: dto.provider,
  resourceType: dto.resource_type,
  externalId: dto.external_id,
  name: dto.name,
  region: dto.region,
  availabilityZone: dto.availability_zone,
  state: dto.state,
  resourceClass: dto.resource_class,
  configuration: dto.configuration,
  tags: dto.tags,
  firstSeenAt: dto.first_seen_at,
  lastSeenAt: dto.last_seen_at,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
});

export const mapResourceAnalytics = (
  dto: ResourceAnalyticsDto,
): ResourceAnalytics => {
  const signal = (value: HealthSignalDto): HealthSignal => ({
    ...value,
    timestamp: value.observed_at,
  });
  const latest = Object.fromEntries(
    Object.entries(dto.latest).map(([key, value]) => [
      key,
      {
        key: value.key,
        label: value.label,
        value: {
          value: value.value.value,
          unit: value.value.unit,
          timestamp: value.value.observed_at,
          availability: value.value.availability,
          message: value.value.message ?? undefined,
        },
      },
    ]),
  );
  const series = Object.fromEntries(
    Object.entries(dto.series).map(([key, value]) => [
      key,
      {
        ...value,
        totalUnit: value.total_unit ?? undefined,
        summary: value.summary ?? undefined,
        message: value.message ?? undefined,
      },
    ]),
  );
  return {
    resourceId: dto.resource_id,
    generatedAt: dto.generated_at,
    freshnessThresholdMinutes: dto.freshness_threshold_seconds / 60,
    latest,
    health: {
      overall: signal(dto.health.overall),
      signals: dto.health.signals.map(signal),
    },
    capacity: {
      resourceClass: dto.capacity.resource_class,
      attributes: dto.capacity.attributes,
    },
    ranges: {
      [dto.range]: {
        range: dto.range,
        startAt: dto.start_at,
        endAt: dto.end_at,
        series,
        capacityAnalysis: {
          classification: dto.capacity_analysis.classification,
          observedMetricKeys: dto.capacity_analysis.observed_metric_keys,
        },
      },
    },
  };
};

export async function listIntegrations(organizationId: string, token: string) {
  return coreRequest<IntegrationDto[]>(
    `${base(organizationId)}/integrations`,
    token,
  );
}
export async function listAvailableIntegrations(
  organizationId: string,
  token: string,
) {
  return (
    await coreRequest<ProviderCatalogDto[]>(
      `${base(organizationId)}/available-integrations`,
      token,
    )
  ).map(providerCatalogItem);
}
export async function getIntegration(
  organizationId: string,
  id: string,
  token: string,
) {
  const dto = await coreRequest<IntegrationDto>(
    `${base(organizationId)}/integrations/${id}`,
    token,
  );
  const accounts = await listCloudAccounts(organizationId, id, token);
  return integration(dto, organizationId, accounts);
}
export async function createIntegration(
  organizationId: string,
  name: string,
  token: string,
) {
  const dto = await coreRequest<IntegrationDto>(
    `${base(organizationId)}/integrations`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "aws", name }),
    },
  );
  return integration(dto, organizationId);
}
export async function verifyIntegration(
  organizationId: string,
  id: string,
  awsAccountId: string,
  token: string,
) {
  const dto = await coreRequest<IntegrationDto>(
    `${base(organizationId)}/integrations/${id}/verify`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aws_account_id: awsAccountId }),
    },
  );
  return integration(
    dto,
    organizationId,
    await listCloudAccounts(organizationId, id, token),
  );
}
export async function disableIntegration(
  organizationId: string,
  id: string,
  token: string,
) {
  return integration(
    await coreRequest<IntegrationDto>(
      `${base(organizationId)}/integrations/${id}/disable`,
      token,
      { method: "POST" },
    ),
    organizationId,
  );
}
export async function deleteIntegration(
  organizationId: string,
  id: string,
  token: string,
) {
  await coreRequest<void>(`${base(organizationId)}/integrations/${id}`, token, {
    method: "DELETE",
  });
}
export async function listCloudAccounts(
  organizationId: string,
  id: string,
  token: string,
) {
  return (
    await coreRequest<AccountDto[]>(
      `${base(organizationId)}/integrations/${id}/cloud-accounts`,
      token,
    )
  ).map(account);
}
export async function listSyncRuns(
  organizationId: string,
  id: string,
  token: string,
) {
  return (
    await coreRequest<SyncDto[]>(
      `${base(organizationId)}/integrations/${id}/sync-runs`,
      token,
    )
  ).map((value) => ({ ...run(value), integrationId: id }));
}
export async function triggerSync(
  organizationId: string,
  id: string,
  token: string,
) {
  const value = run(
    await coreRequest<SyncDto>(
      `${base(organizationId)}/integrations/${id}/sync`,
      token,
      { method: "POST" },
    ),
  );
  return { ...value, integrationId: id };
}

export async function updateSyncSettings(
  organizationId: string,
  id: string,
  autoSyncIntervalMinutes: 60 | 360 | 720 | 1440 | null,
  token: string,
) {
  return integration(
    await coreRequest<IntegrationDto>(
      `${base(organizationId)}/integrations/${id}/sync-settings`,
      token,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_sync_interval_minutes: autoSyncIntervalMinutes,
        }),
      },
    ),
    organizationId,
  );
}
export async function getOverview(
  organizationId: string,
  token: string,
  currency: string | null,
  period: OverviewPeriod = "current_month",
): Promise<CostOpsOverview> {
  const dto = await coreRequest<OverviewDto>(
    `${base(organizationId)}/overview?period=${period}`,
    token,
  );
  const money = (amount: string) => ({ amount, currency });
  return {
    currentTotal: money(dto.current_period_total),
    previousTotal: money(dto.previous_period_total),
    changePercent: dto.change_percentage,
    daily: dto.daily_spend.map((v) => ({
      date: v.date,
      amount: v.amount,
      currency,
    })),
    topServices: dto.top_services.map((v) => ({
      service: v.service,
      amount: v.amount,
      currency,
    })),
    integrationCount: dto.connected_integrations,
    lastSyncedAt: dto.last_synced_at,
  };
}
export async function queryCostSeries(
  organizationId: string,
  token: string,
  query: {
    start_date?: string;
    end_date?: string;
    group_by: CostSeriesGroupBy;
    integration_id?: string;
    cloud_account_id?: string;
    service_name?: string;
    region?: string;
  },
  currency: string | null,
): Promise<CostSeriesPoint[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const values = await coreRequest<CostSeriesDto[]>(
    `${base(organizationId)}/costs/series?${params}`,
    token,
  );
  return values.map((value) => ({ ...value, currency }));
}
export async function listCosts(
  organizationId: string,
  token: string,
  query: Record<string, string | undefined> = {},
) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const suffix = params.size ? `?${params}` : "";
  return coreRequest<CostDto[]>(
    `${base(organizationId)}/costs${suffix}`,
    token,
  );
}
export async function queryCosts(
  organizationId: string,
  token: string,
  query: Record<string, string | undefined>,
) {
  return (await listCosts(organizationId, token, query)).map((value) =>
    cost(value, new Map()),
  );
}
export async function listResources(
  organizationId: string,
  token: string,
  query: ResourceQuery = {},
): Promise<CloudResourcePage> {
  const params = new URLSearchParams();
  const values: Record<string, string | number | undefined> = {
    search: query.search,
    provider: query.provider,
    resource_type: query.resourceType,
    region: query.region,
    state: query.state,
    integration_id: query.integrationId,
    page: query.page,
    page_size: query.pageSize,
    sort: query.sort,
  };
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const dto = await coreRequest<ResourcePageDto>(
    `${base(organizationId)}/resources${params.size ? `?${params}` : ""}`,
    token,
  );
  return {
    items: dto.items.map(mapCloudResource),
    total: dto.total,
    page: dto.page,
    pageSize: dto.page_size,
    pages: dto.pages,
    summary: {
      totalResources: dto.summary.total_resources,
      computeResources: dto.summary.compute_resources,
      storageResources: dto.summary.storage_resources,
      resourcesWithRecommendations: dto.summary.resources_with_recommendations,
    },
  };
}
export async function getResourceFilterOptions(
  organizationId: string,
  token: string,
): Promise<CloudResourceFilterOptions> {
  const dto = await coreRequest<ResourceFilterOptionsDto>(
    `${base(organizationId)}/resources/filter-options`,
    token,
  );
  return {
    providers: dto.providers,
    resourceTypes: dto.resource_types,
    regions: dto.regions,
    states: dto.states,
  };
}
export async function getResource(
  organizationId: string,
  resourceId: string,
  token: string,
) {
  return mapCloudResource(
    await coreRequest<ResourceDto>(
      `${base(organizationId)}/resources/${resourceId}`,
      token,
    ),
  );
}
export async function getResourceAnalytics(
  organizationId: string,
  resourceId: string,
  range: TimeRange,
  token: string,
) {
  const dto = await coreRequest<ResourceAnalyticsDto>(
    `${base(organizationId)}/resources/${resourceId}/analytics?range=${range}`,
    token,
  );
  return mapResourceAnalytics(dto);
}
export async function getSnapshot(
  organizationId: string,
  token: string,
): Promise<CostOpsSnapshot> {
  const defaultCostRange = getCostDateRange("last_30_days");
  const [providers, dtos] = await Promise.all([
    listAvailableIntegrations(organizationId, token),
    listIntegrations(organizationId, token),
  ]);
  const detailed = await Promise.all(
    dtos.map(async (dto) =>
      integration(
        dto,
        organizationId,
        await listCloudAccounts(organizationId, dto.id, token),
      ),
    ),
  );
  const syncRuns = Object.fromEntries(
    await Promise.all(
      detailed.map(
        async (item) =>
          [
            item.id,
            await listSyncRuns(organizationId, item.id, token),
          ] as const,
      ),
    ),
  );
  const initialCostQuery = {
    start_date: defaultCostRange.startDate,
    end_date: defaultCostRange.endDate,
  };
  const costDtos = await listCosts(organizationId, token, initialCostQuery);
  const names = new Map(
    detailed.flatMap((item) =>
      item.accounts.map((a) => [a.id, a.name] as const),
    ),
  );
  const costs = costDtos.map((value) => cost(value, names));
  const currency = costs[0]?.currency ?? null;
  return {
    providers,
    integrations: detailed,
    syncRuns,
    costs,
    costSeries: await queryCostSeries(
      organizationId,
      token,
      { ...initialCostQuery, group_by: "day" },
      currency,
    ),
    defaultCostRange,
    overview: await getOverview(organizationId, token, currency),
  };
}
