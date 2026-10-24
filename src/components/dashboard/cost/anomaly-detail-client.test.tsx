import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreAnomaly, CoreAnomalyBreakdown } from "@/lib/core/api";
import { AnomalyDetailClient } from "./anomaly-detail-client";

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  updateAnomalyStatusAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const anomaly: CoreAnomaly = {
  id: "a1",
  organization_id: "o1",
  connection_id: "c1",
  target_id: "t1",
  detected_at: "2026-10-23T20:10:00Z",
  period_start: "2026-10-22T00:00:00Z",
  period_end: "2026-10-23T00:00:00Z",
  expected_amount: "1.195",
  actual_amount: "2.375",
  currency: "USD",
  deviation_percent: "98.7",
  severity: "low",
  status: "resolved",
  acknowledged_at: null,
  resolved_at: "2026-10-24T08:00:00Z",
  scope: [],
  created_at: "2026-10-23T20:10:00Z",
  updated_at: "2026-10-24T08:00:00Z",
};

const breakdown: CoreAnomalyBreakdown = {
  source: "cost_usage",
  baseline_days: 2,
  daily: [
    { day: "2026-10-20T00:00:00Z", amount: "1.2", kind: "baseline" },
    { day: "2026-10-21T00:00:00Z", amount: "1.19", kind: "baseline" },
    { day: "2026-10-22T00:00:00Z", amount: "2.375", kind: "anomaly" },
    { day: "2026-10-23T00:00:00Z", amount: "1.3", kind: "after" },
  ],
  drivers: [
    {
      dimension: "service_name",
      increases: [
        {
          value: "Amazon EC2",
          actual_amount: "1.9",
          expected_amount: "0.8",
          delta: "1.1",
        },
      ],
    },
    { dimension: "region_id", increases: [] },
  ],
};

describe("AnomalyDetailClient", () => {
  it("explains the anomaly with its daily spend and what grew, and can reopen it", () => {
    render(
      <AnomalyDetailClient
        initialAnomaly={anomaly}
        accountLabels={{ t1: "Production · 123456789012" }}
        breakdown={breakdown}
        breakdownError=""
      />,
    );
    expect(screen.getByText("2.38 USD vs. 1.20 USD expected")).toBeTruthy();
    expect(screen.getByText(/Production · 123456789012/)).toBeTruthy();
    expect(screen.getByText("+99%")).toBeTruthy();
    expect(screen.getByText("Amazon EC2")).toBeTruthy();
    expect(screen.getByText("+1.10 USD")).toBeTruthy();
    expect(screen.getByText("No region grew above its average.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reopen/ })).toBeTruthy();
  });

  it("still shows the anomaly when its breakdown is unavailable", () => {
    render(
      <AnomalyDetailClient
        initialAnomaly={anomaly}
        accountLabels={{}}
        breakdown={null}
        breakdownError="Billing data is unavailable"
      />,
    );
    expect(screen.getByText("2.38 USD vs. 1.20 USD expected")).toBeTruthy();
    expect(
      screen.getByText(/breakdown for this anomaly is unavailable/),
    ).toBeTruthy();
  });
});
