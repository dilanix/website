import type { TourDefinition } from "../types";
import { costAnchors } from "./cost";

export const COST_ALLOCATIONS_TOUR_KEY = "cost.allocations";

/** Anchors the Allocations components set (`data-tour={costAllocationsAnchors.x}`).
 *  Per-rule anchors sit on every rule row; the tour shows the first. */
export const costAllocationsAnchors = {
  controls: "cost-allocations.controls",
  coverage: "cost-allocations.coverage",
  breakdown: "cost-allocations.breakdown",
  create: "cost-allocations.create",
  rule: "cost-allocations.rule",
  ruleActions: "cost-allocations.rule-actions",
} as const;

const anchors = costAllocationsAnchors;

export const costAllocationsTour: TourDefinition = {
  key: COST_ALLOCATIONS_TOUR_KEY,
  version: 1,
  title: "Cost Allocations",
  description: "Attribute spend to teams, cost centers and business units.",
  product: "cost",
  route: "/dashboard/products/cost/allocations",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Allocations",
      body: "Attribute spend to teams, cost centers or business units for showback and chargeback. This quick tour shows you how.",
    },
    {
      id: "scope",
      target: costAnchors.dataScope,
      placement: "bottom",
      title: "Choose whose spend to allocate",
      body: "The breakdown covers every connection, one connection, or one connected account — the same choice as on Overview and Explorer.",
    },
    {
      id: "controls",
      target: anchors.controls,
      placement: "bottom",
      title: "Period and measure",
      body: "Choose the dates and the cost measure, then run the breakdown to see how your rules split that spend.",
    },
    {
      id: "coverage",
      target: anchors.coverage,
      placement: "bottom",
      title: "How much is allocated",
      body: "The period's total and how much of it your rules allocate, in each currency. Spend no rule matches stays Unallocated.",
    },
    {
      id: "breakdown",
      target: anchors.breakdown,
      title: "Spend by target",
      body: "Each team, cost center or business unit with its amount and share. Unallocated spend is flagged so you can see what still needs a rule.",
    },
    {
      id: "create",
      target: anchors.create,
      placement: "bottom",
      title: "Create an allocation rule",
      body: "Give a rule a name, a target label such as a team or cost center, a priority, and a scope that says which spend it claims — a tag, an account or a service, for example.",
    },
    {
      id: "rule",
      target: anchors.rule,
      title: "How rules match",
      body: "Rules apply in priority order, lowest number first. The first enabled rule whose scope matches a charge claims it, so each charge is counted once.",
    },
    {
      id: "rule-actions",
      target: anchors.ruleActions,
      placement: "left",
      title: "Disable, edit or delete",
      body: "Disabling a rule takes it out of the breakdown without deleting it; its spend goes to the next matching rule, or stays Unallocated.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Replay this tour anytime from Help & Support — the question-mark button at the top of the page.",
    },
  ],
};
