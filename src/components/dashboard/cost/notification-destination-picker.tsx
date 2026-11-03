"use client";

import Link from "next/link";
import type {
  CoreNotificationChannel,
  CoreNotificationDestination,
} from "@/lib/core/api";

function providerLabel(channel: CoreNotificationChannel | undefined) {
  if (!channel) return "Unknown channel";
  return `${channel.provider.charAt(0).toUpperCase()}${channel.provider.slice(1)} · ${channel.name}`;
}

/** Checkbox list of the organization's shared Notification destinations
 *  (Email, Slack, Telegram, Webhook). A disabled destination stays
 *  deselectable but can't be newly selected. */
export function NotificationDestinationPicker({
  channels,
  destinations,
  selectedIds,
  onChange,
}: {
  channels: CoreNotificationChannel[];
  destinations: CoreNotificationDestination[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}) {
  const channelById = new Map(channels.map((channel) => [channel.id, channel]));

  if (destinations.length === 0) {
    return (
      <div className="border-foreground/15 text-muted-foreground rounded-lg border border-dashed p-3 text-xs leading-5">
        No destinations are configured. Add an Email, Slack, Telegram, or
        Webhook destination in{" "}
        <Link
          href="/dashboard/notifications"
          className="text-accent font-medium hover:underline"
        >
          Notifications
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="border-foreground/15 divide-foreground/10 max-h-48 divide-y overflow-y-auto rounded-lg border">
      {destinations.map((destination) => {
        const channel = channelById.get(destination.channel_id);
        const selected = selectedIds.includes(destination.id);
        const available = Boolean(
          destination.is_enabled &&
          channel?.is_enabled &&
          channel.status === "active",
        );
        return (
          <label
            key={destination.id}
            className="flex cursor-pointer items-start gap-3 px-3 py-2.5"
          >
            <input
              type="checkbox"
              checked={selected}
              disabled={!available && !selected}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selectedIds, destination.id]
                    : selectedIds.filter((id) => id !== destination.id),
                )
              }
              className="mt-0.5"
            />
            <span className="min-w-0">
              <span className="block font-medium">{destination.name}</span>
              <span className="text-muted-foreground block text-xs">
                {providerLabel(channel)}
                {!available ? " · disabled" : ""}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
