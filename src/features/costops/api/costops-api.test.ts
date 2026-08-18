import { beforeEach, describe, expect, it, vi } from "vitest";
import { coreRequest } from "@/lib/core/api";
import { getSnapshot, queryCosts } from "./costops-api";

vi.mock("@/lib/core/api", () => ({ coreRequest: vi.fn() }));
const request = vi.mocked(coreRequest);

describe("CostOps API mapping", () => {
  beforeEach(() => request.mockReset());

  it("maps an empty organization without inventing financial data", async () => {
    request
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
    expect(snapshot.costs).toEqual([]);
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
});
