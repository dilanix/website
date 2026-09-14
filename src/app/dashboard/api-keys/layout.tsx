import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { listOrganizationCapabilities } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";

const API_KEYS_CAPABILITY_CODE = "platform.api_keys";

export default async function ApiKeysLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { token, organization } = await requireDashboardOrganization();

  const capabilities = await listOrganizationCapabilities(
    organization.organization_id,
    token,
  );

  const hasApiKeysAccess = capabilities.some(
    (capability) =>
      capability.code === API_KEYS_CAPABILITY_CODE &&
      capability.access_status === "active",
  );

  if (!hasApiKeysAccess) {
    notFound();
  }

  return children;
}