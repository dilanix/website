import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryCostBreakdownAction } from "@/app/dashboard/products/cost-actions";
import type { CoreCostBreakdown } from "@/lib/core/api";
import { CostBreakdownPanel } from "./cost-breakdown-panel";

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  queryCostBreakdownAction: vi.fn(),
}));

function breakdown(
  overrides: Partial<CoreCostBreakdown> = {},
): CoreCostBreakdown {
  return {
    period_start: "2026-08-01T00:00:00Z",
    period_end: "2026-09-01T00:00:00Z",
    previous_period_start: "2026-07-01T00:00:00Z",
    previous_period_end: "2026-08-01T00:00:00Z",
    metric: "effective_cost",
    dimension: "service_name",
    tag_key: null,
    source: "cost_usage",
    by_currency: [
      {
        currency: "USD",
        current_total: "36.00",
        previous_total: "18.00",
        absolute_delta: "18.00",
        change_percent: 100,
        items: [
          {
            value: "Amazon EC2",
            current_amount: "30.00",
            previous_amount: "10.00",
            absolute_delta: "20.00",
            change_percent: 200,
            status: "increased",
            share_percent: 83.3,
          },
          {
            value: "Amazon RDS",
            current_amount: "0",
            previous_amount: "8.00",
            absolute_delta: "-8.00",
            change_percent: -100,
            status: "removed",
            share_percent: 0,
          },
        ],
        other: {
          count: 2,
          current_amount: "6.00",
          previous_amount: "0",
          absolute_delta: "6.00",
        },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(queryCostBreakdownAction).mockResolvedValue({ data: breakdown() });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderPanel() {
  return render(
    <CostBreakdownPanel
      periodStart="2026-08-01T00:00:00Z"
      periodEnd="2026-09-01T00:00:00Z"
      connectionId={null}
      targetId={null}
    />,
  );
}

describe("CostBreakdownPanel", () => {
  it("shows current, previous, change and Core's status per value plus Other", async () => {
    renderPanel();

    expect(await screen.findByText("Amazon EC2")).toBeTruthy();
    expect(screen.getByText("+20.00 USD")).toBeTruthy();
    expect(screen.getByText("Gone")).toBeTruthy();
    expect(screen.getByText("Other (2)")).toBeTruthy();
  });

  it("drills into a clicked value with the next dimension and keeps the filter", async () => {
    renderPanel();

    fireEvent.click(await screen.findByText("Amazon EC2"));

    await waitFor(() =>
      expect(queryCostBreakdownAction).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dimension: "region_id",
          scope: [
            {
              dimension: "service_name",
              tag_key: null,
              operator: "eq",
              value: "Amazon EC2",
            },
          ],
        }),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "All spend" }));

    await waitFor(() =>
      expect(queryCostBreakdownAction).toHaveBeenLastCalledWith(
        expect.objectContaining({ dimension: "region_id", scope: [] }),
      ),
    );
  });

  it("explains when Core requires complete FOCUS coverage", async () => {
    vi.mocked(queryCostBreakdownAction).mockResolvedValue({
      error: "409",
      coverageRequired: true,
    });

    renderPanel();

    expect(
      await screen.findByText(/needs complete FOCUS billing coverage/),
    ).toBeTruthy();
  });

  it("asks for a tag key before grouping by tag", async () => {
    renderPanel();
    await screen.findByText("Amazon EC2");

    fireEvent.click(screen.getByRole("button", { name: "Tag" }));

    expect(
      screen.getByText("Enter a tag key to group spend by its values."),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Tag key"), {
      target: { value: "team" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Group by tag" }));

    await waitFor(() =>
      expect(queryCostBreakdownAction).toHaveBeenLastCalledWith(
        expect.objectContaining({ dimension: "tag", tag_key: "team" }),
      ),
    );
  });
});
