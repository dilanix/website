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
  CoreNotificationDestination,
  CoreReport,
} from "@/lib/core/api";
import {
  createReportAction,
  generateReportAction,
} from "@/app/dashboard/products/cost-actions";
import { ReportsClient } from "./reports-client";

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  createReportAction: vi.fn(),
  deleteReportAction: vi.fn(),
  generateReportAction: vi.fn(),
  updateReportAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const channel: CoreNotificationChannel = {
  id: "channel-1",
  organization_id: "org-1",
  provider: "slack",
  name: "Finance Slack",
  status: "active",
  is_enabled: true,
  configuration: {},
  has_credential: true,
  created_at: "2026-09-18T00:00:00Z",
  updated_at: "2026-09-18T00:00:00Z",
};

const destination: CoreNotificationDestination = {
  id: "destination-1",
  organization_id: "org-1",
  channel_id: channel.id,
  external_identifier: "#finance",
  name: "#finance",
  event_types: [],
  configuration: {},
  has_secret: false,
  is_enabled: true,
  created_at: "2026-09-18T00:00:00Z",
  updated_at: "2026-09-18T00:00:00Z",
};

const report: CoreReport = {
  id: "report-1",
  organization_id: "org-1",
  created_by_user_id: "user-1",
  name: "Monthly costs",
  description: null,
  format: "csv",
  recipients: [],
  destination_ids: [destination.id],
  schedule_cron: null,
  next_run_at: null,
  enabled: true,
  scope: [],
  created_at: "2026-09-18T00:00:00Z",
  updated_at: "2026-09-18T00:00:00Z",
};

describe("ReportsClient", () => {
  it("saves selected Notification destinations on a new report", async () => {
    vi.mocked(createReportAction).mockResolvedValue({ data: report });
    render(
      <ReportsClient
        initialReports={[]}
        channels={[channel]}
        destinations={[destination]}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Create report" })[0],
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: report.name },
    });
    fireEvent.click(
      within(dialog).getByRole("checkbox", { name: /#finance/i }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create report" }),
    );

    await waitFor(() =>
      expect(createReportAction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: report.name,
          recipients: [],
          destinationIds: [destination.id],
        }),
      ),
    );
  });

  it("generates a report through the Notification delivery flow", async () => {
    vi.mocked(generateReportAction).mockResolvedValue({
      data: { notification_request_id: "notification-request-1" },
    });
    render(
      <ReportsClient
        initialReports={[report]}
        channels={[channel]}
        destinations={[destination]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /generate & send/i }));

    await waitFor(() =>
      expect(generateReportAction).toHaveBeenCalledWith(report.id),
    );
    expect((await screen.findByRole("status")).textContent).toContain(
      "queued for notification delivery",
    );
  });
});
