import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoreApiError, getProductDocumentation } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { ProductDocsView } from "@/components/dashboard/product-docs-view";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Documentation — ${slug.charAt(0).toUpperCase() + slug.slice(1)}`,
    robots: { index: false, follow: false },
  };
}

export default async function ProductDocsPage({
  params,
}: PageProps<"/dashboard/products/[slug]">) {
  const { slug } = await params;
  const { token, organization } = await requireDashboardOrganization();

  let docs;
  try {
    docs = await getProductDocumentation(
      organization.organization_id,
      slug,
      token,
    );
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return <ProductDocsView docs={docs} />;
}
