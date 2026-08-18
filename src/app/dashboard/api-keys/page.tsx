import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/primitives";
import { ApiKeysClient } from "@/components/dashboard/api-keys-client";
import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import { listApiKeys, listOrganizationProducts } from "@/lib/core/api";
export const metadata: Metadata = {
  title: "API Keys",
  robots: { index: false, follow: false },
};
export default async function ApiKeysPage() {
  const token = await getAccessToken();
  if (!token) redirect("/sign-in");
  const me = await getMe(token);
  const organization = me.organizations[0];
  const [keys, products] = organization
    ? await Promise.all([
        listApiKeys(organization.organization_id, token),
        listOrganizationProducts(organization.organization_id, token),
      ])
    : [[], []];
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="API Keys"
        description="Use API keys to access Dilanix products programmatically."
      />
      <ApiKeysClient
        initialKeys={keys}
        products={products.filter(
          (product) =>
            product.api_enabled && product.access_status === "active",
        )}
      />
    </div>
  );
}
