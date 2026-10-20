import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreAnomaly } from "@/lib/core/api";
import { tourTargetSelector } from "@/lib/tours/anchors";
import {
  COST_ANOMALIES_TOUR_KEY,
  costAnomaliesAnchors,
} from "@/lib/tours/definitions/cost-anomalies";
import { AnomaliesClient } from "./anomalies-client";

const { usePageTour } = vi.hoisted(() => ({ usePageTour: vi.fn() }));
vi.mock("@/components/tours/tour-provider", () => ({ usePageTour }));
vi.mock("@/app/dashboard/products/cost-actions", () => ({
  updateAnomalyStatusAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

function anomaly(overrides: Partial<CoreAnomaly>): CoreAnomaly {
  return {
    id: "a1",
    organization_id: "o1",
    detected_at: "2026-10-02T01:00:00Z",
    period_start: "2026-10-01T00:00:00Z",
    period_end: "2026-10-02T00:00:00Z",
    expected_amount: "100",
    actual_amount: "250",
    currency: "USD",
    deviation_percent: "150",
    severity: "medium",
    status: "open",
    acknowledged_at: null,
    resolved_at: null,
    scope: [],
    created_at: "2026-10-02T01:00:00Z",
    updated_at: "2026-10-02T01:00:00Z",
    ...overrides,
  };
}

const anchored = (name: keyof typeof costAnomaliesAnchors) =>
  document.querySelectorAll(tourTargetSelector(costAnomaliesAnchors[name]));

describe("AnomaliesClient product tour", () => {
  it("offers the tour without anomalies, showing how detection works and the filters", () => {
    render(<AnomaliesClient initialAnomalies={[]} />);
    expect(usePageTour).toHaveBeenLastCalledWith(COST_ANOMALIES_TOUR_KEY, {
      ready: true,
    });
    expect(anchored("detection")).toHaveLength(1);
    expect(anchored("filters")).toHaveLength(1);
    expect(anchored("summary")).toHaveLength(0);
  });

  it("points the actions step only at an anomaly that can still change", () => {
    render(
      <AnomaliesClient
        initialAnomalies={[
          anomaly({
            id: "newest",
            status: "resolved",
            detected_at: "2026-10-03T01:00:00Z",
          }),
          anomaly({ id: "older" }),
        ]}
      />,
    );
    expect(anchored("summary")).toHaveLength(2);
    expect(anchored("details")[0]?.textContent).toContain("All spend");
    expect(anchored("actions")).toHaveLength(1);
    expect(anchored("actions")[0]?.textContent).toContain("Acknowledge");
  });
});
