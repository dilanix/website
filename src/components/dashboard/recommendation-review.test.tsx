import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getRecommendationReviewAction,
  requestRecommendationReviewAction,
} from "@/app/dashboard/products/cost-actions";
import type {
  CoreRecommendationAIReview,
  CoreRecommendationQuestion,
  CoreRecommendationReview,
} from "@/lib/core/api";
import {
  FinalRecommendation,
  NonActionableResult,
  ReviewProgress,
  ReviewQuestions,
  useRecommendationReview,
  visibleQuestions,
} from "./recommendation-review";

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  answerRecommendationReviewAction: vi.fn(),
  getRecommendationReviewAction: vi.fn(),
  requestRecommendationReviewAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

const IN_USE = ["vpn_gateway", "bastion", "application", "dev_test", "other"];

const questions: CoreRecommendationQuestion[] = [
  {
    fact_key: "resource.purpose",
    prompt: "What is vivox-vpn used for?",
    options: [
      { value: "vpn_gateway", label: "VPN gateway" },
      { value: "no_longer_used", label: "No longer used" },
      { value: "not_sure", label: "I'm not sure" },
    ],
    context:
      "Dilanix detected that vivox-vpn may provide network access, but infrastructure data alone cannot confirm its business role.",
    applies_when: null,
  },
  {
    fact_key: "resource.availability_requirement",
    prompt: "Does it need to remain available continuously?",
    options: [
      { value: "always_on", label: "Yes, 24/7" },
      { value: "business_hours", label: "Business hours only" },
    ],
    context: null,
    applies_when: { "resource.purpose": IN_USE },
  },
];

function review(
  overrides: Partial<CoreRecommendationReview> = {},
): CoreRecommendationReview {
  return {
    id: "review-1",
    recommendation_id: "rec-1",
    trigger: "recheck",
    status: "running",
    activity: "Checking whether this resource provides network access…",
    stages: [
      {
        key: "resource_discovered",
        label: "Resource discovered",
        state: "completed",
      },
      {
        key: "purpose_identified",
        label: "Resource purpose identified",
        state: "current",
      },
      { key: "final_validation", label: "Final validation", state: "pending" },
    ],
    error_code: null,
    created_at: "2026-09-25T10:00:00Z",
    started_at: "2026-09-25T10:00:01Z",
    finished_at: null,
    ...overrides,
  };
}

function guidance(
  overrides: Partial<CoreRecommendationAIReview> = {},
): CoreRecommendationAIReview {
  return {
    outcome: "completed",
    summary: "Stopping the unused instance is safe.",
    reasoning: null,
    detected_issue: "Idle EC2 instance",
    evidence_summary: ["CPU averaged 0.2% over 14 days"],
    confidence: "high",
    evidence_quality: "user_confirmed",
    risk_level: "low",
    risk_notes: ["Any data on instance store volumes is lost"],
    open_questions: [],
    questions: [],
    options: [
      {
        title: "Stop the instance",
        description: "Stop it; keep the EBS volumes.",
        pros: ["Fully reversible"],
        cons: ["EBS storage still billed"],
        risk_level: "low",
        is_preferred: true,
        action_type: "stop",
        expected_monthly_savings: "8.32",
        prerequisites: ["Take an AMI"],
        validation_steps: ["Confirm no alarms fire for 24h"],
        rollback: ["Start the instance again"],
      },
      {
        title: "Terminate after snapshot",
        description: "Snapshot, then terminate.",
        pros: ["Removes all compute cost"],
        cons: ["Irreversible"],
        risk_level: "high",
        is_preferred: false,
        action_type: "terminate",
        expected_monthly_savings: "8.32",
        prerequisites: [],
        validation_steps: [],
        rollback: [],
      },
    ],
    facts: [],
    analysis_rounds: 1,
    critic_rounds: 1,
    tool_calls: 0,
    model: "internal",
    reviewed_at: "2026-09-25T10:01:00Z",
    ...overrides,
  };
}

describe("ReviewProgress", () => {
  it("shows every stage with its state and the current activity", () => {
    render(<ReviewProgress review={review()} />);

    expect(
      screen.getByRole("status", { name: "Analyzing recommendation" }),
    ).toBeTruthy();
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.dataset.state)).toEqual([
      "completed",
      "current",
      "pending",
    ]);
    expect(
      screen.getByText(
        "Checking whether this resource provides network access…",
      ),
    ).toBeTruthy();
  });

  it("shows a waiting message while queued", () => {
    render(
      <ReviewProgress review={review({ status: "queued", activity: null })} />,
    );

    expect(screen.getByText("Waiting for an available analyzer…")).toBeTruthy();
  });

  it("never renders model reasoning or internals", () => {
    const { container } = render(<ReviewProgress review={review()} />);

    expect(container.textContent).not.toMatch(/langgraph|prompt|reasoning/i);
  });
});

