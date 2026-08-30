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
  /** Bounded unit-of-work count known upfront by a collector that reports one
   * (e.g. AWS inventory's family x region fan-out) — `null` means "unknown",
   * never zero, so a progress bar must not render until this is non-null. */
  total_stages: number | null;
  /** Bumped alongside `heartbeat_at` for each completed unit of work; the
   * numerator matching `total_stages`. */
  completed_stages: number;
  /** Human-readable label of the most recently completed unit of work (e.g.
   * "ec2.instance (us-east-1)") — the last *completed* stage, not one in
   * flight, since progress only becomes visible once a unit is durably
   * persisted. */
  current_stage: string | null;
  error_code: string | null;
  error_message: string | null;
  started_at: string | null;
  /** Bumped every time the job durably persists one bounded unit of work (e.g.
   * one AWS resource family/region) while still `running` — not just at
   * completion. Lets the UI show the job is actively progressing, not stalled,
   * long before `finished_at` exists. */
  heartbeat_at: string | null;
  finished_at: string | null;
  /** Set once cancellation is requested for this job — independent of
   * whether the collector executing it ever checks for it (cancellation is
   * cooperative; a job may still finish normally after this is set). */
  cancel_requested_at: string | null;
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

/**
 * Requests cooperative cancellation of an in-flight run (`SyncService.request_cancel`
 * on Core): a `queued` job is cancelled outright, a `running` job is asked to stop
 * at its next safe boundary and may finish anyway. Idempotent while the run is
 * still non-terminal; Core returns `409` once it has already finished.
 */
export function cancelSync(
  organizationId: string,
  connectionId: string,
  syncRunId: string,
  token: string,
) {
  return coreRequest<CoreSyncRun>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/syncs/${syncRunId}/cancel`,
    token,
    { method: "POST" },
  );
}

/**
 * Mirrors Dilanix Core's `SyncPolicyRead` (`modules/sync/schemas/policy.py`) — a
 * per-dataset automatic sync schedule. `target_id: null` means the policy applies
 * across every verified target under the connection, matching `StartSyncInput`.
 * `next_run_at: null` means either disabled, or not yet claimed by the scheduler.
 */
export interface CoreSyncPolicy {
  id: string;
  connection_id: string;
  target_id: string | null;
  dataset: string;
  enabled: boolean;
  interval_seconds: number | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoreSyncPolicyListResponse {
  items: CoreSyncPolicy[];
}

/** Create-or-update, addressed by (connection, target, dataset) — never a policy
 * id — mirroring the backend's `PUT .../sync-policies` upsert semantics. */
export interface SetSyncPolicyInput {
  dataset: string;
  enabled: boolean;
  interval_seconds: number | null;
  target_id?: string | null;
}

export function setSyncPolicy(
  organizationId: string,
  connectionId: string,
  token: string,
  input: SetSyncPolicyInput,
) {
  return coreRequest<CoreSyncPolicy>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/sync-policies`,
    token,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function listSyncPolicies(
  organizationId: string,
  connectionId: string,
  token: string,
) {
  return coreRequest<CoreSyncPolicyListResponse>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/sync-policies`,
    token,
  );
}

export function deleteSyncPolicy(
  organizationId: string,
  connectionId: string,
  syncPolicyId: string,
  token: string,
) {
  return coreRequest<void>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/sync-policies/${syncPolicyId}`,
    token,
    { method: "DELETE" },
  );
}

/**
 * Mirrors Dilanix Core's `ResourceSpecificationRead` (`modules/catalog/schemas.py`)
 * — a platform-global, provider-owned technical specification, never tenant data.
 * `attributes` uses the canonical, provider-neutral vocabulary Core's catalog
 * providers normalize into (e.g. `compute.vcpu`, `memory.bytes`); it is
 * intentionally untyped/open-ended here for the same reason it's untyped on the
 * backend — a new attribute must never require a frontend change to render.
 */
export interface CoreResourceSpecification {
  attributes: Record<string, unknown>;
  last_refreshed_at: string;
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
  /** The provider's own SKU/class (e.g. EC2 `t3a.medium`, RDS `db.t4g.medium`) — null for resource types with no meaningful one. */
  provider_sku: string | null;
  name: string | null;
  region: string;
  zone: string | null;
  status: string;
  /**
   * Dilanix's own view of whether this Resource still authoritatively exists —
   * independent from `status` above, which is the provider's own field (e.g. a
   * `terminated` EC2 instance the provider still returns is still `active` here).
   * `"active" | "missing" | "out_of_scope"` — kept as `string` since the backend
   * enum is a plain `StrEnum`, not a fixed set the frontend must fully enumerate.
   */
  lifecycle_status: string;
  missing_since: string | null;
  out_of_scope_since: string | null;
  tags: Record<string, string>;
  extra: Record<string, unknown>;
  /**
   * This resource's own configured/provisioned capacity (an ECS task's
   * vCPU/memory, an EBS volume's size/IOPS/throughput, a provisioned DynamoDB
   * table's read/write capacity units) — the same canonical dotted-key
   * vocabulary as `specification.attributes` (`compute.vcpu`, `memory.bytes`,
   * ...), but never the same data: a resource whose size comes from a
   * provider SKU (EC2/RDS/ElastiCache) gets it via `specification` instead,
   * never duplicated here. Empty for resource types with no capacity concept
   * at all (S3, VPC, security group, EKS cluster, ...) — never a fake `0`.
   */
  capacity: Record<string, unknown>;
  first_seen_at: string;
  last_seen_at: string;
  /** Null until `modules.catalog` resolves it asynchronously — a resource with a `provider_sku` and no `specification` yet is normal, not an error. */
  specification: CoreResourceSpecification | null;
  /**
   * Server-computed `"2 vCPU · 4 GiB"` / `"500 GiB · 12K IOPS"` / ... —
   * checks `specification.attributes` first, then `capacity`
   * (`modules.inventory.summary.technical_summary` in Core). `null` when
   * this resource type has no capacity concept — never a placeholder.
   */
  technical_summary: string | null;
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
  /** Omitted -> the backend defaults to `active` only; pass `"missing"`/`"out_of_scope"` to see historical Resources. */
  lifecycleStatus?: string | null;
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
  if (params.lifecycleStatus)
    query.set("lifecycle_status", params.lifecycleStatus);
  return coreRequest<CoreResourceListResponse>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/resources?${query.toString()}`,
    token,
  );
}

export interface CoreResourceCategoryType {
  category: string;
  resource_type: string;
}

/**
 * The distinct category/resource_type/region combinations this connection's
 * resources actually have right now (`ResourceService.list_resource_filter_options`
 * in Core) — never a fixed enum, and never AWS-specific: `category`/
 * `resource_type` are Core's provider-neutral `Resource` fields
 * (`modules.inventory.models.Resource`), so this reflects whatever this
 * connection's provider actually produced (AWS today, any future provider
 * automatically). Backs filter dropdowns so an option is only ever offered
 * when it genuinely matches something, instead of the frontend hardcoding a
 * resource-family list.
 */
export interface CoreResourceFilterOptions {
  category_types: CoreResourceCategoryType[];
  regions: string[];
}

export function listResourceFilters(
  organizationId: string,
  connectionId: string,
  token: string,
) {
  return coreRequest<CoreResourceFilterOptions>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/resources/filters`,
    token,
  );
}
