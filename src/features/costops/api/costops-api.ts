import { coreRequest } from "@/lib/core/api";
import type {
  CloudAccount,
  CostOpsIntegration,
  CostOpsOverview,
  CostOpsProviderCatalogItem,
  CostOpsSnapshot,
  CostRecord,
  SyncRun,
} from "../types";

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
export async function getOverview(
  organizationId: string,
  token: string,
  currency: string | null,
): Promise<CostOpsOverview> {
  const dto = await coreRequest<OverviewDto>(
    `${base(organizationId)}/overview`,
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
export async function getSnapshot(
  organizationId: string,
  token: string,
): Promise<CostOpsSnapshot> {
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
  const costDtos = await listCosts(organizationId, token);
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
    overview: await getOverview(organizationId, token, currency),
  };
}
