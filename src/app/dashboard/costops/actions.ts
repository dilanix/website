"use server";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import { CoreApiError } from "@/lib/core/api";
import * as api from "@/features/costops/api/costops-api";
import {
  listRecommendations,
  updateRecommendationStatus,
  evaluateRecommendations,
} from "@/features/costops/recommendations/api";
import type {
  RecommendationCategory,
  RecommendationStatus,
} from "@/features/costops/recommendations/types";
import type {
  CostSeriesGroupBy,
  OverviewPeriod,
} from "@/features/costops/types";
import type { ResourceQuery } from "@/features/costops/resources/types";
import type { TimeRange } from "@/features/costops/resources/analytics/types";
import type { AnalysisPolicyDefinition } from "@/features/costops/policies/types";
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
export const getSyncHealthAction = async (query: {
  integrationId?: string;
  status?: string;
  warningsOnly?: boolean;
  page?: number;
}) =>
  execute((organizationId, token) =>
    api.getSyncHealth(organizationId, token, query),
  );
export const updateSyncSettingsAction = async (
  id: string,
  autoSyncIntervalMinutes: 60 | 360 | 720 | 1440 | null,
) =>
  execute((organizationId, token) =>
    api.updateSyncSettings(organizationId, id, autoSyncIntervalMinutes, token),
  );
export const disableIntegrationAction = async (id: string) =>
  execute((organizationId, token) =>
    api.disableIntegration(organizationId, id, token),
  );
export const deleteIntegrationAction = async (id: string) =>
  execute((organizationId, token) =>
    api.deleteIntegration(organizationId, id, token),
  );
export const queryCostsAction = async (
  query: Record<string, string | undefined>,
) =>
  execute((organizationId, token) =>
    api.queryCosts(organizationId, token, query),
  );
export const queryCostSeriesAction = async (
  query: {
    start_date?: string;
    end_date?: string;
    group_by: CostSeriesGroupBy;
    integration_id?: string;
    cloud_account_id?: string;
    service_name?: string;
    region?: string;
  },
  currency: string | null,
) =>
  execute((organizationId, token) =>
    api.queryCostSeries(organizationId, token, query, currency),
  );
export const queryOverviewAction = async (
  period: OverviewPeriod,
  currency: string | null,
) =>
  execute((organizationId, token) =>
    api.getOverview(organizationId, token, currency, period),
  );
export const queryResourcesAction = async (query: ResourceQuery) =>
  execute((organizationId, token) =>
    api.listResources(organizationId, token, query),
  );
export const resourceFilterOptionsAction = async () =>
  execute((organizationId, token) =>
    api.getResourceFilterOptions(organizationId, token),
  );
export const getResourceAction = async (resourceId: string) =>
  execute((organizationId, token) =>
    api.getResource(organizationId, resourceId, token),
  );
export const getResourceAnalyticsAction = async (
  resourceId: string,
  range: TimeRange,
) =>
  execute((organizationId, token) =>
    api.getResourceAnalytics(organizationId, resourceId, range, token),
  );
export const getResourceEvidenceAction = async (resourceId: string) =>
  execute((organizationId, token) =>
    api.getResourceEvidence(organizationId, resourceId, token),
  );
export const getResourceEvidenceHistoryAction = async (resourceId: string) =>
  execute((organizationId, token) =>
    api.getResourceEvidenceHistory(organizationId, resourceId, token),
  );
export const listAnalysisPoliciesAction = async () =>
  execute((_organizationId, token) => api.listAnalysisPolicies(token));
export const createAnalysisPolicyAction = async (input: {
  resourceType: string;
  version: string;
  definition: AnalysisPolicyDefinition;
  activate: boolean;
}) =>
  execute((_organizationId, token) => api.createAnalysisPolicy(token, input));
export const activateAnalysisPolicyAction = async (policyId: string) =>
  execute((_organizationId, token) =>
    api.activateAnalysisPolicy(token, policyId),
  );
export const listRecommendationsAction = async (filters?: {
  status?: RecommendationStatus;
  category?: RecommendationCategory;
  minSavings?: number;
}) =>
  execute((organizationId, token) =>
    listRecommendations(organizationId, token, filters),
  );
export const updateRecommendationStatusAction = async (
  recommendationId: string,
  status: RecommendationStatus,
  dismissedReason?: string,
) =>
  execute((organizationId, token) =>
    updateRecommendationStatus(
      organizationId,
      recommendationId,
      status,
      token,
      dismissedReason,
    ),
  );
export const evaluateRecommendationsAction = async () =>
  execute((organizationId, token) =>
    evaluateRecommendations(organizationId, token),
  );
