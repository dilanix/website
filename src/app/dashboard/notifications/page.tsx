import type { Metadata } from "next";
import {
  listNotificationChannels,
  listNotificationDestinations,
  listNotificationDeliveries,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { PageHeader } from "@/components/dashboard/primitives";
import { NotificationsClient } from "@/components/dashboard/notifications-client";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const { token, organization } = await requireDashboardOrganization();
  const [channels, destinations, deliveries] = await Promise.all([
    listNotificationChannels(organization.organization_id, token),
    listNotificationDestinations(organization.organization_id, token),
    listNotificationDeliveries(organization.organization_id, token, {
      limit: 20,
      offset: 0,
    }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Notifications"
        description="Connect Slack, Telegram, email, or a webhook, subscribe destinations to the events you care about, and send a test notification."
      />
      <NotificationsClient
        initialChannels={channels.items}
        initialDestinations={destinations.items}
        initialDeliveries={deliveries.items}
      />
    </div>
  );
}
