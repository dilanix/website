import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreIntegrationConnection,
  CoreIntegrationTarget,
  CoreNotificationChannel,
  CoreNotificationDestination,
  CoreReport,
} from "@/lib/core/api";
import {
  createReportAction,
  generateReportAction,
} from "@/app/dashboard/products/cost-actions";
import { tourTargetSelector } from "@/lib/tours/anchors";
import {
  COST_REPORTS_TOUR_KEY,
  costReportsActions,
  costReportsAnchors,
} from "@/lib/tours/definitions/cost-reports";
import { ReportsClient } from "./reports-client";

const { usePageTour } = vi.hoisted(() => ({ usePageTour: vi.fn() }));
vi.mock("@/components/tours/tour-provider", () => ({ usePageTour }));

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  createReportAction: vi.fn(),
  deleteReportAction: vi.fn(),
  generateReportAction: vi.fn(),
  listGeneratedReportsAction: vi.fn().mockResolvedValue({ data: [] }),
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

const connection: CoreIntegrationConnection = {
  id: "10000000-0000-4000-8000-000000000001",
  organization_id: "org-1",
  integration_id: "30000000-0000-4000-8000-000000000001",
  name: "AWS",
  status: "connected",
  configuration: {},
  external_reference: null,
  last_verified_at: "2026-09-01T00:00:00Z",
  last_success_at: null,
  last_error_at: null,
  last_error_code: null,
  created_at: "2026-09-01T00:00:00Z",
  last_synced_at: "2026-09-11T00:00:00Z",
};

const prodTarget: CoreIntegrationTarget = {
  id: "40000000-0000-4000-8000-000000000001",
  organization_id: "org-1",
  connection_id: connection.id,
  target_type: "account",
  external_id: "123456789012",
  display_name: "Prod",
  parent_target_id: null,
  status: "verified",
  provider_metadata: {},
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

const report: CoreReport = {
  id: "report-1",
  organization_id: "org-1",
  created_by_user_id: "user-1",
  name: "Monthly costs",
  description: null,
  connection_id: null,
  target_id: null,
  format: "csv",
  recipients: [],
  destination_ids: [destination.id],
  period_preset: "last_month",
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
        connections={[connection]}
        targets={[prodTarget]}
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

  it("narrows a new report to the selected account and names it in the list", async () => {
    vi.mocked(createReportAction).mockResolvedValue({
      data: {
        ...report,
        connection_id: connection.id,
        target_id: prodTarget.id,
      },
    });
    render(
      <ReportsClient
        initialReports={[]}
        channels={[channel]}
        destinations={[destination]}
        connections={[connection]}
        targets={[prodTarget]}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Create report" })[0],
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: report.name },
    });
    fireEvent.change(
      within(dialog).getByRole("combobox", { name: "Account" }),
      {
        target: { value: `target:${prodTarget.id}` },
      },
    );
    fireEvent.click(
      within(dialog).getByRole("checkbox", { name: /#finance/i }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create report" }),
    );

    await waitFor(() =>
      expect(createReportAction).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionId: connection.id,
          targetId: prodTarget.id,
        }),
      ),
    );
    expect(await screen.findByText(/Account: AWS · Prod/)).toBeTruthy();
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
        connections={[connection]}
        targets={[prodTarget]}
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

  describe("product tour", () => {
    const offer = () => usePageTour.mock.calls.at(-1);
    const anchored = (name: keyof typeof costReportsAnchors) =>
      document.querySelectorAll(tourTargetSelector(costReportsAnchors[name]));
    const renderReports = (initialReports: CoreReport[]) =>
      render(
        <ReportsClient
          initialReports={initialReports}
          channels={[channel]}
          destinations={[destination]}
          connections={[connection]}
          targets={[prodTarget]}
        />,
      );

    it("opens an empty create form for the tour's form steps, and closes it unsaved", () => {
      renderReports([]);
      expect(offer()?.[0]).toBe(COST_REPORTS_TOUR_KEY);
      expect(offer()?.[1].ready).toBe(true);

      let close: (() => void) | void = undefined;
      act(() => {
        close = offer()?.[1].actions[costReportsActions.openForm]();
      });
      expect(
        screen.getByRole("dialog", { name: "Create report" }),
      ).toBeTruthy();
      const formAnchors = (
        Object.keys(costReportsAnchors) as (keyof typeof costReportsAnchors)[]
      ).filter((name) => name.startsWith("form"));
      expect(formAnchors.length).toBeGreaterThan(0);
      for (const name of formAnchors) expect(anchored(name)).toHaveLength(1);

      act(() => (close as (() => void) | void)?.());
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("anchors each report's row and actions, and is not ready while its history is open", () => {
      renderReports([report]);
      for (const name of [
        "report",
        "generate",
        "history",
        "reportActions",
      ] as const)
        expect(anchored(name)).toHaveLength(1);
      expect(anchored("reportActions")[0]?.textContent).toContain("Disable");

      fireEvent.click(screen.getByRole("button", { name: /History/ }));
      expect(offer()?.[1].ready).toBe(false);
    });
  });
});
