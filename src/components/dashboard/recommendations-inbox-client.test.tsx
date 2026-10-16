import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreUnifiedRecommendation } from "@/lib/core/api";
import { RecommendationsInboxClient } from "./recommendations-inbox-client";

vi.mock("@/app/dashboard/recommendations/actions", () => ({
  getRecommendationAction: vi.fn(),
  listAllRecommendationsAction: vi.fn(),
}));
vi.mock("@/app/dashboard/products/cost-actions", () => ({
  answerRecommendationReviewAction: vi.fn(),
  dismissRecommendationAction: vi.fn(),
  getRecommendationFixGuideAction: vi.fn(),
  getRecommendationReviewAction: vi.fn(),
  requestRecommendationReviewAction: vi.fn(),
  restoreRecommendationAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function recommendation(
  id: string,
  title: string,
  overrides: Partial<CoreUnifiedRecommendation> = {},
): CoreUnifiedRecommendation {
  return {
    id,
    product_key: "cost",
    analyzer_key: "cost.aws.ec2.idle",
    analyzer_version: "1",
    recommendation_type: "idle_instance",
    status: "active",
    title,
    summary: `${title} summary`,
    priority: "high",
    confidence: null,
    evidence_valid_until: null,
    first_detected_at: "2026-10-01T00:00:00Z",
    last_detected_at: "2026-10-16T00:00:00Z",
    dismissed_at: null,
    resolved_at: null,
    targets: [],
    evidence: [],
    impacts: [
      {
        impact_type: "cost_savings",
        amount: "42.5",
        currency: "USD",
        period: "month",
        estimated: true,
        calculation_method: "m",
        calculation_version: "1",
      },
    ],
    ai_review: {
      outcome: "completed",
      summary: `${title} reviewed`,
      reasoning: null,
      detected_issue: null,
      evidence_summary: [],
      confidence: null,
      evidence_quality: null,
      risk_level: "low",
      risk_notes: [],
      open_questions: [],
      questions: [],
      options: [
        {
          title: `Fix ${title}`,
          description: "Do it.",
          pros: [],
          cons: [],
          risk_level: "low",
          is_preferred: true,
          action_type: "stop",
          expected_monthly_savings: "42.5",
          prerequisites: [],
          validation_steps: [],
          rollback: [],
        },
      ],
      facts: [],
      analysis_rounds: 1,
      critic_rounds: 0,
      tool_calls: 0,
      model: "m",
      reviewed_at: "2026-10-16T00:00:00Z",
    },
    ...overrides,
  } as CoreUnifiedRecommendation;
}

function renderInbox() {
  const items = [
    recommendation("00000000-0000-4000-8000-000000000001", "Idle instance"),
    recommendation("00000000-0000-4000-8000-000000000002", "Idle NAT gateway"),
  ];
  render(
    <RecommendationsInboxClient
      initial={{ items, total: 2, limit: 50, offset: 0 }}
    />,
  );
}

describe("RecommendationsInboxClient", () => {
  it("shows each recommendation collapsed with its savings in the header", () => {
    renderInbox();

    const headers = screen.getAllByRole("button", { expanded: false });
    expect(headers).toHaveLength(2);
    expect(headers[0].textContent).toContain("42.5 USD");
    expect(headers[0].textContent).toContain("per month");
    expect(screen.queryByText("Fix Idle instance")).toBeNull();
  });

  it("opens several recommendations as separate cards", () => {
    renderInbox();

    fireEvent.click(screen.getByRole("button", { name: /Idle instance/ }));
    fireEvent.click(screen.getByRole("button", { name: /Idle NAT gateway/ }));

    const instance = screen.getByRole("article", { name: "Idle instance" });
    const nat = screen.getByRole("article", { name: "Idle NAT gateway" });
    expect(instance.textContent).toContain("Fix Idle instance");
    expect(instance.textContent).not.toContain("Fix Idle NAT gateway");
    expect(nat.textContent).toContain("Fix Idle NAT gateway");
    expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(2);
  });

  it("collapses a card again and toggles all at once", () => {
    renderInbox();

    fireEvent.click(screen.getByRole("button", { name: /Idle instance/ }));
    fireEvent.click(screen.getByRole("button", { name: "Collapse" }));
    expect(screen.queryByText("Fix Idle instance")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.queryAllByRole("button", { expanded: true })).toHaveLength(0);
  });
});
