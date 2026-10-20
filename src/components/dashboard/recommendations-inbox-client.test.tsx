import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreUnifiedRecommendation } from "@/lib/core/api";
import { tourTargetSelector } from "@/lib/tours/anchors";
import {
  RECOMMENDATIONS_TOUR_KEY,
  recommendationsActions,
  recommendationsAnchors,
} from "@/lib/tours/definitions/recommendations";
import { RecommendationsInboxClient } from "./recommendations-inbox-client";

const { usePageTour } = vi.hoisted(() => ({ usePageTour: vi.fn() }));
vi.mock("@/components/tours/tour-provider", () => ({ usePageTour }));

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
  it("lists recommendations as collapsed rows with resource, savings and status", () => {
    renderInbox();

    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(2);
    const row = screen.getByRole("article", { name: "Idle instance" });
    expect(row.textContent).toContain("42.5 USD");
    expect(row.textContent).toContain("per month");
    expect(row.textContent).toContain("Ready to fix");
    expect(screen.queryByText("Fix Idle instance")).toBeNull();
  });

  it("opens several rows, each with its own content", () => {
    renderInbox();

    fireEvent.click(screen.getByRole("button", { name: /^Idle instance/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Details" })[0]);

    const instance = screen.getByRole("article", { name: "Idle instance" });
    const nat = screen.getByRole("article", { name: "Idle NAT gateway" });
    expect(instance.textContent).toContain("Fix Idle instance");
    expect(instance.textContent).toContain("Before you continue");
    expect(instance.textContent).not.toContain("Fix Idle NAT gateway");
    expect(nat.textContent).toContain("Fix Idle NAT gateway");
    expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(2);
  });

  it("closes a row from its Close action and offers row actions in a menu", () => {
    renderInbox();

    fireEvent.click(screen.getByRole("button", { name: /^Idle instance/ }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("Fix Idle instance")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "More actions for Idle instance" }),
    );
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Re-check", "Dismiss"]);
  });
});

describe("RecommendationsInboxClient ranking", () => {
  it("lists ranked recommendations best first, the top ten until asked for all", () => {
    const items = Array.from({ length: 12 }, (_, index) =>
      recommendation(
        `00000000-0000-4000-8000-0000000001${String(index).padStart(2, "0")}`,
        `Finding ${index + 1}`,
        { rank: 12 - index },
      ),
    );
    render(
      <RecommendationsInboxClient
        initial={{ items, total: 12, limit: 50, offset: 0 }}
      />,
    );

    const rows = screen.getAllByRole("article");
    expect(rows).toHaveLength(10);
    expect(rows[0].getAttribute("aria-label")).toBe("Finding 12");
    expect(screen.getByLabelText("Rank 1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show all" }));
    expect(screen.getAllByRole("article")).toHaveLength(12);
  });

  it("says which recommendation covers a superseded one", () => {
    const environment = recommendation(
      "00000000-0000-4000-8000-000000000201",
      "Environment dev",
      { rank: 1 },
    );
    const member = recommendation(
      "00000000-0000-4000-8000-000000000202",
      "Idle instance",
      { superseded_by_id: environment.id },
    );
    render(
      <RecommendationsInboxClient
        initial={{
          items: [environment, member],
          total: 2,
          limit: 50,
          offset: 0,
        }}
      />,
    );

    expect(
      screen.getByRole("article", { name: "Idle instance" }).textContent,
    ).toContain("covered by #1 Environment dev");
  });
});

