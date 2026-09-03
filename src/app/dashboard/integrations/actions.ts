"use server";
import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import {
  createConnection,
  updateConnection,
  disableConnection,
  enableConnection,
  removeConnection,
  setConnectionCapabilities,
  addConnectionScope,
  removeConnectionScope,
  verifyAwsConnection,
  getConnectionAwsSetup,
  startSync,
  listSyncRuns,
  getSyncRun,
  getSyncJobAttempts,
  cancelSync,
  setSyncPolicy,
  listSyncPolicies,
  deleteSyncPolicy,
  listResources,
  listResourceFilters,
  CoreApiError,
  type CoreIntegrationConnection,
  type UpdateConnectionInput,
  type CoreConnectionCapability,
  type CoreConnectionScope,
  type CoreAWSConnectionSetup,
  type CoreVerifyAwsConnectionResult,
  type CoreSyncRun,
  type CoreSyncRunDetail,
  type CoreSyncRunListResponse,
  type CoreSyncJobAttempt,
  type CoreSyncPolicy,
  type CoreSyncPolicyListResponse,
  type SetSyncPolicyInput,
  type CoreResourceListResponse,
  type CoreResourceFilterOptions,
  type ListResourcesParams,
} from "@/lib/core/api";

type ActionResult<T = undefined> = { data?: T; error?: string };

async function context() {
  const token = await getAccessToken();
  if (!token) throw new Error("Your session has expired.");
  const me = await getMe(token);
  const organization = me.organizations[0];
  if (!organization)
    throw new Error("Your account does not belong to an organization.");
  return { token, organizationId: organization.organization_id };
}

function message(error: unknown) {
  return error instanceof CoreApiError || error instanceof Error
    ? error.message
    : "Unable to complete the request.";
}

