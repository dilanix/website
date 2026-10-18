import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { listOrganizationCapabilities } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";

const APPLICATION_CAPABILITY_CODE = "platform.application";

export default async function ApplicationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { token, organization } = await requireDashboardOrganization();

  const capabilities = await listOrganizationCapabilities(
    organization.organization_id,
    token,
  );

  const hasApplicationAccess = capabilities.some(
    (capability) =>
      capability.code === APPLICATION_CAPABILITY_CODE &&
      capability.access_status === "active",
  );

  if (!hasApplicationAccess) {
    notFound();
  }

  return children;
}
