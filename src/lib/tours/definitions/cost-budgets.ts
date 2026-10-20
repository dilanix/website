import type { TourDefinition } from "../types";

export const COST_BUDGETS_TOUR_KEY = "cost.budgets";

/** Anchors the Budgets components set (`data-tour={costBudgetsAnchors.x}`).
 *  Per-budget anchors sit on every budget card; the tour shows the first. */
export const costBudgetsAnchors = {
  create: "cost-budgets.create",
  budget: "cost-budgets.budget",
  status: "cost-budgets.status",
  thresholds: "cost-budgets.thresholds",
  actions: "cost-budgets.actions",
} as const;

const anchors = costBudgetsAnchors;

export const costBudgetsTour: TourDefinition = {
  key: COST_BUDGETS_TOUR_KEY,
  version: 1,
  title: "Cost Budgets",
  description: "Set spend limits and get alerted before they're exceeded.",
  product: "cost",
  route: "/dashboard/products/cost/budgets",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Budgets",
      body: "Set a spend limit for any slice of your cloud and get an email as spend approaches it. This quick tour shows you how.",
    },
    {
      id: "create",
      target: anchors.create,
      placement: "bottom",
      title: "Create a budget",
      body: "Choose an amount and currency, a monthly, quarterly, annual or custom period, alert thresholds and who to email. Add a scope to cover just one account, service or tag.",
    },
    {
      id: "budget",
      target: anchors.budget,
      title: "Your budgets",
      body: "Each card shows a budget's amount and period, whether it's active or paused, its scope and its recipients.",
    },
    {
      id: "status",
      target: anchors.status,
      title: "Spend against the limit",
      body: "Spend so far this period against the limit, with the forecast for the period's end marked on the bar. The badge says whether it's on track, forecast to overrun or over budget.",
    },
    {
      id: "thresholds",
      target: anchors.thresholds,
      title: "Alert thresholds",
      body: "Each threshold emails the recipients once per period, the first time spend crosses it. Highlighted thresholds have already fired this period.",
    },
    {
      id: "actions",
      target: anchors.actions,
      placement: "top",
      title: "Pause, edit or delete",
      body: "Pausing a budget stops its alerts without deleting it; resume it anytime. Edit changes its amount, period, thresholds, recipients or scope.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Dilanix checks active budgets every hour, and they appear on the Cost overview too. Replay this tour anytime from Help & Support.",
    },
  ],
};