describe("RecommendationsInboxClient product tour", () => {
  const offer = () => usePageTour.mock.calls.at(-1);
  const anchored = (name: keyof typeof recommendationsAnchors) =>
    document.querySelectorAll(tourTargetSelector(recommendationsAnchors[name]));
  const run = (action: string) => {
    let cleanup: (() => void) | false | void = undefined;
    act(() => {
      cleanup = offer()?.[1].actions[action]();
    });
    return cleanup as (() => void) | false | void;
  };

  const question = {
    fact_key: "resource.purpose",
    prompt: "What is this instance for?",
    context: null,
    applies_when: null,
    suggested_value: "vpn",
    suggestion_reason: "its name mentions a VPN",
    options: [
      { value: "vpn", label: "VPN", outcome: "Kept", monthly_savings: null },
      {
        value: "unused",
        label: "No longer used",
        outcome: "Stop it",
        monthly_savings: "42.5",
      },
    ],
  };
  function needsInput(id: string, title: string) {
    const base = recommendation(id, title);
    return recommendation(id, title, {
      ai_review: {
        ...base.ai_review!,
        outcome: "needs_input",
        questions: [question],
      } as CoreUnifiedRecommendation["ai_review"],
    });
  }

  it("is offered with any list, with the controls and every row anchored", () => {
    renderInbox();
    expect(offer()?.[0]).toBe(RECOMMENDATIONS_TOUR_KEY);
    expect(offer()?.[1].ready).toBe(true);
    for (const name of [
      "stats",
      "statusFilter",
      "productFilter",
      "analyzerFilter",
      "showCovered",
      "search",
      "footer",
    ] as const)
      expect(anchored(name)).toHaveLength(1);
    for (const name of ["tags", "savings", "state", "rowActions"] as const)
      expect(anchored(name)).toHaveLength(2);
    // Without a resource, there is nothing to point the resource step at.
    expect(anchored("resource")).toHaveLength(0);
  });

  it("opens the first ready-to-fix recommendation for its detail steps, and closes it again", () => {
    const items = [
      needsInput("00000000-0000-4000-8000-000000000301", "Quiet instance"),
      recommendation("00000000-0000-4000-8000-000000000302", "Idle volume", {
        evidence: [
          {
            evidence_key: "resource_identity",
            value: {
              external_id: "vol-0abc",
              provider_resource_type: "ec2.volume",
              region: "eu-central-1",
            },
            source_type: "inventory",
            source_ref: null,
            observed_at: "2026-10-16T00:00:00Z",
          },
        ],
      }),
    ];
    render(
      <RecommendationsInboxClient
        initial={{ items, total: 2, limit: 50, offset: 0 }}
      />,
    );
    expect(anchored("whyThisMatters")).toHaveLength(0);

    expect(anchored("resource")).toHaveLength(1);

    const close = run(recommendationsActions.openReady);
    const volume = screen.getByRole("article", { name: "Idle volume" });
    expect(volume.querySelector("[id^=row-]")).toBeTruthy();
    for (const name of [
      "whyThisMatters",
      "recommendedAction",
      "rawEvidence",
      "beforeYouContinue",
      "howToFix",
    ] as const) {
      expect(anchored(name)).toHaveLength(1);
      expect(volume.contains(anchored(name)[0])).toBe(true);
    }

    act(() => (close as () => void)());
    expect(anchored("whyThisMatters")).toHaveLength(0);
  });

  it("opens a recommendation waiting for answers for the question steps", () => {
    const items = [
      recommendation("00000000-0000-4000-8000-000000000401", "Idle volume"),
      needsInput("00000000-0000-4000-8000-000000000402", "Quiet instance"),
    ];
    render(
      <RecommendationsInboxClient
        initial={{ items, total: 2, limit: 50, offset: 0 }}
      />,
    );

    const close = run(recommendationsActions.openNeedsInput);
    for (const name of [
      "questions",
      "questionAnswers",
      "continueAnalysis",
    ] as const)
      expect(anchored(name)).toHaveLength(1);
    expect(screen.getByText(/its name mentions a VPN/)).toBeTruthy();

    act(() => (close as () => void)());
    expect(anchored("questions")).toHaveLength(0);
  });

  it("lists every row when the one to open is past the top ten", () => {
    const items = [
      ...Array.from({ length: 10 }, (_, index) =>
        recommendation(
          `00000000-0000-4000-8000-0000000005${String(index).padStart(2, "0")}`,
          `Finding ${index + 1}`,
          { rank: index + 1 },
        ),
      ),
      needsInput("00000000-0000-4000-8000-000000000599", "Quiet instance"),
    ];
    render(
      <RecommendationsInboxClient
        initial={{ items, total: 11, limit: 50, offset: 0 }}
      />,
    );
    expect(screen.getAllByRole("article")).toHaveLength(10);

    const close = run(recommendationsActions.openNeedsInput);
    expect(screen.getAllByRole("article")).toHaveLength(11);
    expect(anchored("questions")).toHaveLength(1);

    act(() => (close as () => void)());
    expect(screen.getAllByRole("article")).toHaveLength(10);
  });

  it("skips the detail steps when there is nothing to open", () => {
    render(
      <RecommendationsInboxClient
        initial={{
          items: [
            recommendation("00000000-0000-4000-8000-000000000601", "Old", {
              status: "dismissed",
            }),
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }}
      />,
    );

    expect(run(recommendationsActions.openReady)).toBe(false);
    expect(run(recommendationsActions.openNeedsInput)).toBe(false);
  });
});
