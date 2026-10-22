import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreBudget, CoreBudgetStatus } from "@/lib/core/api";
import {
  COST_BUDGETS_TOUR_KEY,
  costBudgetsActions,
  costBudgetsAnchors,
} from "@/lib/tours/definitions/cost-budgets";
import { tourTargetSelector } from "@/lib/tours/anchors";
import { BudgetsClient } from "./budgets-client";

const { usePageTour } = vi.hoisted(() => ({ usePageTour: vi.fn() }));
vi.mock("@/components/tours/tour-provider", () => ({ usePageTour }));

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  createBudgetAction: vi.fn(),
  deleteBudgetAction: vi.fn(),
  listBudgetStatusesAction: vi.fn(),
  updateBudgetAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const budget: CoreBudget = {
  id: "b1",
  organization_id: "o1",
  name: "Monthly",
  description: null,
  amount: "50",
  currency: "USD",
  period: "monthly",
  period_start: null,
  period_end: null,
  alert_thresholds: [50, 100],
  notified_thresholds: [50],
  recipients: [],
  destination_ids: [],
  enabled: true,
  scope: [],
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
} as CoreBudget;

const status: CoreBudgetStatus = {
  budget_id: "b1",
  name: "Monthly",
  enabled: true,
  currency: "USD",
  limit: "50.000000",
  period_start: "2026-08-01T00:00:00Z",
  period_end: "2026-09-01T00:00:00Z",
  period_state: "active",
  spent: "30.00",
  remaining: "20.00",
  usage_percent: 60,
  forecast_amount: "93.00",
  forecast_usage_percent: 186,
  forecasted_overrun: "43.00",
  health: "at_risk",
  crossed_thresholds: [50],
  notified_thresholds: [50],
  source: "cost_usage",
  data_through: "2026-08-11T00:00:00Z",
  other_currencies: ["EUR"],
  evaluated_at: "2026-08-11T15:00:00Z",
};

describe("BudgetsClient", () => {
  it("shows Core's spend, forecast, and health for each budget", () => {
    render(
      <BudgetsClient initialBudgets={[budget]} initialStatuses={[status]} />,
    );

    expect(screen.getByText("Forecast to overrun")).toBeTruthy();
    expect(
      screen.getByText(/forecast 93.00 USD \(overrun 43.00 USD\)/),
    ).toBeTruthy();
    expect(screen.getByText(/Spend in EUR is in this scope/)).toBeTruthy();
  });

  it("still renders budgets without a status", () => {
    render(<BudgetsClient initialBudgets={[budget]} />);

    expect(screen.getByText("Monthly")).toBeTruthy();
    expect(screen.queryByText("Forecast to overrun")).toBeNull();
  });

  it("uses notification destinations instead of free-form email recipients", () => {
    render(<BudgetsClient initialBudgets={[budget]} />);

    fireEvent.click(screen.getByRole("button", { name: "Create budget" }));

    expect(screen.getByText("Notification destinations")).toBeTruthy();
    expect(screen.getByText(/No destinations are configured/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Notifications" })).toBeTruthy();
    expect(
      screen.queryByText(/Recipients \(comma or newline separated\)/),
    ).toBeNull();
  });

  describe("product tour", () => {
    const offer = () => usePageTour.mock.calls.at(-1);
    const anchor = (name: keyof typeof costBudgetsAnchors) =>
      document.querySelector(tourTargetSelector(costBudgetsAnchors[name]));

    it("offers the Budgets tour even before any budget exists", () => {
      render(<BudgetsClient initialBudgets={[]} />);
      expect(offer()?.[0]).toBe(COST_BUDGETS_TOUR_KEY);
      expect(offer()?.[1].ready).toBe(true);
      expect(anchor("create")).not.toBeNull();
    });

    it("is not ready while a budget dialog is open", () => {
      render(<BudgetsClient initialBudgets={[budget]} />);
      fireEvent.click(screen.getByRole("button", { name: "Create budget" }));
      expect(offer()?.[1].ready).toBe(false);

      fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
      expect(offer()?.[1].ready).toBe(true);
    });

    it("opens an empty create form for the tour's form steps, and closes it unsaved", () => {
      render(<BudgetsClient initialBudgets={[budget]} />);
      let close: (() => void) | void = undefined;
      act(() => {
        close = offer()?.[1].actions[costBudgetsActions.openForm]();
      });

      expect(
        screen.getByRole("dialog", { name: "Create budget" }),
      ).toBeTruthy();
      const formAnchors = (
        Object.keys(costBudgetsAnchors) as (keyof typeof costBudgetsAnchors)[]
      ).filter((name) => name.startsWith("form"));
      expect(formAnchors.length).toBeGreaterThan(0);
      for (const name of formAnchors) expect(anchor(name)).not.toBeNull();

      act(() => (close as (() => void) | void)?.());
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("points the thresholds step only at a budget that has thresholds", () => {
      render(
        <BudgetsClient
          initialBudgets={[
            { ...budget, id: "b0", name: "A first", alert_thresholds: [] },
            budget,
          ]}
        />,
      );
      const anchored = document.querySelectorAll(
        tourTargetSelector(costBudgetsAnchors.thresholds),
      );
      expect(anchored).toHaveLength(1);
      expect(anchored[0]?.textContent).toContain("50%");
    });
  });
});
