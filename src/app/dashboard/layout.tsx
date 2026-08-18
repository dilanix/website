import { redirect } from "next/navigation";
import { getMe, AuthApiError } from "@/lib/auth/api";
import { getAccessToken } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listOrganizationProducts } from "@/lib/core/api";
import { toDashboardProduct } from "@/lib/dashboard/products";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect("/sign-in");
  }

  let me;
  try {
    me = await getMe(accessToken);
  } catch (error) {
    if (error instanceof AuthApiError) {
      redirect("/api/auth/logout");
    }
    throw error;
  }

  const organization = me.organizations[0];
  const products = organization
    ? (
        await listOrganizationProducts(
          organization.organization_id,
          accessToken,
        )
      ).map(toDashboardProduct)
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
              id: organization.organization_id,
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
