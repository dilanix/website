import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCostDriversAction,
  getCostForecastAction,
  getCostOverviewAction,
  queryCostExplorerAction,
} from "@/app/dashboard/products/cost-actions";
import type { CoreCostOverview } from "@/lib/core/api";
import { monthToDateRange, presetRange } from "@/lib/billing/cost-summaries";
import { SpendOverviewClient } from "./spend-overview-client";

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  getCostOverviewAction: vi.fn(),
  queryCostExplorerAction: vi.fn(),
  getCostDriversAction: vi.fn(),
  getCostForecastAction: vi.fn(),
}));

beforeEach(() => {
  // The "Breakdown by dimension" panel queries Cost Explorer on mount,
  // independent of the preset/custom-range interactions each test exercises
  // — give it a harmless default so tests that don't care about it don't
  // have to stub it themselves.
  vi.mocked(queryCostExplorerAction).mockResolvedValue({ data: { items: [] } });
  // The "Cost Drivers" panel queries on mount too, same as the dimension
  // breakdown above — same harmless default.
  vi.mocked(getCostDriversAction).mockResolvedValue({
    data: {
      period_start: "",
      period_end: "",
      previous_period_start: "",
      previous_period_end: "",
      metric: "effective_cost",
      dimension: "service_name",
      increases: [],
      decreases: [],
    },
  });
  // The "Forecast" panel queries on mount too — same harmless default.
  vi.mocked(getCostForecastAction).mockResolvedValue({
    data: {
      period_start: "",
      period_end: "",
      source: "cost_usage",
      data_through: "",
      complete_days: 0,
      remaining_days: 0,
      method: "period_to_date_daily_rate",
      method_version: "1",
      insufficient_data: true,
      by_currency: [],
    },
  });
});

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
  source: "cost_usage",
  by_currency: [
    {
      currency: "USD",
      current_total: "20.00",
      previous_total: "10.00",
      absolute_delta: "10.00",
      change_percent: 100,
      top_services: [{ service_name: "Amazon EC2", amount: "20.00" }],
      other_total: "0.00",
      by_charge_category: [{ category: "Usage", amount: "20.00" }],
      financial_breakdown: {
        gross_usage: "20.00",
        tax: "0.00",
        credits: "0.00",
        other_adjustments: "0.00",
        net_cost: "20.00",
        discount_amount: null,
      },
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
      initialPreviousTrendPoints={[]}
      initialTrendAvailable
      initialPreviousTrendAvailable
      initialRange={monthToDateRange()}
      connectionId={null}
      targetId={null}
      scopeSuffix=""
      budgets={[]}
      anomalies={[]}
      {...overrides}
    />,
  );
}

