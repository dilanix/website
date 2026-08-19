import { beforeEach, describe, expect, it, vi } from "vitest";
import { coreRequest } from "@/lib/core/api";
import {
  createIntegration,
  deleteIntegration,
  getOverview,
  getResourceFilterOptions,
  getSnapshot,
  listResources,
  queryCostSeries,
  queryCosts,
  verifyIntegration,
} from "./costops-api";

vi.mock("@/lib/core/api", () => ({ coreRequest: vi.fn() }));
const request = vi.mocked(coreRequest);

describe("CostOps API mapping", () => {
  beforeEach(() => request.mockReset());

  it("maps an empty organization without inventing financial data", async () => {
    request
      .mockResolvedValueOnce([
        {
          slug: "aws",
          name: "Amazon Web Services",
          description: "AWS billing data",
          logo_url: null,
          is_available: true,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        current_period_total: "0.000000",
        previous_period_total: "0.000000",
        change_percentage: null,
        connected_integrations: 0,
        total_integrations: 0,
        last_synced_at: null,
        top_services: [],
        daily_spend: [],
      });
    const snapshot = await getSnapshot("org-1", "token");
    expect(snapshot.integrations).toEqual([]);
    expect(snapshot.providers).toEqual([
      {
        slug: "aws",
        name: "Amazon Web Services",
        description: "AWS billing data",
        logoUrl: null,
        isAvailable: true,
      },
    ]);
    expect(snapshot.costs).toEqual([]);
    expect(snapshot.costSeries).toEqual([]);
    expect(request).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/costs\?start_date=\d{4}-\d{2}-\d{2}&end_date=\d{4}-\d{2}-\d{2}$/,
      ),
      "token",
    );
    expect(snapshot.overview.currentTotal).toEqual({
      amount: "0.000000",
      currency: null,
    });
  });

  it("preserves decimal strings and currency from Core cost records", async () => {
    request.mockResolvedValue([
      {
        id: "cost-1",
        integration_id: "int-1",
        cloud_account_id: "acct-1",
        provider: "aws",
        date: "2026-08-18",
        service: "Amazon EC2",
        region: "us-east-1",
        usage_type: "BoxUsage",
        amount: "12.340000",
        currency: "USD",
      },
    ]);
    const costs = await queryCosts("org-1", "token", {
      service_name: "Amazon EC2",
    });
    expect(costs[0]?.amount).toBe("12.340000");
    expect(costs[0]?.currency).toBe("USD");
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining("service_name=Amazon+EC2"),
      "token",
    );
  });

  it("maps the one-click CloudFormation setup returned by Core", async () => {
    request.mockResolvedValue({
      id: "int-1",
      provider: "aws",
      name: "Production",
      status: "pending",
      external_account_id: null,
      external_account_name: null,
      role_arn: null,
      last_synced_at: null,
      last_sync_status: null,
      last_error_code: null,
      last_error_message: null,
      created_at: "2026-08-18T12:00:00Z",
      setup: {
        cloudformation_supported: true,
        cloudformation_url: "https://console.aws.amazon.com/cloudformation",
        external_id: "dilanix-secret",
        role_name: "DilanixCostOpsRole",
        stack_name: "DilanixCostOps",
      },
    });

    const integration = await createIntegration("org-1", "Production", "token");

    expect(integration.setup).toEqual({
      cloudformationSupported: true,
      cloudformationUrl: "https://console.aws.amazon.com/cloudformation",
      externalId: "dilanix-secret",
      roleName: "DilanixCostOpsRole",
      stackName: "DilanixCostOps",
    });
  });

  it("verifies with only the 12-digit AWS account ID", async () => {
    request
      .mockResolvedValueOnce({
        id: "int-1",
        provider: "aws",
        name: "Production",
        status: "connected",
        external_account_id: "123456789012",
        external_account_name: null,
        role_arn: "arn:aws:iam::123456789012:role/DilanixCostOpsRole",
        last_synced_at: null,
        last_sync_status: "pending",
        last_error_code: null,
        last_error_message: null,
        created_at: "2026-08-18T12:00:00Z",
      })
      .mockResolvedValueOnce([]);

    await verifyIntegration("org-1", "int-1", "123456789012", "token");

    expect(request).toHaveBeenNthCalledWith(
      1,
      "/v1/organizations/org-1/costops/integrations/int-1/verify",
      "token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ aws_account_id: "123456789012" }),
      }),
    );
  });

  it("passes overview periods and preserves cost-series decimal strings", async () => {
    request
      .mockResolvedValueOnce({
        current_period_total: "10.000000",
        previous_period_total: "8.000000",
        change_percentage: "25.000000",
        connected_integrations: 1,
        total_integrations: 1,
        last_synced_at: null,
        top_services: [],
        daily_spend: [],
      })
      .mockResolvedValueOnce([{ period: "2026-08-01", amount: "12.340000" }]);

    await getOverview("org-1", "token", "USD", "last_7_days");
    const series = await queryCostSeries(
      "org-1",
      "token",
      {
        start_date: "2026-08-01",
        end_date: "2026-08-19",
        group_by: "week",
      },
      "USD",
    );

    expect(request).toHaveBeenNthCalledWith(
      1,
      "/v1/organizations/org-1/costops/overview?period=last_7_days",
      "token",
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("group_by=week"),
      "token",
    );
    expect(series[0]).toEqual({
      period: "2026-08-01",
      amount: "12.340000",
      currency: "USD",
    });
  });

  it("deletes an integration without a request body", async () => {
    request.mockResolvedValue(undefined);

    await deleteIntegration("org-1", "int-1", "token");

    expect(request).toHaveBeenCalledWith(
      "/v1/organizations/org-1/costops/integrations/int-1",
      "token",
      { method: "DELETE" },
    );
  });

  it("serializes server-side resource filters, sorting, and pagination", async () => {
    request.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      page_size: 25,
      pages: 0,
      summary: {
        total_resources: 0,
        compute_resources: 0,
        storage_resources: 0,
        resources_with_recommendations: 0,
      },
    });
    await listResources("org-1", "token", {
      search: "prod api",
      provider: "aws",
      resourceType: "compute_instance",
      region: "us-east-1",
      state: "running",
      integrationId: "int-1",
      page: 2,
      pageSize: 25,
      sort: "-last_seen_at",
    });
    expect(request).toHaveBeenCalledWith(
      "/v1/organizations/org-1/costops/resources?search=prod+api&provider=aws&resource_type=compute_instance&region=us-east-1&state=running&integration_id=int-1&page=2&page_size=25&sort=-last_seen_at",
      "token",
    );
  });

  it("maps normalized resource data and dynamic filter options", async () => {
    request
      .mockResolvedValueOnce({
        items: [
          {
            id: "r1",
            integration_id: "int-1",
            provider: "aws",
            resource_type: "future_service",
            external_id: "external-1",
            name: null,
            region: "global",
            availability_zone: null,
            state: null,
            resource_class: null,
            configuration: { nested: { enabled: true } },
            tags: { Team: "Platform" },
            first_seen_at: "2026-08-01T00:00:00Z",
            last_seen_at: "2026-08-20T00:00:00Z",
            created_at: "2026-08-01T00:00:00Z",
            updated_at: "2026-08-20T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 25,
        pages: 1,
        summary: {
          total_resources: 1,
          compute_resources: 0,
          storage_resources: 0,
          resources_with_recommendations: 0,
        },
      })
      .mockResolvedValueOnce({
        providers: [{ value: "aws", label: "AWS", count: 1 }],
        resource_types: [
          { value: "future_service", label: "Future service", count: 1 },
        ],
        regions: [{ value: "global", label: "Global", count: 1 }],
        states: [],
      });
    const page = await listResources("org-1", "token");
    const options = await getResourceFilterOptions("org-1", "token");
    expect(page.items[0]).toMatchObject({
      integrationId: "int-1",
      resourceType: "future_service",
      region: "global",
      tags: { Team: "Platform" },
    });
    expect(options.resourceTypes[0]?.value).toBe("future_service");
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/v1/organizations/org-1/costops/resources/filter-options",
      "token",
    );
  });
});
