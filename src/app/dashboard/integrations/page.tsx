import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccessToken } from "@/lib/auth/session";
import { getMe } from "@/lib/auth/api";
import { listIntegrations, listConnections } from "@/lib/core/api";
import { PageHeader } from "@/components/dashboard/primitives";
import { IntegrationsClient } from "@/components/dashboard/integrations-client";

export const metadata: Metadata = {
  title: "Integrations",
  robots: { index: false, follow: false },
};

export default async function IntegrationsPage() {
  const token = await getAccessToken();
  if (!token) redirect("/sign-in");
  const me = await getMe(token);
  const organization = me.organizations[0];
  const [integrations, connections] = organization
    ? await Promise.all([
        listIntegrations(token, "active"),
        listConnections(organization.organization_id, token),
      ])
    : [[], []];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Integrations"
        description="Connect Dilanix to the services your organization already uses."
      />
      <IntegrationsClient
        integrations={integrations}
        initialConnections={connections}
      />
    </div>
  );
}
