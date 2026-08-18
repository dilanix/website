import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/primitives";
import { CostsExplorer } from "@/components/dashboard/costs-explorer";
import { getCostRows } from "@/lib/data/dashboard-mocks";
export const metadata: Metadata = {
  title: "Costs — CostOps",
  robots: { index: false, follow: false },
};
export default async function CostsPage() {
  const rows = await getCostRows();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Costs"
        description="Analyze infrastructure and AI spending across providers."
      />
      <CostsExplorer rows={rows} />
    </div>
  );
}
