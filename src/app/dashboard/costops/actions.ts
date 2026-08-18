"use server";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import { CoreApiError } from "@/lib/core/api";
import * as api from "@/features/costops/api/costops-api";
type Result<T> = { data?: T; error?: string; status?: number };
async function context() {
  const token = await getAccessToken();
  if (!token) throw new Error("Your session has expired.");
  const me = await getMe(token);
  const organization = me.organizations[0];
  if (!organization) throw new Error("No organization is available.");
  return { token, organizationId: organization.organization_id };
}
const message = (error: unknown) =>
  error instanceof CoreApiError || error instanceof Error
    ? error.message
    : "Unable to complete the request.";
async function execute<T>(
  fn: (organizationId: string, token: string) => Promise<T>,
): Promise<Result<T>> {
  try {
    const { token, organizationId } = await context();
    return { data: await fn(organizationId, token) };
  } catch (error) {
    return {
      error: message(error),
      status: error instanceof CoreApiError ? error.status : undefined,
    };
  }
}
export const refreshCostOpsAction = async () =>
  execute((organizationId, token) => api.getSnapshot(organizationId, token));
export const getIntegrationAction = async (id: string) =>
  execute((organizationId, token) =>
    api.getIntegration(organizationId, id, token),
  );
export const createIntegrationAction = async (name: string) =>
  execute((organizationId, token) =>
    api.createIntegration(organizationId, name, token),
  );
export const verifyIntegrationAction = async (
  id: string,
  awsAccountId: string,
) =>
  execute((organizationId, token) =>
    api.verifyIntegration(organizationId, id, awsAccountId, token),
  );
export const triggerSyncAction = async (id: string) =>
  execute((organizationId, token) =>
    api.triggerSync(organizationId, id, token),
  );
export const disableIntegrationAction = async (id: string) =>
  execute((organizationId, token) =>
    api.disableIntegration(organizationId, id, token),
  );
export const queryCostsAction = async (
  query: Record<string, string | undefined>,
) =>
  execute((organizationId, token) =>
    api.queryCosts(organizationId, token, query),
  );
