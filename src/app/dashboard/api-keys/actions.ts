"use server";
import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import {
  createApiKey,
  revokeApiKey,
  CoreApiError,
  type CreatedApiKey,
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

export async function createApiKeyAction(input: {
  name: string;
  accessMode: "full" | "restricted";
  productIds: string[];
  expiresAt: string | null;
}): Promise<ActionResult<CreatedApiKey>> {
  try {
    const { token, organizationId } = await context();
    const data = await createApiKey(organizationId, token, {
      name: input.name,
      access_mode: input.accessMode,
      product_ids: input.accessMode === "restricted" ? input.productIds : [],
      expires_at: input.expiresAt,
    });
    revalidatePath("/dashboard/api-keys");
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}
export async function revokeApiKeyAction(
  apiKeyId: string,
): Promise<ActionResult> {
  try {
    const { token, organizationId } = await context();
    await revokeApiKey(organizationId, apiKeyId, token);
    revalidatePath("/dashboard/api-keys");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}
