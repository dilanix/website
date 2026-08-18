import type { Metadata } from "next";
import { OverviewView } from "@/features/costops/components/overview-view";
export const metadata: Metadata = {
  title: "CostOps",
  robots: { index: false, follow: false },
};
export default function CostOpsPage() {
  return <OverviewView />;
}
