import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TourProvider } from "@/components/tours/tour-provider";
import { DashboardFilterStorageProvider } from "@/lib/dashboard/filter-storage";
import {
  getOrganizationPlan,
  listOrganizationCapabilities,
  listOrganizationProducts,
  listTourProgress,
  type CoreOrganizationCapability,
} from "@/lib/core/api";
import type { DashboardProduct } from "@/lib/data/dashboard-mocks";
import { toDashboardProduct } from "@/lib/dashboard/products";
import { getDashboardSession } from "@/lib/dashboard/session";

// Signed-in pages are never search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const { token, me, organization } = await getDashboardSession();
  const [[products, organizationCapabilities], tourProgress, plan] =
    await Promise.all([
      organization
        ? Promise.all([
            listOrganizationProducts(organization.organization_id, token).then(
              (items) => items.map((product) => toDashboardProduct(product)),
            ),
            listOrganizationCapabilities(organization.organization_id, token),
          ])
        : Promise.resolve<[DashboardProduct[], CoreOrganizationCapability[]]>([
            [],
            [],
          ]),
      // Tours are an enhancement: without progress they never auto-start.
      listTourProgress(token).catch(() => null),
      // The plan badge/banner are an enhancement too: the rest of the
      // dashboard renders without them if Core can't answer.
      organization
        ? getOrganizationPlan(organization.organization_id, token).catch(
            () => null,
          )
        : Promise.resolve(null),
    ]);

  return (
    <TourProvider
      progress={tourProgress}
      activeProducts={products
        .filter((product) => product.status === "active")
        .map(({ slug, name }) => ({ slug, name }))}
      hasOrganization={organization !== null}
    >
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
        plan={plan}
        activeCapabilityCodes={organizationCapabilities
          .filter((capability) => capability.access_status === "active")
          .map((capability) => capability.code)}
      >
        <DashboardFilterStorageProvider
          namespace={organization?.organization_id ?? `user:${me.email}`}
        >
          {children}
        </DashboardFilterStorageProvider>
      </DashboardShell>
    </TourProvider>
  );
}
