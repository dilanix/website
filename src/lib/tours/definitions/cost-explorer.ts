import type { TourDefinition } from "../types";
import { costAnchors } from "./cost";

export const COST_EXPLORER_TOUR_KEY = "cost.explorer";

/** Anchors the Cost Explorer components set (`data-tour={costExplorerAnchors.x}`). */
export const costExplorerAnchors = {
  dates: "cost-explorer.dates",
  metric: "cost-explorer.metric",
  granularity: "cost-explorer.granularity",
  groupBy: "cost-explorer.group-by",
  tagGroup: "cost-explorer.tag-group",
  filters: "cost-explorer.filters",
  savedViews: "cost-explorer.saved-views",
  run: "cost-explorer.run",
  totals: "cost-explorer.totals",
  chargeTypes: "cost-explorer.charge-types",
  results: "cost-explorer.results",
} as const;

const anchors = costExplorerAnchors;

export const costExplorerTour: TourDefinition = {
  key: COST_EXPLORER_TOUR_KEY,
  version: 2,
  title: "Cost Explorer",
  description: "Build a spend query control by control.",
  product: "cost",
  route: "/dashboard/products/cost/explorer",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Cost Explorer",
      body: "Explorer answers your own questions about spend — “what did each team spend on EC2 last month?”. This tour goes through every control, what it's for, and how to read the results.",
    },
    {
      id: "scope",
      target: costAnchors.dataScope,
      placement: "bottom",
      title: "Choose whose spend to query",
      body: "Query every connection, one connection, or one connected account — e.g. just production. The same choice applies on Overview and Allocations.",
    },
    {
      id: "dates",
      target: anchors.dates,
      placement: "bottom",
      title: "Start and end date",
      body: "The days to include, both ends inclusive — e.g. the 1st of the month to today for month to date, or a full past month to compare.",
    },
    {
      id: "metric",
      target: anchors.metric,
      placement: "bottom",
      title: "Cost measure",
      body: "Effective cost (default) is what you really pay: after discounts, with commitments like Savings Plans spread over the time they cover. Billed cost is what the invoice shows. List cost is public on-demand pricing; contracted cost is your negotiated rate.",
    },
    {
      id: "granularity",
      target: anchors.granularity,
      placement: "bottom",
      title: "Granularity",
      body: "One row per day, week or month. Daily helps you spot a spike; Monthly compares months side by side.",
    },
    {
      id: "group-by",
      target: anchors.groupBy,
      placement: "bottom",
      title: "Group by",
      body: "Click a dimension to split spend by it, and click again to remove it. Combine them — e.g. Service and Region gives spend for each service in each region.",
    },
    {
      id: "tag-group",
      target: anchors.tagGroup,
      placement: "bottom",
      title: "Group by a tag",
      body: "Type a tag key such as team, cost-center or environment and choose Group by tag to split spend by its values. Spend without that tag shows as Unassigned.",
    },
    {
      id: "filters",
      target: anchors.filters,
      placement: "bottom",
      title: "Filters",
      body: "Add condition limits what the query counts: pick a field, how to match (is, is any of, is none of) and the value — e.g. Service is Amazon EC2, or Region is none of us-east-1. Every condition must match.",
    },
    {
      id: "saved-views",
      target: anchors.savedViews,
      placement: "top",
      title: "Saved views",
      body: "A saved view stores a grouping, granularity and filters. Pick one and choose Run view to apply it to the dates above. Manage views is where you create views and share them with your organization.",
    },
    {
      id: "run",
      target: anchors.run,
      placement: "top",
      title: "Run query",
      body: "Applies everything above. Your choices are remembered in this browser, so your last query is waiting next time.",
    },
    {
      id: "totals",
      target: anchors.totals,
      placement: "bottom",
      title: "Totals",
      body: "The query's total in each currency — currencies are never added together — and how many rows it returned.",
    },
    {
      id: "charge-types",
      target: anchors.chargeTypes,
      title: "By charge type",
      body: "Usage, credits, discounts and other charges that net to the totals. A near-zero total usually means a credit is offsetting usage, not that nothing was spent.",
    },
    {
      id: "results",
      target: anchors.results,
      placement: "bottom",
      title: "Summary or Detailed",
      body: "Summary lists each period and group with a bar for its relative cost. Detailed gives every grouping dimension its own column, plus the currency.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Replay this tour anytime from Help & Support — the question-mark button at the top of the page.",
    },
  ],
};
