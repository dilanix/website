import type { Metadata } from "next";
import { listAllRecommendations } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { PageHeader } from "@/components/dashboard/primitives";
import { RecommendationsInboxClient } from "@/components/dashboard/recommendations-inbox-client";

export const metadata: Metadata = {
  title: "Recommendations",
  robots: { index: false, follow: false },
};

export default async function RecommendationsPage() {
  const { token, organization } = await requireDashboardOrganization();
  const initial = await listAllRecommendations(
    organization.organization_id,
    token,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Insights"
        title="Recommendations"
        description="A unified, cross-product inbox of deterministic optimization findings — never gated by a single product's own access grant."
      />
      <RecommendationsInboxClient initial={initial} />
    </div>
  );
}
