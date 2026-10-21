import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/primitives";
import { ApiKeysClient } from "@/components/dashboard/api-keys-client";
import { listApiKeys, listOrganizationProducts } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
export const metadata: Metadata = {
  title: "API Keys",
  robots: { index: false, follow: false },
};
export default async function ApiKeysPage() {
  const { token, organization } = await requireDashboardOrganization();
  const [keys, products] = await Promise.all([
    listApiKeys(organization.organization_id, token),
    listOrganizationProducts(organization.organization_id, token),
  ]);
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
