import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  listOrganizationCapabilities,
  listOrganizationProducts,
} from "@/lib/core/api";
import { toDashboardProduct } from "@/lib/dashboard/products";
import { getDashboardSession } from "@/lib/dashboard/session";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const { token, me, organization } = await getDashboardSession();
  const [products, organizationCapabilities] = organization
    ? await Promise.all([
        listOrganizationProducts(organization.organization_id, token).then(
          (items) => items.map((product) => toDashboardProduct(product)),
        ),
        listOrganizationCapabilities(organization.organization_id, token),
      ])
    : [[], []];

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
      activeCapabilityCodes={organizationCapabilities
        .filter((capability) => capability.access_status === "active")
        .map((capability) => capability.code)}
    >
      {children}
    </DashboardShell>
  );
}
