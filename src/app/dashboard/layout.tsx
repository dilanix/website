import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listOrganizationProducts } from "@/lib/core/api";
import { toDashboardProduct } from "@/lib/dashboard/products";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const { token, me, organization } = await getDashboardSession();
  const products = organization
    ? (await listOrganizationProducts(organization.organization_id, token)).map(
        (product) => toDashboardProduct(product),
      )
    : [];

  return (
    <DashboardShell
      user={{
        firstName: me.first_name,
        lastName: me.last_name,
        email: me.email,
      }}
      organization={
        organization
          ? {
              name: organization.organization_name,
            }
          : null
      }
      products={products}
    >
      {children}
    </DashboardShell>
  );
}
