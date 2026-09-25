"use server";

import { getMe } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
import {
  CoreApiError,
  listAllRecommendations,
  type CoreUnifiedRecommendationListResponse,
  type RecommendationStatus,
} from "@/lib/core/api";

export type RecommendationsActionResult<T = undefined> = {
  data?: T;
  error?: string;
};

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

export async function listAllRecommendationsAction(
  filters: {
    productKey?: string | null;
    status?: RecommendationStatus | "all";
    analyzerKey?: string | null;
  },
  offset: number,
): Promise<RecommendationsActionResult<CoreUnifiedRecommendationListResponse>> {
  try {
    const { token, organizationId } = await context();
    const data = await listAllRecommendations(organizationId, token, {
      productKey: filters.productKey,
      status:
        !filters.status || filters.status === "all" ? null : filters.status,
      analyzerKey: filters.analyzerKey,
      offset,
    });
    return { data };
  } catch (error) {
    return { error: message(error) };
  }
}
