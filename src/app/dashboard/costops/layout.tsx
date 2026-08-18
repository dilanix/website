import { notFound, redirect } from "next/navigation";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import { listOrganizationProducts } from "@/lib/core/api";
import { CostOpsProvider } from "@/features/costops/costops-context";
import { getSnapshot } from "@/features/costops/api/costops-api";
export default async function CostOpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAccessToken();
  if (!token) redirect("/sign-in");
  const me = await getMe(token);
  const organization = me.organizations[0];
  if (!organization) notFound();
  const products = await listOrganizationProducts(
    organization.organization_id,
    token,
  );
  if (
    !products.some(
      (product) =>
        product.slug === "costops" && product.access_status === "active",
    )
  )
    notFound();
  const snapshot = await getSnapshot(organization.organization_id, token);
  return (
    <CostOpsProvider
      organizationId={organization.organization_id}
      initialSnapshot={snapshot}
    >
      {children}
    </CostOpsProvider>
  );
}