describe("ReviewQuestions", () => {
  it("asks the follow-up only after a qualifying answer and submits visible answers", () => {
    const onSubmit = vi.fn();
    render(<ReviewQuestions questions={questions} onSubmit={onSubmit} />);

    expect(screen.getByText(/may provide network access/)).toBeTruthy();
    expect(
      screen.queryByText("Does it need to remain available continuously?"),
    ).toBeNull();
    const submit = screen.getByRole("button", { name: "Continue analysis" });
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "VPN gateway" }));
    expect(
      screen.getByText("Does it need to remain available continuously?"),
    ).toBeTruthy();
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "Yes, 24/7" }));
    expect((submit as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(submit);

    expect(onSubmit).toHaveBeenCalledWith({
      "resource.purpose": "vpn_gateway",
      "resource.availability_requirement": "always_on",
    });
  });

  it("drops irrelevant follow-ups when the resource is no longer used", () => {
    const onSubmit = vi.fn();
    render(<ReviewQuestions questions={questions} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("radio", { name: "VPN gateway" }));
    fireEvent.click(screen.getByRole("radio", { name: "Yes, 24/7" }));
    fireEvent.click(screen.getByRole("radio", { name: "No longer used" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue analysis" }));

    expect(onSubmit).toHaveBeenCalledWith({
      "resource.purpose": "no_longer_used",
    });
  });

  it("preselects the suggested answer and shows what each answer leads to", () => {
    const onSubmit = vi.fn();
    render(
      <ReviewQuestions
        currency="USD"
        onSubmit={onSubmit}
        questions={[
          {
            fact_key: "environment.stage",
            prompt: "What is the demo environment for?",
            context: "Your answers apply to all 37 resources in demo.",
            applies_when: null,
            suggested_value: "demo",
            suggestion_reason: "Its Env tag says 'demo'.",
            options: [
              {
                value: "demo",
                label: "Demos",
                outcome: null,
                monthly_savings: null,
              },
              {
                value: "no_longer_used",
                label: "No longer used",
                outcome: "Remove it, keeping a final snapshot",
                monthly_savings: "480.70",
              },
            ],
          },
        ]}
      />,
    );

    expect(
      screen.getByText("Suggested — Its Env tag says 'demo'."),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Remove it, keeping a final snapshot · saves 480.70 USD / month",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue analysis" }));

    expect(onSubmit).toHaveBeenCalledWith({ "environment.stage": "demo" });
  });

  it("shows a follow-up whose condition was answered earlier", () => {
    expect(
      visibleQuestions([questions[1]], {}).map((question) => question.fact_key),
    ).toEqual(["resource.availability_requirement"]);
  });
});

describe("FinalRecommendation", () => {
  it("separates issue, evidence, recommended action, and alternatives", () => {
    render(<FinalRecommendation review={guidance()} currency="USD" />);

    expect(screen.getByText("Idle EC2 instance")).toBeTruthy();
    expect(screen.getByText("high confidence")).toBeTruthy();
    expect(screen.getByText("Confirmed by you")).toBeTruthy();
    expect(screen.getByText("CPU averaged 0.2% over 14 days")).toBeTruthy();
    const action = screen.getByRole("region", { name: "Recommended action" });
    expect(action.textContent).toContain("Stop the instance");
    expect(action.textContent).toContain("8.32 USD / month");
    expect(action.textContent).toContain("Take an AMI");
    expect(action.textContent).toContain("Confirm no alarms fire for 24h");
    expect(action.textContent).toContain("Start the instance again");
    expect(
      screen.getByText("Any data on instance store volumes is lost"),
    ).toBeTruthy();

    expect(screen.queryByText("Terminate after snapshot")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "1 alternative" }));
    expect(screen.getByText("Terminate after snapshot")).toBeTruthy();
  });
});

describe("NonActionableResult", () => {
  it("renders a concise no-optimization result without savings", () => {
    const rejected = guidance({
      outcome: "rejected",
      summary:
        "This resource appears to provide a continuously available vpn gateway service. Low CPU utilization is expected for this type of workload and does not indicate that the resource is unused.",
      options: [],
    });
    const { container } = render(<NonActionableResult review={rejected} />);

    expect(screen.getByText("No optimization recommended")).toBeTruthy();
    expect(screen.getByText(/continuously available vpn gateway/)).toBeTruthy();
    expect(container.textContent).not.toMatch(/USD|\/ month/);
  });

  it("lists what is missing when evidence is insufficient", () => {
    render(
      <NonActionableResult
        review={guidance({
          outcome: "insufficient_evidence",
          summary: "Dilanix couldn't verify enough.",
          open_questions: ["What is this resource used for?"],
          options: [],
        })}
      />,
    );

    expect(
      screen.getByText("Not enough information for a safe change"),
    ).toBeTruthy();
    expect(screen.getByText("What is this resource used for?")).toBeTruthy();
  });
});

describe("useRecommendationReview", () => {
  it("polls until the review finishes, then hands it off once", async () => {
    vi.useFakeTimers();
    vi.mocked(requestRecommendationReviewAction).mockResolvedValue({
      data: review({ status: "queued" }),
    });
    vi.mocked(getRecommendationReviewAction)
      .mockResolvedValueOnce({ data: review({ status: "running" }) })
      .mockResolvedValueOnce({ data: review({ status: "rejected" }) });
    const onFinished = vi.fn();
    const { result } = renderHook(() =>
      useRecommendationReview({
        recommendationId: "rec-1",
        onFinished,
        pollIntervalMs: 10,
      }),
    );

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.active).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(getRecommendationReviewAction).toHaveBeenCalledTimes(2);
    expect(onFinished).toHaveBeenCalledTimes(1);
    expect(result.current.active).toBe(false);
  });
});
