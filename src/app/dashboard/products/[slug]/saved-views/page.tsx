import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listSavedViews } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { SavedViewsClient } from "@/components/dashboard/cost/saved-views-client";

export const metadata: Metadata = {
  title: "Saved Views — Cost",
  robots: { index: false, follow: false },
};

export default async function CostSavedViewsPage({
  params,
}: PageProps<"/dashboard/products/[slug]/saved-views">) {
  const { slug } = await params;
  if (slug !== "cost") notFound();

  const { token, me, organization } = await requireDashboardOrganization();
  const { items } = await listSavedViews(organization.organization_id, token);

  return <SavedViewsClient initialSavedViews={items} currentUserId={me.id} />;
}
