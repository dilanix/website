import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCostOverviewAction,
  queryCostExplorerAction,
} from "@/app/dashboard/products/cost-actions";
import type { CoreCostOverview } from "@/lib/core/api";
import { presetRange } from "@/lib/billing/cost-summaries";
import { SpendOverviewClient } from "./spend-overview-client";

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  getCostOverviewAction: vi.fn(),
  queryCostExplorerAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

const overview: CoreCostOverview = {
  period_start: "2026-08-12T00:00:00Z",
  period_end: "2026-09-11T00:00:00Z",
  previous_period_start: "2026-07-13T00:00:00Z",
  previous_period_end: "2026-08-12T00:00:00Z",
  by_currency: [
    {
      currency: "USD",
      current_total: "20.00",
      previous_total: "10.00",
      change_percent: 100,
      top_services: [{ service_name: "Amazon EC2", amount: "20.00" }],
      other_total: "0.00",
      by_charge_category: [{ category: "Usage", amount: "20.00" }],
    },
  ],
};

function renderClient(
  overrides: Partial<Parameters<typeof SpendOverviewClient>[0]> = {},
) {
  return render(
    <SpendOverviewClient
      initialOverview={overview}
      initialTrendPoints={[]}
      initialRange={presetRange("30d")}
      connectionId={null}
      targetId={null}
      scopeSuffix=""
      {...overrides}
    />,
  );
}

describe("SpendOverviewClient", () => {
  it("renders the initial overview's totals and breakdowns", () => {
    renderClient();

    expect(screen.getAllByText("20.00 USD").length).toBeGreaterThan(0);
    expect(screen.getByText("Amazon EC2")).toBeTruthy();
    expect(screen.getByText("Usage")).toBeTruthy();
  });

  it("re-queries with the newly clicked preset's range, not the previous one", async () => {
    vi.mocked(getCostOverviewAction).mockResolvedValue({
      data: {
        ...overview,
        by_currency: [{ ...overview.by_currency[0]!, current_total: "5.00" }],
      },
    });
    vi.mocked(queryCostExplorerAction).mockResolvedValue({
      data: { items: [] },
    });

    renderClient();

    fireEvent.click(screen.getByRole("button", { name: "1 day" }));

    const expectedRange = presetRange("1d");
    await waitFor(() =>
      expect(getCostOverviewAction).toHaveBeenCalledWith(
        expect.objectContaining({
          periodStart: expectedRange.start.toISOString(),
          periodEnd: expectedRange.end.toISOString(),
        }),
      ),
    );
    expect(await screen.findByText("5.00 USD")).toBeTruthy();
  });

  it("rejects an incomplete custom range without querying", () => {
    renderClient();

    fireEvent.click(screen.getByRole("button", { name: "Custom" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(screen.getByRole("alert").textContent).toBe(
      "Choose a valid start and end date.",
    );
    expect(getCostOverviewAction).not.toHaveBeenCalled();
  });

  it("renders a spend trend chart from the product's own Explorer series, never a different dataset", () => {
    renderClient({
      initialTrendPoints: [
        {
          bucket_start: "2026-08-12T00:00:00Z",
          bucket_end: "2026-08-13T00:00:00Z",
          currency: "USD",
          amount: "3.000000",
          group: {},
        },
        {
          bucket_start: "2026-08-13T00:00:00Z",
          bucket_end: "2026-08-14T00:00:00Z",
          currency: "USD",
          amount: "7.000000",
          group: {},
        },
      ],
    });

    expect(screen.getByText("Spend trend · USD")).toBeTruthy();
    expect(
      screen.getByRole("img", {
        name: "USD spend trend for the selected period",
      }),
    ).toBeTruthy();
  });
});
