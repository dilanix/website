import { coreRequest } from "@/lib/core/api";
import type {
  CostOpsRecommendation,
  CostOpsRecommendationSummary,
  RecommendationCategory,
  RecommendationStatus,
} from "./types";

export interface RecommendationFilters {
  status?: RecommendationStatus;
  category?: RecommendationCategory;
  minSavings?: number;
}

export async function listRecommendations(
  organizationId: string,
  token: string,
  filters?: RecommendationFilters,
): Promise<CostOpsRecommendation[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.minSavings !== undefined)
    params.set("min_savings", filters.minSavings.toString());

  const queryString = params.toString() ? `?${params.toString()}` : "";
  return await coreRequest<CostOpsRecommendation[]>(
    `/v1/organizations/${organizationId}/costops/recommendations${queryString}`,
    token,
  );
}

export async function getRecommendationsSummary(
  organizationId: string,
  token: string,
): Promise<CostOpsRecommendationSummary> {
  return await coreRequest<CostOpsRecommendationSummary>(
    `/v1/organizations/${organizationId}/costops/recommendations/summary`,
    token,
  );
}

export async function updateRecommendationStatus(
  organizationId: string,
  recommendationId: string,
  status: RecommendationStatus,
  token: string,
  dismissedReason?: string,
): Promise<CostOpsRecommendation> {
  return await coreRequest<CostOpsRecommendation>(
    `/v1/organizations/${organizationId}/costops/recommendations/${recommendationId}`,
    token,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        dismissed_reason: dismissedReason ?? null,
      }),
    },
  );
}

export async function evaluateRecommendations(
  organizationId: string,
  token: string,
): Promise<{ status: string; evaluated_count: number }> {
  return await coreRequest<{ status: string; evaluated_count: number }>(
    `/v1/organizations/${organizationId}/costops/recommendations/evaluate`,
    token,
    {
      method: "POST",
    },
  );
}
