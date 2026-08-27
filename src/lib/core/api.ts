import { env } from "@/env";

export class CoreApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function extractErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      const details = body.detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item
            ? String(item.msg)
            : "",
        )
        .filter(Boolean);
      if (details.length) return details.join(" ");
    }
  } catch {}
  return fallback;
}

export async function coreRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const message = await extractErrorMessage(
      response,
      "Dilanix Core request failed.",
    );
    throw new CoreApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface CoreProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  dashboard_enabled: boolean;
  api_enabled: boolean;
  access_status: "active" | "pending" | "expired" | "disabled";
  access_expires_at: string | null;
}

export type ApiKeyAccessMode = "full" | "restricted";
export interface CoreApiKey {
  id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  access_mode: ApiKeyAccessMode;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}
export interface CreatedApiKey extends CoreApiKey {
  key: string;
}
export interface CreateApiKeyInput {
  name: string;
  access_mode: ApiKeyAccessMode;
  product_ids: string[];
  expires_at: string | null;
}

export interface PublicProductRead {
  id: string;
  name: string;
  short_name?: string | null;
  slug: string;
  headline?: string | null;
  tag?: string | null;
  category?: string | null;
  product_status: string;
  is_featured: boolean;
  sort_order: number;
  description?: string | null;
  features: string[];
  highlights: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
  dashboard_snapshot?: Record<string, unknown> | null;
  dashboard_enabled: boolean;
  api_enabled: boolean;
  documentation?: string | null;
}

export interface PublicCatalogResponse {
  featured: PublicProductRead | null;
  active: PublicProductRead[];
  upcoming: PublicProductRead[];
}

export async function getPublicCatalog(): Promise<PublicCatalogResponse> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/products`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    throw new CoreApiError("Failed to fetch public catalog", response.status);
  }
  return response.json() as Promise<PublicCatalogResponse>;
}

export async function getPublicProductDetail(
  slug: string,
): Promise<PublicProductRead> {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/v1/products/${slug}`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    },
  );
  if (!response.ok) {
    throw new CoreApiError(
      `Failed to fetch public product detail for ${slug}`,
      response.status,
    );
  }
  return response.json() as Promise<PublicProductRead>;
}

