import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreResource } from "@/lib/core/api";
import { ResourcePanel } from "./resource-panel";

vi.mock("@/app/dashboard/integrations/actions", () => ({
  listResourcesAction: vi.fn(),
  listResourceFiltersAction: vi.fn(),
}));

afterEach(cleanup);

const resource: CoreResource = {
  id: "resource-1",
  organization_id: "org-1",
  connection_id: "conn-1",
  target_id: "target-1",
  provider: "aws",
  provider_resource_type: "ec2.instance",
  resource_type: "compute.instance",
  category: "compute",
  external_id: "i-0123456789abcdef0",
  provider_resource_key:
    "arn:aws:ec2:us-east-1:123:instance/i-0123456789abcdef0",
  provider_sku: "t3.medium",
  name: "Production API",
  region: "us-east-1",
  zone: "us-east-1a",
  status: "running",
  lifecycle_status: "active",
  missing_since: null,
  out_of_scope_since: null,
  tags: { Environment: "production" },
  extra: {},
  capacity: {},
  first_seen_at: "2026-09-01T10:00:00Z",
  last_seen_at: "2026-09-06T10:00:00Z",
  specification: null,
  technical_summary: "2 vCPU · 4 GiB",
};

describe("ResourcePanel", () => {
  it("links a resource to its detail page and preserves the list context", () => {
    render(
      <ResourcePanel
        connectionId="conn-1"
        initialResources={[resource]}
        initialTotal={1}
        initialFilterOptions={{
          category_types: [
            { category: "compute", resource_type: "compute.instance" },
          ],
          regions: ["us-east-1"],
        }}
        initialFilters={{
          category: "compute",
          resourceType: "compute.instance",
          region: "us-east-1",
          lifecycleStatus: "active",
        }}
      />,
    );

    const link = screen.getByRole("link", { name: /Production API/i });
    expect(link.getAttribute("href")).toBe(
      "/dashboard/resources/resource-1?connection=conn-1&category=compute&type=compute.instance&region=us-east-1&lifecycle=active&sort=lastSeen&direction=desc",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