export async function createConnectionAction(input: {
  integrationId: string;
  name: string;
  externalReference: string | null;
}): Promise<ActionResult<CoreIntegrationConnection>> {
  try {
    const { token, organizationId } = await context();
    const data = await createConnection(organizationId, token, {
      integration_id: input.integrationId,
      name: input.name,
      external_reference: input.externalReference,
    });
    revalidatePath("/dashboard/integrations");
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function updateConnectionAction(
  connectionId: string,
  input: UpdateConnectionInput,
): Promise<ActionResult<CoreIntegrationConnection>> {
  try {
    const { token, organizationId } = await context();
    const data = await updateConnection(
      organizationId,
      connectionId,
      token,
      input,
    );
    revalidatePath("/dashboard/integrations");
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function disableConnectionAction(
  connectionId: string,
): Promise<ActionResult<CoreIntegrationConnection>> {
  try {
    const { token, organizationId } = await context();
    const data = await disableConnection(organizationId, connectionId, token);
    revalidatePath("/dashboard/integrations");
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function enableConnectionAction(
  connectionId: string,
): Promise<ActionResult<CoreIntegrationConnection>> {
  try {
    const { token, organizationId } = await context();
    const data = await enableConnection(organizationId, connectionId, token);
    revalidatePath("/dashboard/integrations");
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function removeConnectionAction(
  connectionId: string,
): Promise<ActionResult> {
  try {
    const { token, organizationId } = await context();
    await removeConnection(organizationId, connectionId, token);
    revalidatePath("/dashboard/integrations");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function setConnectionCapabilitiesAction(
  connectionId: string,
  capabilityIds: string[],
): Promise<ActionResult<CoreConnectionCapability[]>> {
  try {
    const { token, organizationId } = await context();
    const data = await setConnectionCapabilities(
      organizationId,
      connectionId,
      token,
      capabilityIds,
    );
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function addConnectionScopeAction(
  connectionId: string,
  input: { scopeType: string; scopeKey: string; included: boolean },
): Promise<ActionResult<CoreConnectionScope>> {
  try {
    const { token, organizationId } = await context();
    const data = await addConnectionScope(organizationId, connectionId, token, {
      scope_type: input.scopeType,
      scope_key: input.scopeKey,
      included: input.included,
    });
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function getConnectionAwsSetupAction(
  connectionId: string,
): Promise<ActionResult<CoreAWSConnectionSetup>> {
  try {
    const { token, organizationId } = await context();
    const data = await getConnectionAwsSetup(
      organizationId,
      connectionId,
      token,
    );
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function verifyAwsConnectionAction(
  connectionId: string,
  awsAccountId: string,
): Promise<ActionResult<CoreVerifyAwsConnectionResult>> {
  try {
    const { token, organizationId } = await context();
    const data = await verifyAwsConnection(
      organizationId,
      connectionId,
      token,
      awsAccountId,
    );
    revalidatePath("/dashboard/integrations");
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function removeConnectionScopeAction(
  connectionId: string,
  scopeType: string,
  scopeKey: string,
): Promise<ActionResult> {
  try {
    const { token, organizationId } = await context();
    await removeConnectionScope(
      organizationId,
      connectionId,
      token,
      scopeType,
      scopeKey,
    );
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function startSyncAction(
  connectionId: string,
  datasets: string[],
): Promise<ActionResult<CoreSyncRun>> {
  try {
    const { token, organizationId } = await context();
    const data = await startSync(organizationId, connectionId, token, {
      datasets,
    });
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function listSyncRunsAction(
  connectionId: string,
  params: { limit: number; offset: number },
): Promise<ActionResult<CoreSyncRunListResponse>> {
  try {
    const { token, organizationId } = await context();
    const data = await listSyncRuns(
      organizationId,
      connectionId,
      token,
      params,
    );
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function getSyncRunAction(
  connectionId: string,
  syncRunId: string,
): Promise<ActionResult<CoreSyncRunDetail>> {
  try {
    const { token, organizationId } = await context();
    const data = await getSyncRun(
      organizationId,
      connectionId,
      syncRunId,
      token,
    );
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function getSyncJobAttemptsAction(
  connectionId: string,
  syncRunId: string,
  syncJobId: string,
): Promise<ActionResult<CoreSyncJobAttempt[]>> {
  try {
    const { token, organizationId } = await context();
    const data = await getSyncJobAttempts(
      organizationId,
      connectionId,
      syncRunId,
      syncJobId,
      token,
    );
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function cancelSyncAction(
  connectionId: string,
  syncRunId: string,
): Promise<ActionResult<CoreSyncRun>> {
  try {
    const { token, organizationId } = await context();
    const data = await cancelSync(
      organizationId,
      connectionId,
      syncRunId,
      token,
    );
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function setSyncPolicyAction(
  connectionId: string,
  input: SetSyncPolicyInput,
): Promise<ActionResult<CoreSyncPolicy>> {
  try {
    const { token, organizationId } = await context();
    const data = await setSyncPolicy(
      organizationId,
      connectionId,
      token,
      input,
    );
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function listSyncPoliciesAction(
  connectionId: string,
): Promise<ActionResult<CoreSyncPolicyListResponse>> {
  try {
    const { token, organizationId } = await context();
    const data = await listSyncPolicies(organizationId, connectionId, token);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function deleteSyncPolicyAction(
  connectionId: string,
  syncPolicyId: string,
): Promise<ActionResult> {
  try {
    const { token, organizationId } = await context();
    await deleteSyncPolicy(organizationId, connectionId, syncPolicyId, token);
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function listResourcesAction(
  connectionId: string,
  params: ListResourcesParams,
): Promise<ActionResult<CoreResourceListResponse>> {
  try {
    const { token, organizationId } = await context();
    const data = await listResources(
      organizationId,
      connectionId,
      token,
      params,
    );
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function listResourceFiltersAction(
  connectionId: string,
): Promise<ActionResult<CoreResourceFilterOptions>> {
  try {
    const { token, organizationId } = await context();
    const data = await listResourceFilters(organizationId, connectionId, token);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}
