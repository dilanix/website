import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreAnomaly,
  CoreAnomalyNotificationSettings,
} from "@/lib/core/api";
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
  updateAnomalyNotificationSettingsAction: vi.fn(),
}));

const noNotifications: CoreAnomalyNotificationSettings = {
  min_severity: "low",
  destination_ids: [],
};

function renderClient(
  initialAnomalies: CoreAnomaly[],
  notificationSettings: CoreAnomalyNotificationSettings = noNotifications,
) {
  return render(
    <AnomaliesClient
      initialAnomalies={initialAnomalies}
      notificationSettings={notificationSettings}
      channels={[]}
      destinations={[]}
    />,
  );
}

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
    renderClient([]);
    expect(usePageTour).toHaveBeenLastCalledWith(COST_ANOMALIES_TOUR_KEY, {
      ready: true,
    });
    expect(anchored("detection")).toHaveLength(1);
    expect(anchored("filters")).toHaveLength(1);
    expect(anchored("notifications")[0]?.textContent).toContain(
      "Notifications off",
    );
    expect(anchored("summary")).toHaveLength(0);
  });

  it("lets every anomaly change status, including reopening a resolved one", () => {
    renderClient(
      [
        anomaly({
          id: "newest",
          status: "resolved",
          detected_at: "2026-10-03T01:00:00Z",
        }),
        anomaly({ id: "older" }),
      ],
      { min_severity: "medium", destination_ids: ["d1", "d2"] },
    );
    expect(anchored("summary")).toHaveLength(2);
    expect(anchored("details")[0]?.textContent).toContain("All spend");
    const actions = anchored("actions");
    expect(actions).toHaveLength(2);
    expect(actions[0]?.textContent?.trim()).toBe("Reopen");
    expect(actions[1]?.textContent).toContain("Acknowledge");
    expect(actions[1]?.textContent).toContain("Resolve");
    expect(anchored("open")[0]?.getAttribute("href")).toBe(
      "/dashboard/products/cost/anomalies/newest",
    );
    expect(anchored("notifications")[0]?.textContent).toContain(
      "Notifying 2 destinations",
    );
  });
});
