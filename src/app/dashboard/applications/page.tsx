import type { Metadata } from "next";
import { ApplicationsClient } from "@/components/dashboard/applications-client";
import { PageHeader } from "@/components/dashboard/primitives";
import { listApplications } from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";

export const metadata: Metadata = {
  title: "Applications",
  robots: { index: false, follow: false },
};

export default async function ApplicationsPage() {
  const { token, organization } = await requireDashboardOrganization();
  const applications = await listApplications(
    organization.organization_id,
    token,
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Applications"
        description="Organize runtime environments and the telemetry sources that send data to Dilanix."
      />
      <ApplicationsClient initialApplications={applications} />
    </div>
  );
}
