import type { Metadata } from "next";
import { IntegrationsView } from "@/features/costops/components/integrations-view";
export const metadata: Metadata = {
  title: "Integrations — CostOps",
  robots: { index: false, follow: false },
};
export default function IntegrationsPage() {
  return <IntegrationsView />;
}
