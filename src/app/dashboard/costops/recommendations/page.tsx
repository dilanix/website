import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/dashboard/primitives";
export const metadata: Metadata = {
  title: "Recommendations — CostOps",
  robots: { index: false, follow: false },
};
export default function RecommendationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Recommendations"
        description="CostOps will use provider optimization signals and Dilanix analysis to prioritize savings opportunities."
      />
      <EmptyState
        title="Recommendation analysis is not enabled yet"
        description="Optimization recommendations are coming in the next CostOps phase."
      />
    </div>
  );
}
