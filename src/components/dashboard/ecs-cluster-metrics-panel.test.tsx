import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CoreResource } from "@/lib/core/api";
import { EcsClusterMetricsPanel } from "./ecs-cluster-metrics-panel";

afterEach(cleanup);

const service: CoreResource = {
  id: "service-1",
  organization_id: "org-1",
  connection_id: "conn-1",
  target_id: "target-1",
  provider: "aws",
  provider_resource_type: "ecs.service",
  resource_type: "container.service",
  category: "container",
  external_id: "production/api",
  provider_resource_key: "arn:aws:ecs:eu-west-1:123:service/production/api",
  provider_sku: null,
  name: "api",
  region: "eu-west-1",
  zone: null,
  status: "ACTIVE",
  lifecycle_status: "active",
  missing_since: null,
  out_of_scope_since: null,
  tags: {},
  extra: {},
  capacity: {},
  first_seen_at: "2026-09-01T10:00:00Z",
  last_seen_at: "2026-09-08T10:00:00Z",
  specification: null,
  technical_summary: null,
};

function summary(metricName: string, latest: number, average: number) {
  return {
    resource_id: service.id,
    namespace: "AWS/ECS",
    metric_name: metricName,
    statistic: "Average",
    unit: null,
    sample_count: 576,
    average,
    maximum: latest,
    latest_value: latest,
    latest_timestamp: "2026-09-08T10:00:00Z",
  };
}

describe("EcsClusterMetricsPanel", () => {
  it("renders the EC2-style chart with service and metric selectors", () => {
    render(
      <EcsClusterMetricsPanel
        connectionId="conn-1"
        services={[service]}
        metricSummary={{
          items: [
            summary("CPUUtilization", 42, 30),
            summary("MemoryUtilization", 68, 55),
          ],
        }}
        initialMetrics={{
          total: 1,
          items: [
            {
              id: "cpu-point",
              resource_id: service.id,
              namespace: "AWS/ECS",
              metric_name: "CPUUtilization",
              statistic: "Average",
              unit: null,
              period_seconds: 300,
              timestamp: "2026-09-08T10:00:00Z",
              value: 42,
            },
          ],
        }}
      />,
    );

    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.getByRole("option", { name: "api" })).toBeTruthy();
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
    expect(screen.getAllByText("42%").length).toBeGreaterThan(0);
    expect(screen.getByText("30%")).toBeTruthy();
  });

  it("explains when inventory has not discovered any services", () => {
    render(
      <EcsClusterMetricsPanel
        connectionId="conn-1"
        services={[]}
        metricSummary={{ items: [] }}
        initialMetrics={{ items: [], total: 0 }}
      />,
    );

    expect(screen.getByText("No ECS services in this cluster")).toBeTruthy();
    expect(screen.getByText(/inventory\.resources sync/)).toBeTruthy();
  });
});
