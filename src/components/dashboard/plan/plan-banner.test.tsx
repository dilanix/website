import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreOrganizationPlan } from "@/lib/core/api";
import { PlanBanner } from "./plan-banner";
import { PlanPill } from "./plan-pill";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

afterEach(() => {
  cleanup();
  navigation.pathname = "/dashboard";
});

function plan(
  overrides: Partial<CoreOrganizationPlan> = {},
): CoreOrganizationPlan {
  return {
    organization_id: "org-1",
    state: "trial",
    plan: { code: "trial", name: "Free Trial", kind: "trial" },
    starts_at: "2026-10-01T00:00:00Z",
    expires_at: "2026-10-15T00:00:00Z",
    days_remaining: 2,
    addons: [],
    products: [],
    features: [],
    limits: [],
    provider_sync: { allowed: true, code: null, message: null },
    warnings: [],
    ...overrides,
  };
}

describe("PlanBanner", () => {
  it("shows the most severe warning with a way out", () => {
    render(
      <PlanBanner
        plan={plan({
          warnings: [
            {
              code: "trial_ending",
              severity: "warning",
              message: "The trial ends in 2 days.",
            },
            {
              code: "over_limit_blocked",
              severity: "critical",
              message:
                "Connected cloud accounts: 3 of 2 in use. Sync is paused.",
            },
          ],
        })}
      />,
    );

    expect(screen.getByRole("alert").textContent).toContain("Sync is paused");
    expect(
      screen
        .getByRole("link", { name: /Manage accounts/ })
        .getAttribute("href"),
    ).toBe("/dashboard/plan");
  });

  it("stays quiet without warnings and on the plan page itself", () => {
    const { rerender } = render(<PlanBanner plan={plan()} />);
    expect(screen.queryByRole("status")).toBeNull();

    navigation.pathname = "/dashboard/plan";
    rerender(
      <PlanBanner
        plan={plan({
          warnings: [
            {
              code: "trial_expired",
              severity: "critical",
              message: "The trial has ended.",
            },
          ],
        })}
      />,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("PlanPill", () => {
  it("names the trial's remaining days, the plan, or that it ended", () => {
    const { rerender } = render(<PlanPill plan={plan()} />);
    expect(screen.getByText("Trial · 2 days left")).toBeTruthy();

    rerender(
      <PlanPill
        plan={plan({
          state: "active",
          plan: { code: "growth", name: "Growth", kind: "standard" },
        })}
      />,
    );
    expect(screen.getByText("Growth")).toBeTruthy();

    rerender(
      <PlanPill
        plan={plan({ state: "trial_expired", days_remaining: null })}
      />,
    );
    expect(screen.getByText("Trial ended")).toBeTruthy();
  });
});