export function listOrganizationProducts(
  organizationId: string,
  token: string,
) {
  return coreRequest<CoreProduct[]>(
    `/v1/organizations/${organizationId}/products`,
    token,
  );
}
export function listApiKeys(organizationId: string, token: string) {
  return coreRequest<CoreApiKey[]>(
    `/v1/organizations/${organizationId}/api-keys`,
    token,
  );
}
export function createApiKey(
  organizationId: string,
  token: string,
  input: CreateApiKeyInput,
) {
  return coreRequest<CreatedApiKey>(
    `/v1/organizations/${organizationId}/api-keys`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}
export function revokeApiKey(
  organizationId: string,
  apiKeyId: string,
  token: string,
) {
  return coreRequest<CoreApiKey>(
    `/v1/organizations/${organizationId}/api-keys/${apiKeyId}/revoke`,
    token,
    { method: "POST" },
  );
}

export interface ProductDocumentation {
  product_id: string;
  product_name: string;
  product_slug: string;
  documentation: string;
  access_status: "active" | "pending" | "expired" | "disabled";
  updated_at: string | null;
}

export function getProductDocumentation(
  organizationId: string,
  slug: string,
  token: string,
) {
  return coreRequest<ProductDocumentation>(
    `/v1/organizations/${organizationId}/products/${slug}/docs`,
    token,
  );
}

export type IntegrationStatus = "active" | "disabled" | "deprecated";
export interface CoreIntegration {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  status: IntegrationStatus;
  icon_key: string | null;
}

export type IntegrationCapabilityStatus = "active" | "disabled" | "deprecated";
export interface CoreIntegrationCapability {
  id: string;
  integration_id: string;
  slug: string;
  name: string;
  description: string | null;
  status: IntegrationCapabilityStatus;
}

export type IntegrationConnectionStatus =
  "draft" | "pending" | "connected" | "error" | "disabled";
export interface CoreIntegrationConnection {
  id: string;
  organization_id: string;
  integration_id: string;
  name: string;
  status: IntegrationConnectionStatus;
  configuration: Record<string, unknown>;
  /** Compatibility projection only — real provider identity is verified and
   * owned by the backend's IntegrationTarget, not writable here. */
  external_reference: string | null;
  last_verified_at: string | null;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_code: string | null;
  created_at: string;
}
export interface CreateConnectionInput {
  integration_id: string;
  name: string;
  configuration?: Record<string, unknown>;
  external_reference?: string | null;
}

export interface CoreConnectionCapability {
  capability_id: string;
  enabled: boolean;
  capability: CoreIntegrationCapability;
}

export interface CoreConnectionScope {
  scope_type: string;
  scope_key: string;
  included: boolean;
  extra: Record<string, unknown>;
}
export interface AddConnectionScopeInput {
  scope_type: string;
  scope_key: string;
  included?: boolean;
  extra?: Record<string, unknown>;
}

export function listIntegrations(
  token: string,
  statusFilter?: IntegrationStatus,
) {
  const query = statusFilter ? `?status_filter=${statusFilter}` : "";
  return coreRequest<CoreIntegration[]>(`/v1/integrations${query}`, token);
}
export function listIntegrationCapabilities(
  integrationId: string,
  token: string,
) {
  return coreRequest<CoreIntegrationCapability[]>(
    `/v1/integrations/${integrationId}/capabilities`,
    token,
  );
}

export function listConnections(organizationId: string, token: string) {
  return coreRequest<CoreIntegrationConnection[]>(
    `/v1/organizations/${organizationId}/integrations/connections`,
    token,
  );
}
export function getConnection(
  organizationId: string,
  connectionId: string,
  token: string,
) {
  return coreRequest<CoreIntegrationConnection>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}`,
    token,
  );
}
export function createConnection(
  organizationId: string,
  token: string,
  input: CreateConnectionInput,
) {
  return coreRequest<CoreIntegrationConnection>(
    `/v1/organizations/${organizationId}/integrations/connections`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export interface UpdateConnectionInput {
  name?: string | null;
  configuration?: Record<string, unknown> | null;
  external_reference?: string | null;
}

export function updateConnection(
  organizationId: string,
  connectionId: string,
  token: string,
  input: UpdateConnectionInput,
) {
  return coreRequest<CoreIntegrationConnection>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}`,
    token,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}
export function disableConnection(
  organizationId: string,
  connectionId: string,
  token: string,
) {
  return coreRequest<CoreIntegrationConnection>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/disable`,
    token,
    { method: "POST" },
  );
}
export function enableConnection(
  organizationId: string,
  connectionId: string,
  token: string,
) {
  return coreRequest<CoreIntegrationConnection>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/enable`,
    token,
    { method: "POST" },
  );
}
export function removeConnection(
  organizationId: string,
  connectionId: string,
  token: string,
) {
  return coreRequest<void>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}`,
    token,
    { method: "DELETE" },
  );
}

export function listConnectionCapabilities(
  organizationId: string,
  connectionId: string,
  token: string,
  enabledOnly = false,
) {
  return coreRequest<CoreConnectionCapability[]>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/capabilities?enabled_only=${enabledOnly}`,
    token,
  );
}
export function setConnectionCapabilities(
  organizationId: string,
  connectionId: string,
  token: string,
  capabilityIds: string[],
) {
  return coreRequest<CoreConnectionCapability[]>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/capabilities`,
    token,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capability_ids: capabilityIds }),
    },
  );
}

export function listConnectionScopes(
  organizationId: string,
  connectionId: string,
  token: string,
) {
  return coreRequest<CoreConnectionScope[]>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/scopes`,
    token,
  );
}
export function addConnectionScope(
  organizationId: string,
  connectionId: string,
  token: string,
  input: AddConnectionScopeInput,
) {
  return coreRequest<CoreConnectionScope>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/scopes`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}
export function removeConnectionScope(
  organizationId: string,
  connectionId: string,
  token: string,
  scopeType: string,
  scopeKey: string,
) {
  return coreRequest<void>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/scopes/${encodeURIComponent(scopeType)}/${encodeURIComponent(scopeKey)}`,
    token,
    { method: "DELETE" },
  );
}