describe("SpendOverviewClient", () => {
  it.each([
    ["cost_summary", "Cost Explorer"],
    ["cost_usage", "FOCUS"],
  ] as const)("renders the %s source as %s", (source, label) => {
    renderClient({ initialOverview: { ...overview, source } });

    expect(screen.getByText(label)).toBeTruthy();
  });

  it("defaults to month-to-date and keeps rolling 30 days available", async () => {
    vi.mocked(getCostOverviewAction).mockResolvedValue({ data: overview });
    renderClient();

    expect(screen.getByRole("button", { name: "Month to date" })).toBeTruthy();
    expect(queryCostExplorerAction).toHaveBeenCalledWith(
      expect.objectContaining({
        period_start: overview.period_start,
        period_end: overview.period_end,
        group_by: [{ dimension: "provider_name" }],
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "30 days" }));

    const expectedRange = presetRange("30d");
    await waitFor(() =>
      expect(getCostOverviewAction).toHaveBeenCalledWith(
        expect.objectContaining({
          periodStart: expectedRange.start.toISOString(),
          periodEnd: expectedRange.end.toISOString(),
        }),
      ),
    );
  });

  it("discloses and queries the complete FOCUS sub-range resolved by Overview", () => {
    const resolvedOverview = {
      ...overview,
      period_start: "2026-09-01T00:00:00Z",
      period_end: "2026-09-15T00:00:00Z",
      previous_period_start: "2026-08-18T00:00:00Z",
      previous_period_end: "2026-09-01T00:00:00Z",
    };
    localStorage.setItem(
      "dilanix.dashboard.filters.v1:anonymous:cost.overview.period",
      JSON.stringify("30d"),
    );
    vi.mocked(getCostOverviewAction).mockResolvedValue({
      data: resolvedOverview,
    });

    renderClient({
      initialOverview: resolvedOverview,
      initialRange: presetRange("30d"),
    });

    expect(
      screen.getAllByText("FOCUS coverage: Sep 1 – Sep 14, 2026.").length,
    ).toBe(2);
    expect(queryCostExplorerAction).toHaveBeenCalledWith(
      expect.objectContaining({
        period_start: resolvedOverview.period_start,
        period_end: resolvedOverview.period_end,
        group_by: [{ dimension: "provider_name" }],
      }),
    );
  });

  it("shows FOCUS-only widgets as unavailable when Overview falls back", () => {
    renderClient({
      initialOverview: { ...overview, source: "cost_summary" },
      initialTrendAvailable: false,
      initialPreviousTrendAvailable: false,
    });

    expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "This FOCUS-only breakdown is unavailable until the selected period has complete coverage.",
      ),
    ).toBeTruthy();
    expect(queryCostExplorerAction).not.toHaveBeenCalled();
  });

  it("renders the initial overview's totals and breakdowns", () => {
    renderClient();

    expect(screen.getAllByText("20.00 USD").length).toBeGreaterThan(0);
    expect(screen.getByText("Amazon EC2")).toBeTruthy();
    expect(screen.getByText("Usage")).toBeTruthy();
  });

  it("re-queries with the newly clicked preset's range, not the previous one", async () => {
    vi.mocked(getCostOverviewAction).mockResolvedValue({
      data: overview,
    });
    vi.mocked(queryCostExplorerAction).mockResolvedValue({
      data: {
        items: [
          {
            bucket_start: "2026-09-01T00:00:00Z",
            bucket_end: "2026-09-02T00:00:00Z",
            currency: "USD",
            amount: "5.00",
            group: {},
          },
        ],
      },
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
    expect(queryCostExplorerAction).toHaveBeenCalledWith(
      expect.objectContaining({
        period_start: overview.period_start,
        period_end: overview.period_end,
        granularity: "daily",
        group_by: [],
      }),
    );
    expect((await screen.findAllByText("5.00 USD")).length).toBeGreaterThan(0);
  });

  it("never exposes a metric selector, and always queries the canonical effective_cost measure", async () => {
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

    expect(screen.queryByLabelText("Metric")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "1 day" }));

    await waitFor(() =>
      expect(getCostOverviewAction).toHaveBeenCalledWith(
        expect.not.objectContaining({ metric: expect.anything() }),
      ),
    );
    expect(queryCostExplorerAction).toHaveBeenCalledWith(
      expect.objectContaining({ metric: "effective_cost" }),
    );
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

  it("sums the product's own Explorer series into the headline total, never a different dataset", () => {
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

    expect(screen.getByText("USD · Current period")).toBeTruthy();
    expect(screen.getByText("10.00 USD")).toBeTruthy();
  });

  it("shows the current period's total with the vs-previous-period delta inline", () => {
    renderClient({
      initialTrendPoints: [
        {
          bucket_start: "2026-09-01T00:00:00Z",
          bucket_end: "2026-09-02T00:00:00Z",
          currency: "USD",
          amount: "20.00",
          group: {},
        },
      ],
      initialPreviousTrendPoints: [
        {
          bucket_start: "2026-08-01T00:00:00Z",
          bucket_end: "2026-08-02T00:00:00Z",
          currency: "USD",
          amount: "10.00",
          group: {},
        },
      ],
    });

    expect(screen.getByText("USD · Current period")).toBeTruthy();
    expect(screen.queryByText("USD · Previous period")).toBeNull();
    expect(
      screen.getByText("10.00 USD (100.0%) vs previous period"),
    ).toBeTruthy();
  });

  it("queries Forecast for the currently displayed range and renders the projection", async () => {
    const displayed = monthToDateRange();
    vi.mocked(getCostForecastAction).mockResolvedValue({
      data: {
        period_start: displayed.start.toISOString(),
        period_end: displayed.end.toISOString(),
        source: "cost_usage",
        data_through: "2026-09-10T00:00:00Z",
        complete_days: 10,
        remaining_days: 21,
        method: "period_to_date_daily_rate",
        method_version: "1",
        insufficient_data: false,
        by_currency: [
          {
            currency: "USD",
            observed_amount: "100.00",
            daily_rate: "10.00",
            forecast_amount: "310.00",
          },
        ],
      },
    });

    renderClient();

    await waitFor(() =>
      expect(getCostForecastAction).toHaveBeenCalledWith(
        expect.objectContaining({
          periodStart: displayed.start.toISOString(),
          periodEnd: displayed.end.toISOString(),
        }),
      ),
    );
    expect(await screen.findByText("310.00 USD")).toBeTruthy();
    expect(screen.getByText(/100\.00 USD so far/)).toBeTruthy();
  });

  it("renders the spend trajectory chart once a daily FOCUS series is available", async () => {
    const displayed = monthToDateRange();
    const day1 = displayed.start.toISOString();
    const day2 = new Date(
      displayed.start.getTime() + 24 * 60 * 60 * 1000,
    ).toISOString();
    vi.mocked(getCostForecastAction).mockResolvedValue({
      data: {
        period_start: displayed.start.toISOString(),
        period_end: displayed.end.toISOString(),
        source: "cost_usage",
        data_through: day2,
        complete_days: 2,
        remaining_days: 10,
        method: "period_to_date_daily_rate",
        method_version: "1",
        insufficient_data: false,
        by_currency: [
          {
            currency: "USD",
            observed_amount: "30.00",
            daily_rate: "15.00",
            forecast_amount: "180.00",
          },
        ],
      },
    });

    renderClient({
      initialOverview: {
        ...overview,
        period_start: displayed.start.toISOString(),
        period_end: displayed.end.toISOString(),
      },
      initialTrendPoints: [
        {
          bucket_start: day1,
          bucket_end: day2,
          currency: "USD",
          amount: "10.00",
          group: {},
        },
        {
          bucket_start: day2,
          bucket_end: day2,
          currency: "USD",
          amount: "20.00",
          group: {},
        },
      ],
      anomalies: [
        {
          id: "an-1",
          organization_id: "org-1",
          detected_at: day2,
          period_start: day1,
          period_end: day2,
          expected_amount: "5.00",
          actual_amount: "10.00",
          currency: "USD",
          deviation_percent: "100",
          severity: "high",
          status: "open",
          acknowledged_at: null,
          resolved_at: null,
          scope: [],
          created_at: day1,
          updated_at: day1,
        },
      ],
    });

    expect(
      await screen.findByRole("img", { name: /Cumulative USD spend/ }),
    ).toBeTruthy();
  });

  it("shows an insufficient-data message instead of a fabricated projection", async () => {
    const displayed = monthToDateRange();
    vi.mocked(getCostForecastAction).mockResolvedValue({
      data: {
        period_start: displayed.start.toISOString(),
        period_end: displayed.end.toISOString(),
        source: "cost_usage",
        data_through: displayed.start.toISOString(),
        complete_days: 0,
        remaining_days: 30,
        method: "period_to_date_daily_rate",
        method_version: "1",
        insufficient_data: true,
        by_currency: [],
      },
    });

    renderClient();

    expect(
      await screen.findByText(
        "Not enough complete days yet in this period to project a forecast.",
      ),
    ).toBeTruthy();
  });

  it("shows a not-in-progress message for a historical period instead of a raw error", async () => {
    vi.mocked(getCostForecastAction).mockResolvedValue({
      error: "forecast period must be currently in progress: ...",
      periodNotInProgress: true,
    });

    renderClient();

    expect(
      await screen.findByText(
        "Forecast only applies to a period that is still in progress — pick a range that includes today.",
      ),
    ).toBeTruthy();
  });
});
