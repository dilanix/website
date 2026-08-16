import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/common/placeholder-page";

export const metadata: Metadata = {
  title: "Documentation",
  alternates: { canonical: "/docs" },
};

export default function DocsPage() {
  return (
    <PlaceholderPage title="Documentation">
      Product documentation will appear here as CostOps and future Dilanix
      products mature.
    </PlaceholderPage>
  );
}
