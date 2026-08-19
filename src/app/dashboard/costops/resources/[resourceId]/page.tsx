import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceDetailView } from "@/features/costops/resources/components/resource-detail-view";
import { getResourceAction } from "../../actions";
import { resourceDisplayName } from "@/features/costops/resources/presentation";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/costops/resources/[resourceId]">): Promise<Metadata> {
  const { resourceId } = await params;
  const result = await getResourceAction(resourceId);
  const resource = result.data;
  return {
    title: resource
      ? `${resourceDisplayName(resource)} — Resources — CostOps`
      : "Resource not found — CostOps",
    robots: { index: false, follow: false },
  };
}

export default async function ResourceDetailPage({
  params,
}: PageProps<"/dashboard/costops/resources/[resourceId]">) {
  const { resourceId } = await params;
  const result = await getResourceAction(resourceId);
  if (result.status === 404) notFound();
  if (!result.data) throw new Error("Unable to load resource details.");
  return <ResourceDetailView resource={result.data} />;
}
