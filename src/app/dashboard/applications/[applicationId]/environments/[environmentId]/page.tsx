import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  EnvironmentTelemetryClient,
  type TelemetryTargetOption,
} from "@/components/dashboard/environment-telemetry-client";
import { PageHeader } from "@/components/dashboard/primitives";
import {
  CoreApiError,
  getApplication,
  getApplicationEnvironment,
  listConnections,
  listTargets,
  listTelemetryIngestionTokens,
  listTelemetrySources,
  type CoreApplication,
  type CoreApplicationEnvironment,
  type CoreIntegrationConnection,
  type CoreTelemetrySource,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";

export const metadata: Metadata = {
  title: "Environment telemetry",
  robots: { index: false, follow: false },
};

export default async function EnvironmentPage({
  params,
}: {
  params: Promise<{ applicationId: string; environmentId: string }>;
}) {
  const [route, { token, organization }] = await Promise.all([
    params,
    requireDashboardOrganization(),
  ]);
  const { applicationId, environmentId } = route;

  let application: CoreApplication;
  let environment: CoreApplicationEnvironment;
  let sources: CoreTelemetrySource[];
  let connections: CoreIntegrationConnection[];
  try {
    [application, environment, sources, connections] = await Promise.all([
      getApplication(organization.organization_id, applicationId, token),
      getApplicationEnvironment(
        organization.organization_id,
        applicationId,
        environmentId,
        token,
      ),
      listTelemetrySources(
        organization.organization_id,
        applicationId,
        environmentId,
        token,
      ),
      listConnections(organization.organization_id, token),
    ]);
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 404) notFound();
    throw error;
  }

  const [tokenLists, targetLists] = await Promise.all([
    Promise.all(
      sources.map(
        async (source) =>
          [
            source.id,
            await listTelemetryIngestionTokens(
              organization.organization_id,
              applicationId,
              environmentId,
              source.id,
              token,
            ),
          ] as const,
      ),
    ),
    Promise.all(
      connections.map(async (connection) => ({
        connection,
        targets: await listTargets(
          organization.organization_id,
          connection.id,
          token,
        ),
      })),
    ),
  ]);

  const initialTokens = Object.fromEntries(tokenLists);
  const targetOptions: TelemetryTargetOption[] = targetLists.flatMap(
    ({ connection, targets }) =>
      targets
        .filter((target) => target.status === "verified")
        .map((target) => ({
          id: target.id,
          label: `${connection.name} · ${target.display_name ?? target.external_id}`,
        })),
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/dashboard/applications/${applicationId}`}
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft size={15} /> Back to {application.name}
      </Link>
      <PageHeader
        title="Environment telemetry"
        description="Manage telemetry sources and their least-privilege ingestion credentials."
      />
      <EnvironmentTelemetryClient
        application={application}
        initialEnvironment={environment}
        initialSources={sources}
        initialTokens={initialTokens}
        targetOptions={targetOptions}
      />
    </div>
  );
}
