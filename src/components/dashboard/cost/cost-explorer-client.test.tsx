import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  queryCostExplorerAction,
  runCostExplorerSavedViewAction,
} from "@/app/dashboard/products/cost-actions";
import type { CoreCostExplorerPoint, CoreSavedView } from "@/lib/core/api";
import { CostExplorerClient } from "./cost-explorer-client";

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  queryCostExplorerAction: vi.fn(),
  runCostExplorerSavedViewAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const point: CoreCostExplorerPoint = {
  bucket_start: "2026-09-05T00:00:00Z",
  bucket_end: "2026-09-06T00:00:00Z",
  currency: "USD",
  amount: "42.000000",
  group: { service_name: "Amazon EC2" },
};

const savedView: CoreSavedView = {
  id: "10000000-0000-4000-8000-000000000001",
  organization_id: "20000000-0000-4000-8000-000000000001",
  created_by_user_id: "30000000-0000-4000-8000-000000000001",
  name: "Production services",
  description: null,
  group_by: ["service_name"],
  granularity: "daily",
  visibility: "private",
  scope: [
    {
      dimension: "provider_name",
      operator: "eq",
      value: "AWS",
    },
  ],
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

describe("CostExplorerClient", () => {
  it("replaces stale rows when the selected connection changes", async () => {
    const { rerender } = render(
      <CostExplorerClient
        initialItems={[point]}
        initialPeriodStart="2026-09-01"
        initialPeriodEnd="2026-09-11"
        savedViews={[]}
        connectionId="c328ae26-c7d3-4664-90e3-4d7d73fb3b3a"
        targetId={null}
      />,
    );

    expect(screen.getByText("Service: Amazon EC2")).toBeTruthy();
    expect(screen.getByText("Connection c328ae26…")).toBeTruthy();

    rerender(
      <CostExplorerClient
        initialItems={[]}
        initialPeriodStart="2026-09-01"
        initialPeriodEnd="2026-09-11"
        savedViews={[]}
        connectionId="b0576937-9a43-4ea5-851d-c0aef25a69f7"
        targetId={null}
      />,
    );

    expect(await screen.findByText("No cost data for this query")).toBeTruthy();
    expect(screen.queryByText("Service: Amazon EC2")).toBeNull();
    expect(screen.getByText("Connection b0576937…")).toBeTruthy();
  });

  it("renders initial data and submits an inclusive date-range query", async () => {
    vi.mocked(queryCostExplorerAction).mockResolvedValue({
      data: { items: [point] },
    });

    render(
      <CostExplorerClient
        initialItems={[point]}
        initialPeriodStart="2026-09-01"
        initialPeriodEnd="2026-09-11"
        savedViews={[savedView]}
        connectionId={null}
        targetId={null}
      />,
    );

    expect(screen.getByText("Service: Amazon EC2")).toBeTruthy();
    expect(screen.getAllByText("42.00 USD")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Run query" }));

    await waitFor(() =>
      expect(queryCostExplorerAction).toHaveBeenCalledWith({
        period_start: "2026-09-01T00:00:00.000Z",
        period_end: "2026-09-12T00:00:00.000Z",
        metric: "effective_cost",
        connection_id: null,
        target_id: null,
        granularity: "daily",
        group_by: [{ dimension: "service_name" }],
        scope: [],
      }),
    );
  }, 20_000);

  it("runs a saved view for the selected period", async () => {
    vi.mocked(runCostExplorerSavedViewAction).mockResolvedValue({
      data: { items: [point] },
    });

    render(
      <CostExplorerClient
        initialItems={[]}
        initialPeriodStart="2026-09-01"
        initialPeriodEnd="2026-09-11"
        savedViews={[savedView]}
        connectionId={null}
        targetId={null}
      />,
    );

    fireEvent.change(screen.getByLabelText("Saved view"), {
      target: { value: savedView.id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run view" }));

    await waitFor(() =>
      expect(runCostExplorerSavedViewAction).toHaveBeenCalledWith({
        savedViewId: savedView.id,
        periodStart: "2026-09-01T00:00:00.000Z",
        periodEnd: "2026-09-12T00:00:00.000Z",
        connectionId: null,
        targetId: null,
      }),
    );
    expect(await screen.findByText("Service: Amazon EC2")).toBeTruthy();
  }, 20_000);
});
