"use client";
import { useEffect, useState, useTransition, type ComponentType } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Webhook,
  X,
} from "lucide-react";
import type {
  CoreNotificationChannel,
  CoreNotificationDelivery,
  CoreNotificationDestination,
  NotificationDeliveryStatus,
  NotificationProvider,
} from "@/lib/core/api";
import {
  createNotificationChannelAction,
  createNotificationDestinationAction,
  deleteNotificationChannelAction,
  deleteNotificationDestinationAction,
  sendTestNotificationAction,
  updateNotificationChannelAction,
  updateNotificationDestinationAction,
} from "@/app/dashboard/notifications/actions";
import { EmptyState, Section, StatusBadge } from "./primitives";
import { DestructiveActionDialog } from "./destructive-action-dialog";
import { ModalOverlay } from "./modal-overlay";

type ConfigFieldType = "text" | "number" | "checkbox";

interface ConfigField {
  key: string;
  label: string;
  type: ConfigFieldType;
  placeholder?: string;
}

interface ProviderMeta {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  identifierLabel: string;
  identifierPlaceholder: string;
  credentialLabel: string | null;
  credentialPlaceholder?: string;
  needsDestinationSecret: boolean;
  destinationSecretLabel?: string;
  configFields: ConfigField[];
}

const PROVIDER_META: Record<NotificationProvider, ProviderMeta> = {
  slack: {
    label: "Slack",
    icon: MessageSquare,
    // Bot-token mode's own identifier shape — Incoming Webhook mode
    // overrides both at the destination form via `slackIdentifierMeta`.
    identifierLabel: "Channel ID or name",
    identifierPlaceholder: "#alerts or C0123456789",
    credentialLabel: "Bot User OAuth Token",
    credentialPlaceholder: "xoxb-...",
    needsDestinationSecret: false,
    configFields: [
      { key: "workspace_name", label: "Workspace name", type: "text" },
      { key: "default_channel", label: "Default channel", type: "text" },
    ],
  },
  telegram: {
    label: "Telegram",
    icon: Send,
    identifierLabel: "Chat ID or group ID",
    identifierPlaceholder: "123456789 or -1001234567890 for a group",
    credentialLabel: "Bot token",
    credentialPlaceholder: "123456789:AA...",
    needsDestinationSecret: false,
    configFields: [
      { key: "bot_username", label: "Bot username", type: "text" },
    ],
  },
  email: {
    label: "Email",
    icon: Mail,
    identifierLabel: "Email address",
    identifierPlaceholder: "ops@example.com",
    credentialLabel: null,
    needsDestinationSecret: false,
    configFields: [
      { key: "from_name", label: "From name", type: "text" },
      { key: "reply_to", label: "Reply-to address", type: "text" },
    ],
  },
  webhook: {
    label: "Webhook",
    icon: Webhook,
    identifierLabel: "Webhook URL",
    identifierPlaceholder: "https://example.com/hooks/dilanix",
    credentialLabel: null,
    needsDestinationSecret: true,
    destinationSecretLabel: "Signing secret",
    configFields: [
      { key: "timeout_seconds", label: "Timeout (seconds)", type: "number" },
      { key: "require_https", label: "Require HTTPS", type: "checkbox" },
    ],
  },
};

const PROVIDER_ORDER: NotificationProvider[] = [
  "slack",
  "telegram",
  "email",
  "webhook",
];

function channelStatusTone(channel: CoreNotificationChannel) {
  return channel.is_enabled ? "success" : "neutral";
}

function deliveryStatusTone(
  status: NotificationDeliveryStatus,
): "success" | "neutral" | "warning" {
  if (status === "delivered") return "success";
  if (status === "failed") return "warning";
  return "neutral";
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

/**
 * A Slack channel with no bot token delivers via a per-destination Incoming
 * Webhook URL instead of `chat.postMessage` (see `SlackDeliveryProvider` in
 * Core) — the destination's identifier field means something different in
 * each mode, so it can't come from the static `PROVIDER_META` table alone.
 */
function slackIdentifierMeta(channelHasCredential: boolean) {
  return channelHasCredential
    ? { label: "Channel ID or name", placeholder: "#alerts or C0123456789" }
    : {
        label: "Incoming Webhook URL",
        placeholder: "https://hooks.slack.com/services/T000/B000/XXXXXXXX",
      };
}

function parseEventTypes(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildConfiguration(
  fields: ConfigField[],
  data: FormData,
): Record<string, unknown> {
  const configuration: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === "checkbox") {
      configuration[field.key] = data.get(field.key) === "on";
      continue;
    }
    const raw = String(data.get(field.key) ?? "").trim();
    if (!raw) continue;
    configuration[field.key] = field.type === "number" ? Number(raw) : raw;
  }
  return configuration;
}

