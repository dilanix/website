import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ApplicationDetailClient } from "@/components/dashboard/application-detail-client";
import { PageHeader } from "@/components/dashboard/primitives";
import {
  CoreApiError,
  getApplication,
  listApplicationEnvironments,
  type CoreApplication,
  type CoreApplicationEnvironment,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";

export const metadata: Metadata = {
  title: "Application details",
  robots: { index: false, follow: false },
};

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const [{ applicationId }, { token, organization }] = await Promise.all([
    params,
    requireDashboardOrganization(),
  ]);

  let application: CoreApplication;
  let environments: CoreApplicationEnvironment[];
  try {
    [application, environments] = await Promise.all([
      getApplication(organization.organization_id, applicationId, token),
      listApplicationEnvironments(
        organization.organization_id,
        applicationId,
        token,
      ),
    ]);
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/applications"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft size={15} /> Back to applications
      </Link>
      <PageHeader
        title="Application details"
        description="Manage application metadata and its runtime environments."
      />
      <ApplicationDetailClient
        initialApplication={application}
        initialEnvironments={environments}
      />
    </div>
  );
}
