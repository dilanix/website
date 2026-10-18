import type { Metadata } from "next";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { WelcomePage } from "@/content/docs/pages/getting-started";

export const metadata: Metadata = {
  title: "Documentation",
  robots: { index: false, follow: false },
};

export default async function DocsHomePage() {
  await requireDashboardOrganization();
  return <WelcomePage />;
}
