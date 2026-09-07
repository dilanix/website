import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResourceMetricsPanel } from "./resource-metrics-panel";

vi.mock("@/app/dashboard/integrations/actions", () => ({
  listMetricDatapointsAction: vi.fn(),
}));

afterEach(cleanup);

describe("ResourceMetricsPanel", () => {
  it("renders utilization summary, chart, and recent datapoints", () => {
    render(
      <ResourceMetricsPanel
        connectionId="conn-1"
        resourceId="resource-1"
        initialMetrics={{
          total: 2,
          items: [
            {
              id: "point-2",
              resource_id: "resource-1",
              namespace: "AWS/ECS",
              metric_name: "CPUUtilization",
              statistic: "Average",
              unit: "Percent",
              period_seconds: 300,
              timestamp: "2026-09-07T11:00:00Z",
              value: 40,
            },
            {
              id: "point-1",
              resource_id: "resource-1",
              namespace: "AWS/ECS",
              metric_name: "CPUUtilization",
              statistic: "Average",
              unit: "Percent",
              period_seconds: 300,
              timestamp: "2026-09-07T10:00:00Z",
              value: 20,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Latest")).toBeTruthy();
    expect(screen.getAllByText("40%")).toHaveLength(3);
    expect(screen.getAllByText("30%")).toHaveLength(2);
    expect(
      screen.getByRole("img", {
        name: "CPU Utilization · Average utilization over time",
      }),
    ).toBeTruthy();
    expect(screen.getAllByText("300s")).toHaveLength(2);
  });

  it("explains how to populate an empty metrics dataset", () => {
    render(
      <ResourceMetricsPanel
        connectionId="conn-1"
        resourceId="resource-1"
        initialMetrics={{ items: [], total: 0 }}
      />,
    );

    expect(screen.getByText("No utilization metrics yet")).toBeTruthy();
    expect(screen.getByText(/metrics\.utilization sync/)).toBeTruthy();
  });
});
