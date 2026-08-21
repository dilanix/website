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