function configFieldDefault(
  field: ConfigField,
  configuration: Record<string, unknown>,
): string {
  const value = configuration[field.key];
  if (value === undefined || value === null) return "";
  return String(value);
}

export function NotificationsClient({
  initialChannels,
  initialDestinations,
  initialDeliveries,
}: {
  initialChannels: CoreNotificationChannel[];
  initialDestinations: CoreNotificationDestination[];
  initialDeliveries: CoreNotificationDelivery[];
}) {
  const [channels, setChannels] = useState(initialChannels);
  const [destinations, setDestinations] = useState(initialDestinations);
  const [deliveries, setDeliveries] = useState(initialDeliveries);

  const [channelDialog, setChannelDialog] = useState<
    | { mode: "create" }
    | { mode: "edit"; channel: CoreNotificationChannel }
    | null
  >(null);
  const [destinationDialog, setDestinationDialog] = useState<
    | { mode: "create"; channel: CoreNotificationChannel }
    | { mode: "edit"; destination: CoreNotificationDestination }
    | null
  >(null);
  const [testResult, setTestResult] = useState<
    | { destinationId: string; delivery: CoreNotificationDelivery }
    | { destinationId: string; error: string }
    | null
  >(null);
  const [testingDestinationId, setTestingDestinationId] = useState<
    string | null
  >(null);
  const [deleteChannelTarget, setDeleteChannelTarget] =
    useState<CoreNotificationChannel | null>(null);
  const [deleteDestinationTarget, setDeleteDestinationTarget] =
    useState<CoreNotificationDestination | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function closeDialogs() {
    setChannelDialog(null);
    setDestinationDialog(null);
    setError("");
  }

  useEffect(() => {
    if (!channelDialog && !destinationDialog) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeDialogs();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [channelDialog, destinationDialog]);

  function submitChannelForm(
    event: React.FormEvent<HTMLFormElement>,
    dialog:
      { mode: "create" } | { mode: "edit"; channel: CoreNotificationChannel },
  ) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const provider =
      dialog.mode === "create"
        ? (String(data.get("provider")) as NotificationProvider)
        : dialog.channel.provider;
    const meta = PROVIDER_META[provider];
    const name = String(data.get("name") ?? "").trim();
    const configuration = buildConfiguration(meta.configFields, data);
    const credential = String(data.get("credential") ?? "").trim();

    startTransition(async () => {
      if (dialog.mode === "create") {
        const result = await createNotificationChannelAction({
          provider,
          name,
          configuration,
          credential: credential || null,
        });
        if (result.error) return setError(result.error);
        if (result.data) {
          setChannels((current) => [result.data!, ...current]);
          closeDialogs();
        }
        return;
      }
      const isEnabled = data.get("is_enabled") === "on";
      const result = await updateNotificationChannelAction(dialog.channel.id, {
        name,
        configuration,
        is_enabled: isEnabled,
        ...(credential ? { credential } : {}),
      });
      if (result.error) return setError(result.error);
      if (result.data) {
        setChannels((current) =>
          current.map((channel) =>
            channel.id === result.data!.id ? result.data! : channel,
          ),
        );
        closeDialogs();
      }
    });
  }

  function deleteChannel(channel: CoreNotificationChannel) {
    setDeleteError("");
    startTransition(async () => {
      const result = await deleteNotificationChannelAction(channel.id);
      if (result.error) return setDeleteError(result.error);
      // Core cascades the delete through every one of this channel's
      // destinations and their delivery history — mirror that here so
      // "Recent activity" doesn't keep showing rows that no longer exist.
      const deletedDestinationIds = new Set(
        destinations
          .filter((item) => item.channel_id === channel.id)
          .map((item) => item.id),
      );
      setChannels((current) =>
        current.filter((item) => item.id !== channel.id),
      );
      setDestinations((current) =>
        current.filter((item) => item.channel_id !== channel.id),
      );
      setDeliveries((current) =>
        current.filter(
          (delivery) => !deletedDestinationIds.has(delivery.destination_id),
        ),
      );
      setDeleteChannelTarget(null);
    });
  }

  function submitDestinationForm(
    event: React.FormEvent<HTMLFormElement>,
    dialog:
      | { mode: "create"; channel: CoreNotificationChannel }
      | { mode: "edit"; destination: CoreNotificationDestination },
  ) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const externalIdentifier = String(
      data.get("external_identifier") ?? "",
    ).trim();
    const eventTypes = parseEventTypes(String(data.get("event_types") ?? ""));
    const secret = String(data.get("secret") ?? "").trim();
    // Per-destination webhook overrides (timeout/require_https) aren't
    // exposed in this form — an empty `configuration` lets the destination
    // fall back to `WebhookChannelConfig`'s own defaults server-side.
    const configuration: Record<string, unknown> = {};

    startTransition(async () => {
      if (dialog.mode === "create") {
        const result = await createNotificationDestinationAction({
          channel_id: dialog.channel.id,
          name,
          external_identifier: externalIdentifier,
          event_types: eventTypes,
          configuration,
          secret: secret || null,
        });
        if (result.error) return setError(result.error);
        if (result.data) {
          setDestinations((current) => [result.data!, ...current]);
          closeDialogs();
        }
        return;
      }
      const isEnabled = data.get("is_enabled") === "on";
      const result = await updateNotificationDestinationAction(
        dialog.destination.id,
        {
          name,
          external_identifier: externalIdentifier,
          event_types: eventTypes,
          configuration,
          is_enabled: isEnabled,
          ...(secret ? { secret } : {}),
        },
      );
      if (result.error) return setError(result.error);
      if (result.data) {
        setDestinations((current) =>
          current.map((item) =>
            item.id === result.data!.id ? result.data! : item,
          ),
        );
        closeDialogs();
      }
    });
  }

  function deleteDestination(destination: CoreNotificationDestination) {
    setDeleteError("");
    startTransition(async () => {
      const result = await deleteNotificationDestinationAction(destination.id);
      if (result.error) return setDeleteError(result.error);
      setDestinations((current) =>
        current.filter((item) => item.id !== destination.id),
      );
      setDeliveries((current) =>
        current.filter(
          (delivery) => delivery.destination_id !== destination.id,
        ),
      );
      setDeleteDestinationTarget(null);
    });
  }

  function sendTest(
    channel: CoreNotificationChannel,
    destination: CoreNotificationDestination,
  ) {
    setTestingDestinationId(destination.id);
    setTestResult(null);
    startTransition(async () => {
      const result = await sendTestNotificationAction(
        channel.id,
        destination.id,
      );
      setTestingDestinationId(null);
      if (result.error) {
        setTestResult({ destinationId: destination.id, error: result.error });
        return;
      }
      if (result.data) {
        setTestResult({ destinationId: destination.id, delivery: result.data });
        setDeliveries((current) => [result.data!, ...current].slice(0, 20));
      }
    });
  }

  const destinationById = new Map(
    destinations.map((destination) => [destination.id, destination]),
  );
  const channelById = new Map(channels.map((channel) => [channel.id, channel]));

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border-border-soft bg-card-strong/50 rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs">Channels</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {channels.length}
          </p>
        </div>
        <div className="border-border-soft bg-card-strong/50 rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs">Destinations</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {destinations.length}
          </p>
        </div>
        <div className="border-border-soft bg-card-strong/50 rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs">Recent failures</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {
              deliveries.filter((delivery) => delivery.status === "failed")
                .length
            }
          </p>
        </div>
      </div>

      <Section
        title="Channels"
        description="A channel is one provider connection (Slack workspace bot, Telegram bot, email sender, or webhook default). Add destinations under a channel for the specific chats, addresses, or URLs that should receive notifications."
        action={
          <button
            type="button"
            onClick={() => setChannelDialog({ mode: "create" })}
            className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
          >
            <Plus size={13} />
            Add channel
          </button>
        }
      >
        {channels.length ? (
          <div className="flex flex-col gap-4">
            {channels.map((channel) => {
              const meta = PROVIDER_META[channel.provider];
              const Icon = meta.icon;
              const channelDestinations = destinations.filter(
                (destination) => destination.channel_id === channel.id,
              );
              return (
                <article
                  key={channel.id}
                  className="border-border-soft bg-card-strong/45 rounded-2xl border p-5 shadow-[0_16px_40px_var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-accent/10 text-accent flex h-11 w-11 items-center justify-center rounded-xl">
                        <Icon size={18} />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold">
                          {channel.name}
                        </h3>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {meta.label}
                          {channel.has_credential ? " · credential set" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={channelStatusTone(channel)}>
                        {channel.status}
                      </StatusBadge>
                      <button
                        type="button"
                        onClick={() =>
                          setChannelDialog({ mode: "edit", channel })
                        }
                        className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setDeleteChannelTarget(channel)}
                        className="text-muted-foreground rounded-md px-2 py-1 text-xs hover:text-red-500 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="border-foreground/10 mt-4 border-t pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        Destinations
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          setDestinationDialog({ mode: "create", channel })
                        }
                        className="text-accent inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <Plus size={12} />
                        Add destination
                      </button>
                    </div>
                    {channelDestinations.length ? (
                      <ul className="divide-foreground/10 mt-3 divide-y">
                        {channelDestinations.map((destination) => (
                          <li
                            key={destination.id}
                            className="flex flex-wrap items-center justify-between gap-3 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {destination.name}
                              </p>
                              <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
                                {destination.external_identifier}
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {destination.event_types.length ? (
                                  destination.event_types.map((eventType) => (
                                    <span
                                      key={eventType}
                                      className="border-foreground/10 text-muted-foreground rounded-full border px-2 py-0.5 text-[10px]"
                                    >
                                      {eventType}
                                    </span>
                                  ))
                                ) : (
                                  <span className="border-foreground/10 text-muted-foreground rounded-full border px-2 py-0.5 text-[10px]">
                                    All events
                                  </span>
                                )}
                              </div>
                              {testResult &&
                              testResult.destinationId === destination.id ? (
                                <p
                                  className={`mt-2 flex items-center gap-1.5 text-xs ${
                                    "delivery" in testResult &&
                                    testResult.delivery.status === "delivered"
                                      ? "text-success"
                                      : "text-amber-600 dark:text-amber-300"
                                  }`}
                                >
                                  {"delivery" in testResult ? (
                                    testResult.delivery.status ===
                                    "delivered" ? (
                                      <>
                                        <CheckCircle2 size={12} />
                                        Test notification delivered
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle size={12} />
                                        {testResult.delivery.status === "failed"
                                          ? `Test failed: ${testResult.delivery.last_error_message ?? testResult.delivery.last_error_code ?? "unknown error"}`
                                          : `Test ${testResult.delivery.status}`}
                                      </>
                                    )
                                  ) : (
                                    <>
                                      <AlertTriangle size={12} />
                                      {testResult.error}
                                    </>
                                  )}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <StatusBadge
                                status={
                                  destination.is_enabled ? "success" : "neutral"
                                }
                              >
                                {destination.is_enabled
                                  ? "enabled"
                                  : "disabled"}
                              </StatusBadge>
                              <button
                                type="button"
                                disabled={
                                  pending ||
                                  testingDestinationId === destination.id
                                }
                                onClick={() => sendTest(channel, destination)}
                                className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                              >
                                <Send size={12} />
                                {testingDestinationId === destination.id
                                  ? "Sending…"
                                  : "Send test"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDestinationDialog({
                                    mode: "edit",
                                    destination,
                                  })
                                }
                                className="text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-xs"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() =>
                                  setDeleteDestinationTarget(destination)
                                }
                                className="text-muted-foreground rounded-md px-2 py-1 text-xs hover:text-red-500 disabled:opacity-40"
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground mt-3 text-xs">
                        No destinations yet.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No notification channels"
            description="Add a Slack, Telegram, email, or webhook channel to start sending notifications."
            actions={
              <button
                type="button"
                onClick={() => setChannelDialog({ mode: "create" })}
                className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
              >
                <Plus size={15} />
                Add channel
              </button>
            }
          />
        )}
      </Section>

      <Section
        title="Recent activity"
        description="The most recent deliveries across every channel."
      >
        {deliveries.length ? (
          <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
            {deliveries.map((delivery) => {
              const destination = destinationById.get(delivery.destination_id);
              const channel = destination
                ? channelById.get(destination.channel_id)
                : undefined;
              return (
                <div
                  key={delivery.id}
                  className="grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {destination?.name ?? "Unknown destination"}
                      {channel
                        ? ` · ${PROVIDER_META[channel.provider].label}`
                        : ""}
                    </p>
                    {delivery.last_error_message ? (
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        {delivery.last_error_message}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDateTime(
                      delivery.delivered_at ?? delivery.scheduled_at,
                    )}
                  </span>
                  <StatusBadge status={deliveryStatusTone(delivery.status)}>
                    {delivery.status}
                  </StatusBadge>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No notifications have been sent yet.
          </p>
        )}
      </Section>

      {channelDialog ? (
        <ModalOverlay onClose={closeDialogs}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="channel-dialog-title"
            className="bg-background border-foreground/15 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-accent/10 text-accent flex h-9 w-9 items-center justify-center rounded-lg">
                  <Bell size={17} />
                </span>
                <h2
                  id="channel-dialog-title"
                  className="mt-4 text-lg font-semibold"
                >
                  {channelDialog.mode === "create"
                    ? "Add notification channel"
                    : `Edit ${channelDialog.channel.name}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialogs}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>

            <ChannelForm
              dialog={channelDialog}
              pending={pending}
              error={error}
              onSubmit={submitChannelForm}
            />
          </div>
        </ModalOverlay>
      ) : null}

      {destinationDialog ? (
        <ModalOverlay onClose={closeDialogs}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="destination-dialog-title"
            className="bg-background border-foreground/15 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-accent/10 text-accent flex h-9 w-9 items-center justify-center rounded-lg">
                  <Send size={17} />
                </span>
                <h2
                  id="destination-dialog-title"
                  className="mt-4 text-lg font-semibold"
                >
                  {destinationDialog.mode === "create"
                    ? `Add destination · ${destinationDialog.channel.name}`
                    : `Edit ${destinationDialog.destination.name}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialogs}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>

            <DestinationForm
              dialog={destinationDialog}
              provider={
                destinationDialog.mode === "create"
                  ? destinationDialog.channel.provider
                  : (channelById.get(destinationDialog.destination.channel_id)
                      ?.provider ?? "webhook")
              }
              channelHasCredential={
                destinationDialog.mode === "create"
                  ? destinationDialog.channel.has_credential
                  : (channelById.get(destinationDialog.destination.channel_id)
                      ?.has_credential ?? false)
              }
              pending={pending}
              error={error}
              onSubmit={submitDestinationForm}
            />
          </div>
        </ModalOverlay>
      ) : null}

      {deleteChannelTarget ? (
        <DestructiveActionDialog
          title={`Delete ${deleteChannelTarget.name}?`}
          description="This permanently deletes the channel, every one of its destinations, and their entire delivery history. This cannot be undone. To pause it instead without losing anything, use Edit and turn off Enabled."
          confirmationName={deleteChannelTarget.name}
          pending={pending}
          error={deleteError}
          onCancel={() => {
            setDeleteChannelTarget(null);
            setDeleteError("");
          }}
          onConfirm={() => deleteChannel(deleteChannelTarget)}
        />
      ) : null}

      {deleteDestinationTarget ? (
        <DestructiveActionDialog
          title={`Delete ${deleteDestinationTarget.name}?`}
          description="This permanently deletes the destination and its entire delivery history. This cannot be undone. To pause it instead without losing anything, use Edit and turn off Enabled."
          confirmationName={deleteDestinationTarget.name}
          pending={pending}
          error={deleteError}
          onCancel={() => {
            setDeleteDestinationTarget(null);
            setDeleteError("");
          }}
          onConfirm={() => deleteDestination(deleteDestinationTarget)}
        />
      ) : null}
    </>
  );
}

function ChannelForm({
  dialog,
  pending,
  error,
  onSubmit,
}: {
  dialog:
    { mode: "create" } | { mode: "edit"; channel: CoreNotificationChannel };
  pending: boolean;
  error: string;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>,
    dialog:
      { mode: "create" } | { mode: "edit"; channel: CoreNotificationChannel },
  ) => void;
}) {
  const [provider, setProvider] = useState<NotificationProvider>(
    dialog.mode === "edit" ? dialog.channel.provider : "slack",
  );
  const meta = PROVIDER_META[provider];
  const configuration =
    dialog.mode === "edit" ? dialog.channel.configuration : {};

  return (
    <form
      onSubmit={(event) => onSubmit(event, dialog)}
      className="mt-6 space-y-5"
    >
      {dialog.mode === "create" ? (
        <label className="block text-sm">
          <span className="mb-2 block font-medium">Provider</span>
          <select
            name="provider"
            value={provider}
            onChange={(event) =>
              setProvider(event.target.value as NotificationProvider)
            }
            className="border-foreground/15 bg-background h-10 w-full rounded-lg border px-3"
          >
            {PROVIDER_ORDER.map((value) => (
              <option key={value} value={value}>
                {PROVIDER_META[value].label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block text-sm">
        <span className="mb-2 block font-medium">Channel name</span>
        <input
          name="name"
          required
          defaultValue={dialog.mode === "edit" ? dialog.channel.name : ""}
          placeholder={`${meta.label} Alerts`}
          className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
        />
      </label>

      {meta.configFields.map((field) => (
        <label key={field.key} className="block text-sm">
          {field.type === "checkbox" ? (
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                name={field.key}
                defaultChecked={Boolean(configuration[field.key] ?? true)}
              />
              {field.label}
            </span>
          ) : (
            <>
              <span className="mb-2 block font-medium">{field.label}</span>
              <input
                name={field.key}
                type={field.type === "number" ? "number" : "text"}
                step={field.type === "number" ? "any" : undefined}
                defaultValue={configFieldDefault(field, configuration)}
                placeholder={field.placeholder}
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
              />
            </>
          )}
        </label>
      ))}

      {meta.credentialLabel ? (
        <label className="block text-sm">
          <span className="mb-2 block font-medium">
            {meta.credentialLabel}{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </span>
          <input
            name="credential"
            type="password"
            autoComplete="off"
            placeholder={
              dialog.mode === "edit" && dialog.channel.has_credential
                ? "Leave blank to keep the current credential"
                : meta.credentialPlaceholder
            }
            className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
          />
          {provider === "slack" ? (
            <span className="text-muted-foreground mt-1.5 block text-xs leading-5">
              Leave blank to use a Slack Incoming Webhook URL instead — set that
              as the destination&apos;s identifier when you add one below.
            </span>
          ) : null}
        </label>
      ) : null}

      {dialog.mode === "edit" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_enabled"
            defaultChecked={dialog.channel.is_enabled}
          />
          Enabled
        </label>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {pending
          ? "Saving…"
          : dialog.mode === "create"
            ? "Add channel"
            : "Save changes"}
      </button>
    </form>
  );
}

function DestinationForm({
  dialog,
  provider,
  channelHasCredential,
  pending,
  error,
  onSubmit,
}: {
  dialog:
    | { mode: "create"; channel: CoreNotificationChannel }
    | { mode: "edit"; destination: CoreNotificationDestination };
  provider: NotificationProvider;
  /** Only meaningful for Slack — selects between bot-token and Incoming
   * Webhook identifier shape, see `slackIdentifierMeta`. */
  channelHasCredential: boolean;
  pending: boolean;
  error: string;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>,
    dialog:
      | { mode: "create"; channel: CoreNotificationChannel }
      | { mode: "edit"; destination: CoreNotificationDestination },
  ) => void;
}) {
  const meta = PROVIDER_META[provider];
  const identifier =
    provider === "slack"
      ? slackIdentifierMeta(channelHasCredential)
      : {
          label: meta.identifierLabel,
          placeholder: meta.identifierPlaceholder,
        };
  const destination = dialog.mode === "edit" ? dialog.destination : null;

  return (
    <form
      onSubmit={(event) => onSubmit(event, dialog)}
      className="mt-6 space-y-5"
    >
      <label className="block text-sm">
        <span className="mb-2 block font-medium">Destination name</span>
        <input
          name="name"
          required
          defaultValue={destination?.name ?? ""}
          placeholder="On-call team"
          className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-2 block font-medium">{identifier.label}</span>
        <input
          name="external_identifier"
          required
          defaultValue={destination?.external_identifier ?? ""}
          placeholder={identifier.placeholder}
          className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono text-sm outline-none"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-2 block font-medium">
          Event types{" "}
          <span className="text-muted-foreground font-normal">
            (comma-separated, leave blank for all events)
          </span>
        </span>
        <input
          name="event_types"
          defaultValue={destination?.event_types.join(", ") ?? ""}
          placeholder="cost.anomaly.detected, security.finding.detected"
          className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
        />
      </label>

      {meta.needsDestinationSecret ? (
        <label className="block text-sm">
          <span className="mb-2 block font-medium">
            {meta.destinationSecretLabel ?? "Secret"}
          </span>
          <input
            name="secret"
            type="password"
            autoComplete="off"
            placeholder={
              destination?.has_secret
                ? "Leave blank to keep the current secret"
                : "Optional"
            }
            className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
          />
        </label>
      ) : null}

      {dialog.mode === "edit" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_enabled"
            defaultChecked={dialog.destination.is_enabled}
          />
          Enabled
        </label>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {pending
          ? "Saving…"
          : dialog.mode === "create"
            ? "Add destination"
            : "Save changes"}
      </button>
    </form>
  );
}
