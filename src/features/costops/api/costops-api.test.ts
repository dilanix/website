import { beforeEach, describe, expect, it, vi } from "vitest";
import { coreRequest } from "@/lib/core/api";
import {
  createIntegration,
  deleteIntegration,
  getOverview,
  getSnapshot,
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
});
