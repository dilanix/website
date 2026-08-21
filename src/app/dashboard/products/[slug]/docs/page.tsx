import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import { getProductDocumentation } from "@/lib/core/api";
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
  const token = await getAccessToken();
  if (!token) redirect("/sign-in");
  const me = await getMe(token);
  const organization = me.organizations[0];
  if (!organization) notFound();

  let docs;
  try {
    docs = await getProductDocumentation(
      organization.organization_id,
      slug,
      token,
    );
  } catch {
    docs = {
      product_id: slug,
      product_name: slug.charAt(0).toUpperCase() + slug.slice(1),
      product_slug: slug,
      documentation: "",
      access_status: "active" as const,
      updated_at: null,
    };
  }

  return <ProductDocsView docs={docs} />;
}
