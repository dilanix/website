import type { Metadata } from "next";
import { Suspense } from "react";
import { ResourcesView } from "@/features/costops/resources/components/resources-view";

export const metadata: Metadata = {
  title: "Resources — CostOps",
  robots: { index: false, follow: false },
};

export default function ResourcesPage() {
  return (
    <Suspense fallback={null}>
      <ResourcesView />
    </Suspense>
  );
}
