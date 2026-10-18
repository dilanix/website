import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listMetricDatapointsAction } from "@/app/dashboard/integrations/actions";
import { ResourceMetricsPanel } from "./resource-metrics-panel";

vi.mock("@/app/dashboard/integrations/actions", () => ({
  listMetricDatapointsAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

const cpuSummary = {
  resource_id: "resource-1",
  namespace: "AWS/ECS",
  metric_name: "CPUUtilization",
  statistic: "Average",
  unit: "Percent",
  sample_count: 576,
  average: 30,
  maximum: 40,
  latest_value: 40,
  latest_timestamp: "2026-09-07T11:00:00Z",
};

const memorySummary = {
  ...cpuSummary,
  metric_name: "MemoryUtilization",
  sample_count: 575,
  average: 60,
  maximum: 70,
  latest_value: 65,
};

describe("ResourceMetricsPanel", () => {
  it("renders utilization summary, chart, and recent datapoints", () => {
    render(
      <ResourceMetricsPanel
        connectionId="conn-1"
        resourceId="resource-1"
        initialMetricSummary={{ items: [cpuSummary, memorySummary] }}
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
    expect(screen.getByText("Average")).toBeTruthy();
    expect(screen.getByText("Maximum")).toBeTruthy();
    expect(screen.getByText("Samples")).toBeTruthy();
    expect(screen.getByText("576")).toBeTruthy();
    expect(
      screen.getByRole("option", {
        name: "Memory Utilization · Average · AWS/ECS",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("img", {
        name: "CPU Utilization · Average utilization over time",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/Sep 7, .*: 40%/, { selector: "title" }),
    ).toBeTruthy();
    expect(screen.getAllByText("300s")).toHaveLength(2);
  });

  it("discovers every series from summary and fetches only the selected series", async () => {
    vi.mocked(listMetricDatapointsAction).mockResolvedValueOnce({
      data: {
        total: 1,
        items: [
          {
            id: "memory-point",
            resource_id: "resource-1",
            namespace: "AWS/ECS",
            metric_name: "MemoryUtilization",
            statistic: "Average",
            unit: "Percent",
            period_seconds: 300,
            timestamp: "2026-09-07T11:00:00Z",
            value: 65,
          },
        ],
      },
    });

    render(
      <ResourceMetricsPanel
        connectionId="conn-1"
        resourceId="resource-1"
        initialMetricSummary={{ items: [cpuSummary, memorySummary] }}
        initialMetrics={{ items: [], total: 1000 }}
      />,
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: {
        value: "AWS/ECS\u0000MemoryUtilization\u0000Average",
      },
    });

    await waitFor(() =>
      expect(listMetricDatapointsAction).toHaveBeenCalledWith("conn-1", {
        resourceId: "resource-1",
        limit: 100,
        offset: 0,
        namespace: "AWS/ECS",
        metricName: "MemoryUtilization",
      }),
    );
    expect((await screen.findAllByText("65%")).length).toBeGreaterThan(0);
  });

  it("loads the default metric when an ECS service is selected", async () => {
    const secondServiceSummary = {
      ...cpuSummary,
      resource_id: "resource-2",
      latest_value: 25,
    };
    vi.mocked(listMetricDatapointsAction).mockResolvedValueOnce({
      data: {
        total: 1,
        items: [
          {
            id: "resource-2-cpu-point",
            resource_id: "resource-2",
            namespace: "AWS/ECS",
            metric_name: "CPUUtilization",
            statistic: "Average",
            unit: null,
            period_seconds: 300,
            timestamp: "2026-09-07T11:00:00Z",
            value: 25,
          },
        ],
      },
    });

    render(
      <ResourceMetricsPanel
        connectionId="conn-1"
        resourceId="resource-1"
        resourceOptions={[
          { id: "resource-1", label: "api" },
          { id: "resource-2", label: "worker" },
        ]}
        resourceSelectorLabel="ECS service"
        initialMetricSummary={{
          items: [cpuSummary, memorySummary, secondServiceSummary],
        }}
        initialMetrics={{ items: [], total: 0 }}
      />,
    );

    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "resource-2" },
    });

    await waitFor(() =>
      expect(listMetricDatapointsAction).toHaveBeenCalledWith("conn-1", {
        resourceId: "resource-2",
        limit: 100,
        offset: 0,
        namespace: "AWS/ECS",
        metricName: "CPUUtilization",
      }),
    );
    expect((await screen.findAllByText("25%")).length).toBeGreaterThan(0);
  });

  it("explains how to populate an empty metrics dataset", () => {
    render(
      <ResourceMetricsPanel
        connectionId="conn-1"
        resourceId="resource-1"
        initialMetricSummary={{ items: [] }}
        initialMetrics={{ items: [], total: 0 }}
      />,
    );

    expect(screen.getByText("No utilization metrics yet")).toBeTruthy();
    expect(screen.getByText(/metrics\.utilization sync/)).toBeTruthy();
  });
});
