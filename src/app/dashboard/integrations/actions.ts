"use server";
import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import {
  createConnection,
  updateConnection,
  disableConnection,
  enableConnection,
  markConnectionConnected,
  removeConnection,
  setConnectionCapabilities,
  addConnectionScope,
  removeConnectionScope,
  triggerConnectionSync,
  getConnectionSyncRun,
  verifyAwsConnection,
  getConnectionAwsSetup,
  CoreApiError,
  type CoreIntegrationConnection,
  type UpdateConnectionInput,
  type CoreConnectionCapability,
  type CoreConnectionScope,
  type CoreConnectionSyncRun,
  type CoreAWSConnectionSetup,
  type CoreVerifyAwsConnectionResult,
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

export async function markConnectionConnectedAction(
  connectionId: string,
): Promise<ActionResult<CoreIntegrationConnection>> {
  try {
    const { token, organizationId } = await context();
    const data = await markConnectionConnected(
      organizationId,
      connectionId,
      token,
    );
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

export async function triggerConnectionSyncAction(
  connectionId: string,
): Promise<ActionResult<CoreConnectionSyncRun>> {
  try {
    const { token, organizationId } = await context();
    const data = await triggerConnectionSync(
      organizationId,
      connectionId,
      token,
    );
    revalidatePath(`/dashboard/integrations/${connectionId}`);
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}

export async function getConnectionSyncRunAction(
  connectionId: string,
  syncRunId: string,
): Promise<ActionResult<CoreConnectionSyncRun>> {
  try {
    const { token, organizationId } = await context();
    const data = await getConnectionSyncRun(
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
