import type { TourDefinition } from "../types";
import { costAnchors } from "./cost";

export const COST_ALLOCATIONS_TOUR_KEY = "cost.allocations";

/** Anchors the Allocations components set (`data-tour={costAllocationsAnchors.x}`).
 *  Per-rule anchors sit on every rule row; the tour shows the first. */
export const costAllocationsAnchors = {
  controls: "cost-allocations.controls",
  run: "cost-allocations.run",
  coverage: "cost-allocations.coverage",
  breakdown: "cost-allocations.breakdown",
  create: "cost-allocations.create",
  formName: "cost-allocations.form-name",
  formTarget: "cost-allocations.form-target",
  formPriority: "cost-allocations.form-priority",
  formScope: "cost-allocations.form-scope",
  formSubmit: "cost-allocations.form-submit",
  rule: "cost-allocations.rule",
  ruleActions: "cost-allocations.rule-actions",
} as const;

/** Actions the Allocations page registers for this tour (`usePageTour`). */
export const costAllocationsActions = {
  /** Opens an empty Create allocation form; its cleanup closes it unsaved. */
  openForm: "open-allocation-form",
} as const;

const anchors = costAllocationsAnchors;
const inForm = costAllocationsActions.openForm;

export const costAllocationsTour: TourDefinition = {
  key: COST_ALLOCATIONS_TOUR_KEY,
  version: 2,
  title: "Cost Allocations",
  description: "Split spend between teams with rules, step by step.",
  product: "cost",
  route: "/dashboard/products/cost/allocations",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Allocations",
      body: "Allocations split your cloud bill between teams, cost centers or business units — for showback or chargeback — using rules you define. This tour shows how to read the split and how to create a rule, field by field.",
    },
    {
      id: "scope",
      target: costAnchors.dataScope,
      placement: "bottom",
      title: "Choose whose spend to split",
      body: "The breakdown covers every connection, one connection, or one connected account — the same choice as on Overview and Explorer. Rules themselves apply everywhere.",
    },
    {
      id: "controls",
      target: anchors.controls,
      placement: "bottom",
      title: "Period and cost measure",
      body: "Pick the dates to split and the cost measure: effective cost (after discounts, with commitments spread over the time they cover) is the default; billed, list or contracted cost are there too.",
    },
    {
      id: "run",
      target: anchors.run,
      placement: "bottom",
      title: "Run breakdown",
      body: "Recalculates the split for your choices. Rules are applied when the breakdown runs, so a new or changed rule re-splits past periods as well.",
    },
    {
      id: "coverage",
      target: anchors.coverage,
      placement: "bottom",
      title: "How much is allocated",
      body: "The period's total, and how much of it your rules claim, in each currency. Aim for 100%: spend that no rule matches stays Unallocated.",
    },
    {
      id: "breakdown",
      target: anchors.breakdown,
      title: "Spend by target",
      body: "Each target — team, cost center or business unit — with its amount and share of the total. The Unallocated row, flagged Needs allocation, is the spend you still need a rule for.",
    },
    {
      id: "create",
      target: anchors.create,
      placement: "bottom",
      title: "Create an allocation rule",
      body: "A rule says which spend belongs to whom. Let's open the form and go through each field. Nothing is saved during the tour.",
    },
    {
      id: "form-name",
      target: anchors.formName,
      prepare: inForm,
      placement: "right",
      title: "Name",
      body: "A name for the rule itself, so you can tell rules apart — e.g. “Platform — team tag”.",
    },
    {
      id: "form-target",
      target: anchors.formTarget,
      prepare: inForm,
      placement: "right",
      title: "Target label",
      body: "Who the matched spend is allocated to: a team, cost center or business unit — e.g. Platform team. Several rules can share a label; their spend adds up under it in the breakdown.",
    },
    {
      id: "form-priority",
      target: anchors.formPriority,
      prepare: inForm,
      placement: "right",
      title: "Priority",
      body: "When a charge matches more than one rule, the lowest number wins, so each charge is counted once. Give specific rules low numbers (e.g. 10) and broad catch-all rules high ones (e.g. 100).",
    },
    {
      id: "form-scope",
      target: anchors.formScope,
      prepare: inForm,
      placement: "right",
      title: "Scope: which spend the rule claims",
      body: "Add condition picks the charges: a field (Tag, Billing account ID, Service…), how to match (is, is any of, is none of) and the value — e.g. Tag team is platform. A charge must match every condition. An empty scope claims everything left over.",
    },
    {
      id: "form-submit",
      target: anchors.formSubmit,
      prepare: inForm,
      placement: "top",
      title: "Save it",
      body: "Create allocation saves the rule and re-runs the breakdown. We'll close this form unsaved and look at the rule list.",
    },
    {
      id: "rule",
      target: anchors.rule,
      title: "How rules match",
      body: "Rules are listed by priority and applied top to bottom: the first enabled rule whose scope matches a charge claims it. Each row shows the rule's target label and scope.",
    },
    {
      id: "rule-actions",
      target: anchors.ruleActions,
      placement: "left",
      title: "Disable, edit or delete",
      body: "Disable takes a rule out of the breakdown without deleting it — its spend falls to the next matching rule or stays Unallocated. Edit opens the same form; Delete removes the rule for good.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Enabled rules are counted on the Cost overview too. Replay this tour anytime from Help & Support.",
    },
  ],
};
