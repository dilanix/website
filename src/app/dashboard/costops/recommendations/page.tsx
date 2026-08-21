import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/primitives";
import { getMe } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
import {
  getRecommendationsSummary,
  listRecommendations,
} from "@/features/costops/recommendations/api";
import type {
  CostOpsRecommendation,
  CostOpsRecommendationSummary,
} from "@/features/costops/recommendations/types";
import { RecommendationsView } from "@/features/costops/recommendations/components/recommendations-view";

export const metadata: Metadata = {
  title: "Recommendations — CostOps",
  robots: { index: false, follow: false },
};

export default async function RecommendationsPage() {
  const token = await getAccessToken();
  if (!token) redirect("/sign-in");

  const me = await getMe(token);
  const organization = me.organizations[0];
  if (!organization) notFound();

  let initialRecommendations: CostOpsRecommendation[] = [];
  let initialSummary: CostOpsRecommendationSummary = {
    total_potential_monthly_savings_usd: 0,
    active_recommendations_count: 0,
    applied_recommendations_count: 0,
    dismissed_recommendations_count: 0,
    savings_by_category: {},
    counts_by_category: {},
    top_recommendation: null,
  };

  try {
    const [recs, sum] = await Promise.all([
      listRecommendations(organization.organization_id, token),
      getRecommendationsSummary(organization.organization_id, token),
    ]);
    initialRecommendations = recs;
    initialSummary = sum;
  } catch {
    // If initial fetch encounters an error, graceful fallback to empty state
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Recommendations"
        description="High-confidence optimization opportunities derived from 30-day continuous telemetry and evidence analysis."
      />

      <RecommendationsView
        initialRecommendations={initialRecommendations}
        initialSummary={initialSummary}
      />
    </div>
  );
}
