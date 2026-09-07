import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CoreResource } from "@/lib/core/api";
import { ResourceDetailView } from "./resource-detail-view";

afterEach(cleanup);

const resource: CoreResource = {
  id: "resource-1",
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
  extra: {
    desired_count: 2,
    runtime_platform: {
      cpu_architecture: "ARM64",
      operating_system_family: "LINUX",
    },
  },
  capacity: {
    "compute.vcpu": 1,
    "memory.bytes": 2 * 1024 ** 3,
  },
  first_seen_at: "2026-09-01T10:00:00Z",
  last_seen_at: "2026-09-06T10:00:00Z",
  specification: null,
  technical_summary: "1 vCPU · 2 GiB / task",
};

describe("ResourceDetailView", () => {
  it("labels the resource geography as Region and exposes nested provider details", () => {
    render(
      <ResourceDetailView
        resource={resource}
        connectionName="Production AWS"
        backHref="/dashboard/resources"
        initialMetrics={{ items: [], total: 0 }}
      />,
    );

    expect(screen.queryByText("Location")).toBeNull();
    expect(screen.getAllByText("Region")).toHaveLength(2);
    expect(screen.getAllByText("eu-west-1")).toHaveLength(2);
    expect(screen.getByText("Provider details")).toBeTruthy();
    expect(screen.getByText("Desired count")).toBeTruthy();
    expect(screen.getByText("CPU architecture")).toBeTruthy();
    expect(screen.getByText("ARM64")).toBeTruthy();
  });
});
