import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import { getProductDocumentation } from "@/lib/core/api";
import { ProductDocsView } from "@/components/dashboard/product-docs-view";

export const metadata: Metadata = {
  title: "Documentation — CostOps",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CostOpsDocsPage() {
  const token = await getAccessToken();
  if (!token) redirect("/sign-in");
  const me = await getMe(token);
  const organization = me.organizations[0];
  if (!organization) notFound();

  const docs = await getProductDocumentation(
    organization.organization_id,
    "costops",
    token,
  );

  return <ProductDocsView docs={docs} />;
}