export interface CoreAWSConnectionSetup {
  cloudformation_supported: boolean;
  cloudformation_url: string | null;
  external_id: string | null;
  stack_name: string | null;
}

export function getConnectionAwsSetup(
  organizationId: string,
  connectionId: string,
  token: string,
) {
  return coreRequest<CoreAWSConnectionSetup>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/setup`,
    token,
  );
}

export interface CoreVerifyAwsConnectionResult {
  connection: CoreIntegrationConnection;
}

export interface SubmitContactMessageInput {
  name: string;
  email: string;
  message: string;
  company?: string;
  subject?: string;
}

export async function submitContactMessage(
  input: SubmitContactMessageInput,
): Promise<void> {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/v1/site/contact-message`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    const message = await extractErrorMessage(
      response,
      "Unable to send your message. Please try again.",
    );
    throw new CoreApiError(message, response.status);
  }
}

export function verifyAwsConnection(
  organizationId: string,
  connectionId: string,
  token: string,
  awsAccountId: string,
) {
  return coreRequest<CoreVerifyAwsConnectionResult>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/verify-aws`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aws_account_id: awsAccountId }),
    },
  );
}

export type SyncTrigger =
  "bootstrap" | "manual" | "scheduled" | "backfill" | "reconciliation";
export type SyncRunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "partially_succeeded"
  | "failed"
  | "cancel_requested"
  | "cancelled";
export type SyncJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped"
  | "cancel_requested"
  | "cancelled";
export type SyncStrategy = "snapshot" | "incremental" | "windowed";

export interface CoreSyncJob {
  id: string;
  target_id: string;
  dataset: string;
  strategy: SyncStrategy;
  status: SyncJobStatus;
  attempt: number;
  records_read: number;
  records_created: number;
  records_updated: number;
  records_deleted: number;
  error_code: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface CoreSyncRun {
  id: string;
  organization_id: string;
  connection_id: string;
  trigger: SyncTrigger;
  status: SyncRunStatus;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface CoreSyncRunDetail extends CoreSyncRun {
  jobs: CoreSyncJob[];
}

export interface CoreSyncRunListResponse {
  items: CoreSyncRun[];
  total: number;
}

export interface StartSyncInput {
  datasets: string[];
  target_id?: string | null;
}

export function startSync(
  organizationId: string,
  connectionId: string,
  token: string,
  input: StartSyncInput,
) {
  return coreRequest<CoreSyncRun>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/syncs`,
    token,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function listSyncRuns(
  organizationId: string,
  connectionId: string,
  token: string,
  params: { limit: number; offset: number },
) {
  return coreRequest<CoreSyncRunListResponse>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/syncs?limit=${params.limit}&offset=${params.offset}`,
    token,
  );
}

export function getSyncRun(
  organizationId: string,
  connectionId: string,
  syncRunId: string,
  token: string,
) {
  return coreRequest<CoreSyncRunDetail>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/syncs/${syncRunId}`,
    token,
  );
}

export interface CoreResource {
  id: string;
  organization_id: string;
  connection_id: string;
  target_id: string;
  provider: string;
  provider_resource_type: string;
  resource_type: string;
  category: string;
  external_id: string;
  provider_resource_key: string;
  name: string | null;
  region: string;
  zone: string | null;
  status: string;
  tags: Record<string, string>;
  extra: Record<string, unknown>;
  first_seen_at: string;
  last_seen_at: string;
}

export interface CoreResourceListResponse {
  items: CoreResource[];
  total: number;
}

export interface ListResourcesParams {
  limit: number;
  offset: number;
  category?: string | null;
  resourceType?: string | null;
  region?: string | null;
  status?: string | null;
}

export function listResources(
  organizationId: string,
  connectionId: string,
  token: string,
  params: ListResourcesParams,
) {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.category) query.set("category", params.category);
  if (params.resourceType) query.set("resource_type", params.resourceType);
  if (params.region) query.set("region", params.region);
  if (params.status) query.set("status", params.status);
  return coreRequest<CoreResourceListResponse>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/resources?${query.toString()}`,
    token,
  );
}
