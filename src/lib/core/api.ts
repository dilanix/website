import { env } from "@/env";

export class CoreApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
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
    let message = "Dilanix Core request failed.";
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail)) {
        const details = body.detail
          .map((item) =>
            item && typeof item === "object" && "msg" in item
              ? String(item.msg)
              : "",
          )
          .filter(Boolean);
        if (details.length) message = details.join(" ");
      }
    } catch {}
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
  "draft" | "pending" | "connected" | "degraded" | "error" | "disabled";
export interface CoreIntegrationConnection {
  id: string;
  organization_id: string;
  integration_id: string;
  name: string;
  status: IntegrationConnectionStatus;
  configuration: Record<string, unknown>;
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
export function markConnectionConnected(
  organizationId: string,
  connectionId: string,
  token: string,
) {
  return coreRequest<CoreIntegrationConnection>(
    `/v1/organizations/${organizationId}/integrations/connections/${connectionId}/mark-connected`,
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
