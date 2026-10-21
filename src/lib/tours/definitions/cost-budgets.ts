import type { TourDefinition } from "../types";

export const COST_BUDGETS_TOUR_KEY = "cost.budgets";

/** Anchors the Budgets components set (`data-tour={costBudgetsAnchors.x}`).
 *  Per-budget anchors sit on every budget card; the tour shows the first. */
export const costBudgetsAnchors = {
  create: "cost-budgets.create",
  formName: "cost-budgets.form-name",
  formDescription: "cost-budgets.form-description",
  formAmount: "cost-budgets.form-amount",
  formPeriod: "cost-budgets.form-period",
  formThresholds: "cost-budgets.form-thresholds",
  formRecipients: "cost-budgets.form-recipients",
  formScope: "cost-budgets.form-scope",
  formSubmit: "cost-budgets.form-submit",
  budget: "cost-budgets.budget",
  status: "cost-budgets.status",
  thresholds: "cost-budgets.thresholds",
  actions: "cost-budgets.actions",
} as const;

/** Actions the Budgets page registers for this tour (`usePageTour`). */
export const costBudgetsActions = {
  /** Opens an empty Create budget form; its cleanup closes it unsaved. */
  openForm: "open-budget-form",
} as const;

const anchors = costBudgetsAnchors;
const inForm = costBudgetsActions.openForm;

export const costBudgetsTour: TourDefinition = {
  key: COST_BUDGETS_TOUR_KEY,
  version: 2,
  title: "Cost Budgets",
  description: "Create a budget step by step and read its status.",
  product: "cost",
  route: "/dashboard/products/cost/budgets",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Budgets",
      body: "A budget is a spend limit for your whole cloud or one slice of it — an account, a service, a team's tagged resources. Dilanix tracks spend against it and emails you as it gets close. This tour shows how to create one, field by field, and how to read it.",
    },
    {
      id: "create",
      target: anchors.create,
      placement: "bottom",
      title: "Create a budget",
      body: "Every budget starts here. Let's open the form and go through what each field is for. Nothing is saved during the tour.",
    },
    {
      id: "form-name",
      target: anchors.formName,
      prepare: inForm,
      placement: "right",
      title: "Name",
      body: "Say what the budget covers, so alerts are clear at a glance — e.g. “Production AWS — monthly”. The name appears in every alert email.",
    },
    {
      id: "form-description",
      target: anchors.formDescription,
      prepare: inForm,
      placement: "right",
      title: "Description (optional)",
      body: "Notes for your team: who owns this budget, why the limit is what it is, and what to do when it alerts.",
    },
    {
      id: "form-amount",
      target: anchors.formAmount,
      prepare: inForm,
      placement: "right",
      title: "Amount and currency",
      body: "The limit for one period, e.g. 10000 USD. Use the currency your cloud bills you in: spend in any other currency is pointed out but never counted against this budget.",
    },
    {
      id: "form-period",
      target: anchors.formPeriod,
      prepare: inForm,
      placement: "right",
      title: "Period",
      body: "Monthly, Quarterly and Annual follow the calendar (UTC) and restart on their own — a monthly budget created on the 20th still covers the whole month. Custom range covers fixed start and end dates, such as a project or a fiscal year.",
    },
    {
      id: "form-thresholds",
      target: anchors.formThresholds,
      prepare: inForm,
      placement: "right",
      title: "Alert thresholds",
      body: "Percentages of the amount that send an email. With 50, 80, 100 on a 10000 USD budget, alerts go out at 5000, 8000 and 10000 USD. Each one fires once per period and resets when the next period starts — add 120 to hear about an overrun too.",
    },
    {
      id: "form-recipients",
      target: anchors.formRecipients,
      prepare: inForm,
      placement: "right",
      title: "Recipients",
      body: "The email addresses that get the alerts, separated by commas or new lines — e.g. finance@company.com and the owning team's list. With no recipients, the budget is still tracked but no email is sent.",
    },
    {
      id: "form-scope",
      target: anchors.formScope,
      prepare: inForm,
      placement: "right",
      title: "Scope: what the budget counts",
      body: "Empty means all of your spend. Add condition narrows it: pick a field (Provider, Billing account ID, Service, Region, Tag…), how to match (is, is any of, is none of) and the value — e.g. Tag environment is production. A charge must match every condition to count.",
    },
    {
      id: "form-submit",
      target: anchors.formSubmit,
      prepare: inForm,
      placement: "top",
      title: "Save it",
      body: "Create budget saves it. Its spend shows right away, and Dilanix checks its thresholds every hour. We'll close this form unsaved and look at a budget's card.",
    },
    {
      id: "budget",
      target: anchors.budget,
      title: "A budget's card",
      body: "Each card shows the limit and period, whether the budget is Active or Paused, its scope, and how many recipients get its alerts.",
    },
    {
      id: "status",
      target: anchors.status,
      title: "Spend against the limit",
      body: "The bar is spend so far this period, the thin line is the limit and the amber marker is the forecast for the period's end. The badge reads On track, Forecast to overrun or Over budget.",
    },
    {
      id: "thresholds",
      target: anchors.thresholds,
      title: "Which alerts have fired",
      body: "One chip per threshold. Amber chips with a bell have already sent their email this period; the rest are still waiting.",
    },
    {
      id: "actions",
      target: anchors.actions,
      placement: "top",
      title: "Pause, edit or delete",
      body: "Pause stops a budget's alerts without losing it, and Resume picks it up again. Edit opens the same form you just saw. Delete removes the budget for good.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Active budgets also show on the Cost overview, with pacing charts and the Needs attention strip. Replay this tour anytime from Help & Support.",
    },
  ],
};
