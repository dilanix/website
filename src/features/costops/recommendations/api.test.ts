import { beforeEach, describe, expect, it, vi } from "vitest";
import { coreRequest } from "@/lib/core/api";
import {
  listRecommendations,
  getRecommendationsSummary,
  updateRecommendationStatus,
  evaluateRecommendations,
} from "./api";

vi.mock("@/lib/core/api", () => ({ coreRequest: vi.fn() }));
const request = vi.mocked(coreRequest);

describe("Recommendations API client", () => {
  beforeEach(() => request.mockReset());

  it("lists recommendations with filters", async () => {
    request.mockResolvedValueOnce([
      {
        id: "rec-1",
        organization_id: "org-1",
        integration_id: "int-1",
        resource_id: "res-1",
        evidence_snapshot_id: "snap-1",
        provider: "aws",
        category: "rightsizing",
        status: "active",
        source: "rule_engine",
        risk_level: "low",
        implementation_effort: "low",
        title: "Downscale oversized EC2",
        description: "Instance underutilized",
        current_configuration: { instance_type: "c5.2xlarge" },
        recommended_configuration: { instance_type: "c5.xlarge" },
        estimated_monthly_savings_usd: 155.0,
        currency: "USD",
        confidence_score: 90,
        action_plan: { cli_command: "aws ec2..." },
        ai_analysis: { reasoning: "Low CPU utilization" },
        created_at: "2026-08-21T00:00:00Z",
        updated_at: "2026-08-21T00:00:00Z",
      },
    ]);

    const res = await listRecommendations("org-1", "token-xyz", {
      status: "active",
      category: "rightsizing",
    });

    expect(request).toHaveBeenCalledWith(
      "/v1/organizations/org-1/costops/recommendations?status=active&category=rightsizing",
      "token-xyz",
    );
    expect(res).toHaveLength(1);
    expect(res[0].estimated_monthly_savings_usd).toBe(155.0);
  });

  it("fetches recommendations summary", async () => {
    request.mockResolvedValueOnce({
      total_potential_monthly_savings_usd: 450.0,
      active_recommendations_count: 3,
      applied_recommendations_count: 1,
      dismissed_recommendations_count: 0,
      savings_by_category: { rightsizing: 450.0 },
      counts_by_category: { rightsizing: 3 },
      top_recommendation: null,
    });

    const res = await getRecommendationsSummary("org-1", "token-xyz");
    expect(request).toHaveBeenCalledWith(
      "/v1/organizations/org-1/costops/recommendations/summary",
      "token-xyz",
    );
    expect(res.total_potential_monthly_savings_usd).toBe(450.0);
    expect(res.active_recommendations_count).toBe(3);
  });

  it("updates recommendation status to applied or dismissed", async () => {
    request.mockResolvedValueOnce({
      id: "rec-1",
      status: "applied",
    });

    await updateRecommendationStatus("org-1", "rec-1", "applied", "token-xyz");

    expect(request).toHaveBeenCalledWith(
      "/v1/organizations/org-1/costops/recommendations/rec-1",
      "token-xyz",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "applied", dismissed_reason: null }),
      },
    );
  });

  it("triggers evaluation", async () => {
    request.mockResolvedValueOnce({
      status: "success",
      evaluated_count: 2,
    });

    const res = await evaluateRecommendations("org-1", "token-xyz");
    expect(request).toHaveBeenCalledWith(
      "/v1/organizations/org-1/costops/recommendations/evaluate",
      "token-xyz",
      { method: "POST" },
    );
    expect(res.evaluated_count).toBe(2);
  });
});
