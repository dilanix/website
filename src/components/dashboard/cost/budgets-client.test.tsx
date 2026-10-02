import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreBudget, CoreBudgetStatus } from "@/lib/core/api";
import { BudgetsClient } from "./budgets-client";

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  createBudgetAction: vi.fn(),
  deleteBudgetAction: vi.fn(),
  listBudgetStatusesAction: vi.fn(),
  updateBudgetAction: vi.fn(),
}));

afterEach(cleanup);

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
});
