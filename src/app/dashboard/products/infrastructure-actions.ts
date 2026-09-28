"use server";

import { z } from "zod";
import { getMe } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
import {
  CoreApiError,
  getInfrastructureConnection,
  getInfrastructureResource,
  listInfrastructureRelationships,
  type CoreConnectionDetail,
  type CoreGraphNodeDetail,
  type CoreResourceNeighborhood,
} from "@/lib/core/api";

export type InfrastructureActionResult<T> = { data?: T; error?: string };

const idSchema = z.uuid();

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

async function run<T>(
  id: string,
  load: (organizationId: string, id: string, token: string) => Promise<T>,
): Promise<InfrastructureActionResult<T>> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: "Invalid identifier." };
  try {
    const { token, organizationId } = await context();
    return { data: await load(organizationId, parsed.data, token) };
  } catch (error) {
    return { error: message(error) };
  }
}

/** Resource inspector: normalized detail plus the resource's relationships. */
export async function getGraphResourceAction(resourceId: string): Promise<
  InfrastructureActionResult<{
    detail: CoreGraphNodeDetail;
    neighborhood: CoreResourceNeighborhood;
  }>
> {
  return run(resourceId, async (organizationId, id, token) => {
    const [detail, neighborhood] = await Promise.all([
      getInfrastructureResource(organizationId, id, token),
      listInfrastructureRelationships(organizationId, id, token),
    ]);
    return { detail, neighborhood };
  });
}

/** Connection inspector: one relationship with its path, evidence and status. */
export async function getGraphConnectionAction(
  relationshipId: string,
): Promise<InfrastructureActionResult<CoreConnectionDetail>> {
  return run(relationshipId, (organizationId, id, token) =>
    getInfrastructureConnection(organizationId, id, token),
  );
}
