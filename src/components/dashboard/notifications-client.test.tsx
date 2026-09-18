import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreNotificationChannel,
  CoreNotificationDelivery,
  CoreNotificationDestination,
} from "@/lib/core/api";
import { NotificationsClient } from "./notifications-client";
import {
  createNotificationChannelAction,
  disableNotificationChannelAction,
  disableNotificationDestinationAction,
  sendTestNotificationAction,
} from "@/app/dashboard/notifications/actions";

vi.mock("@/app/dashboard/notifications/actions", () => ({
  createNotificationChannelAction: vi.fn(),
  createNotificationDestinationAction: vi.fn(),
  disableNotificationChannelAction: vi.fn(),
  disableNotificationDestinationAction: vi.fn(),
  sendTestNotificationAction: vi.fn(),
  updateNotificationChannelAction: vi.fn(),
  updateNotificationDestinationAction: vi.fn(),
}));

afterEach(cleanup);

const slackChannel: CoreNotificationChannel = {
  id: "channel-1",
  organization_id: "org-1",
  provider: "slack",
  name: "Ops Slack",
  status: "active",
  is_enabled: true,
  configuration: { workspace_name: "dilanix" },
  has_credential: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const slackDestination: CoreNotificationDestination = {
  id: "destination-1",
  organization_id: "org-1",
  channel_id: "channel-1",
  name: "#alerts",
  external_identifier: "#alerts",
  event_types: [],
  configuration: {},
  has_secret: false,
  is_enabled: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const delivery: CoreNotificationDelivery = {
  id: "delivery-1",
  organization_id: "org-1",
  notification_id: "notification-1",
  destination_id: "destination-1",
  status: "delivered",
  attempt_count: 1,
  scheduled_at: "2026-01-01T00:00:00Z",
  delivered_at: "2026-01-01T00:00:01Z",
  provider_message_id: "msg-1",
  last_error_code: null,
  last_error_message: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:01Z",
};

describe("NotificationsClient", () => {
  it("shows an empty state and opens the add-channel dialog", () => {
    render(
      <NotificationsClient
        initialChannels={[]}
        initialDestinations={[]}
        initialDeliveries={[]}
      />,
    );

    expect(screen.getByText("No notification channels")).not.toBeNull();

    const [addChannelButton] = screen.getAllByRole("button", {
      name: /add channel/i,
    });
    fireEvent.click(addChannelButton);
    expect(screen.getByRole("dialog")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Add notification channel" }),
    ).not.toBeNull();
  });

  it("submits the create-channel form with provider-specific configuration", async () => {
    vi.mocked(createNotificationChannelAction).mockResolvedValue({
      data: { ...slackChannel, name: "Incident Alerts" },
    });

    render(
      <NotificationsClient
        initialChannels={[]}
        initialDestinations={[]}
        initialDeliveries={[]}
      />,
    );

    const [addChannelButton] = screen.getAllByRole("button", {
      name: /add channel/i,
    });
    fireEvent.click(addChannelButton);
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Channel name"), {
      target: { value: "Incident Alerts" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Add channel" }),
    );

    await waitFor(() =>
      expect(createNotificationChannelAction).toHaveBeenCalledWith(
        expect.objectContaining({ provider: "slack", name: "Incident Alerts" }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByText("Incident Alerts")).not.toBeNull(),
    );
  });

  it("defaults a new Slack channel to Incoming Webhook mode with no credential field", async () => {
    vi.mocked(createNotificationChannelAction).mockResolvedValue({
      data: { ...slackChannel, has_credential: false },
    });

    render(
      <NotificationsClient
        initialChannels={[]}
        initialDestinations={[]}
        initialDeliveries={[]}
      />,
    );

    const [addChannelButton] = screen.getAllByRole("button", {
      name: /add channel/i,
    });
    fireEvent.click(addChannelButton);
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).queryByLabelText("Bot User OAuth Token")).toBeNull();

    fireEvent.click(within(dialog).getByRole("radio", { name: /bot token/i }));
    expect(
      within(dialog).getByLabelText("Bot User OAuth Token"),
    ).not.toBeNull();

    fireEvent.click(
      within(dialog).getByRole("radio", { name: /incoming webhook/i }),
    );
    expect(within(dialog).queryByLabelText("Bot User OAuth Token")).toBeNull();

    fireEvent.change(within(dialog).getByLabelText("Channel name"), {
      target: { value: "Ops Slack" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Add channel" }),
    );

    await waitFor(() =>
      expect(createNotificationChannelAction).toHaveBeenCalledWith(
        expect.objectContaining({ provider: "slack", credential: null }),
      ),
    );
  });

  it("labels the Slack destination identifier by whether the channel has a bot token", () => {
    render(
      <NotificationsClient
        initialChannels={[
          { ...slackChannel, has_credential: false },
          {
            ...slackChannel,
            id: "channel-2",
            name: "Bot Slack",
            has_credential: true,
          },
        ]}
        initialDestinations={[]}
        initialDeliveries={[]}
      />,
    );

    const [webhookAddDestination, botAddDestination] = screen.getAllByRole(
      "button",
      { name: /add destination/i },
    );

    fireEvent.click(webhookAddDestination);
    expect(screen.getByRole("dialog").textContent).toContain(
      "Incoming Webhook URL",
    );
    fireEvent.click(screen.getByLabelText("Close dialog"));

    fireEvent.click(botAddDestination);
    expect(screen.getByRole("dialog").textContent).toContain(
      "Channel ID or name",
    );
  });

  it("deletes a channel only after typing its name to confirm", async () => {
    vi.mocked(disableNotificationChannelAction).mockResolvedValue({
      data: { ...slackChannel, is_enabled: false, status: "disabled" },
    });

    render(
      <NotificationsClient
        initialChannels={[slackChannel]}
        initialDestinations={[]}
        initialDeliveries={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog");
    const confirmButton = within(dialog).getByRole("button", {
      name: /delete permanently/i,
    });
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "wrong name" },
    });
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true);
    expect(disableNotificationChannelAction).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: slackChannel.name },
    });
    expect((confirmButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(disableNotificationChannelAction).toHaveBeenCalledWith(
        "channel-1",
      ),
    );
    await waitFor(() => expect(screen.queryByText("Ops Slack")).toBeNull());
  });

  it("deletes a destination only after typing its name to confirm", async () => {
    vi.mocked(disableNotificationDestinationAction).mockResolvedValue({
      data: { ...slackDestination, is_enabled: false },
    });

    render(
      <NotificationsClient
        initialChannels={[slackChannel]}
        initialDestinations={[slackDestination]}
        initialDeliveries={[]}
      />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    const dialog = screen.getByRole("alertdialog");
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: slackDestination.name },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: /delete permanently/i }),
    );

    await waitFor(() =>
      expect(disableNotificationDestinationAction).toHaveBeenCalledWith(
        "destination-1",
      ),
    );
    await waitFor(() =>
      expect(screen.queryAllByText("#alerts").length).toBe(0),
    );
  });

  it("renders a channel's destinations and sends a test notification", async () => {
    vi.mocked(sendTestNotificationAction).mockResolvedValue({ data: delivery });

    render(
      <NotificationsClient
        initialChannels={[slackChannel]}
        initialDestinations={[slackDestination]}
        initialDeliveries={[]}
      />,
    );

    expect(screen.getByText("Ops Slack")).not.toBeNull();
    expect(screen.getAllByText("#alerts").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /send test/i }));

    await waitFor(() =>
      expect(sendTestNotificationAction).toHaveBeenCalledWith(
        "channel-1",
        "destination-1",
      ),
    );
    await waitFor(() =>
      expect(screen.getByText("Test notification delivered")).not.toBeNull(),
    );
  });
});
