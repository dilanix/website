import type { Metadata } from "next";
import { CostsView } from "@/features/costops/components/costs-view";
export const metadata: Metadata = {
  title: "Costs — CostOps",
  robots: { index: false, follow: false },
};
export default function CostsPage() {
  return <CostsView />;
}
