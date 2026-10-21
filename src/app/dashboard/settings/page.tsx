import type { Metadata } from "next";
import { getDashboardSession } from "@/lib/dashboard/session";
import { listOrganizationCapabilities } from "@/lib/core/api";
import { PageHeader } from "@/components/dashboard/primitives";
import {
  SettingsClient,
  type SettingsTab,
} from "@/components/dashboard/settings-client";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

const SETTINGS_TABS: SettingsTab[] = [
  "personal",
  "organization",
  "capabilities",
  "security",
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { token, me, organization } = await getDashboardSession();

  const requestedTab = (await searchParams).tab;
  const initialTab: SettingsTab =
    typeof requestedTab === "string" &&
    (SETTINGS_TABS as string[]).includes(requestedTab)
      ? (requestedTab as SettingsTab)
      : "personal";

  const capabilities = organization
    ? await listOrganizationCapabilities(organization.organization_id, token)
    : [];

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Settings"
        description={
          organization
            ? "Manage your personal profile, organization, and security."
            : "Manage your personal profile and security."
        }
      />
      <SettingsClient
        initialTab={
          !organization &&
          initialTab !== "personal" &&
          initialTab !== "security"
            ? "personal"
            : initialTab
        }
        me={me}
        organization={organization}
        capabilities={capabilities}
      />
    </div>
  );
}
