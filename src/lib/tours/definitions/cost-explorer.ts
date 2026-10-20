import type { TourDefinition } from "../types";
import { costAnchors } from "./cost";

export const COST_EXPLORER_TOUR_KEY = "cost.explorer";

/** Anchors the Cost Explorer components set (`data-tour={costExplorerAnchors.x}`). */
export const costExplorerAnchors = {
  query: "cost-explorer.query",
  groupBy: "cost-explorer.group-by",
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
  version: 1,
  title: "Cost Explorer",
  description: "Group, filter and break down spend your own way.",
  product: "cost",
  route: "/dashboard/products/cost/explorer",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Cost Explorer",
      body: "Ask your own questions about spend: choose a period and a cost measure, group and filter it, then run the query. This quick tour shows you how.",
    },
    {
      id: "scope",
      target: costAnchors.dataScope,
      placement: "bottom",
      title: "Choose whose spend to query",
      body: "Explorer queries every connection, one connection, or one connected account — the same choice as on Overview and Allocations.",
    },
    {
      id: "query",
      target: anchors.query,
      placement: "bottom",
      title: "Period, measure and granularity",
      body: "Pick the dates and the cost measure: effective cost (after discounts and commitments) by default, or billed, list or contracted cost. Granularity splits results by day, week or month.",
    },
    {
      id: "group-by",
      target: anchors.groupBy,
      placement: "bottom",
      title: "Group spend",
      body: "Group by one or more dimensions — provider, account, service, region, resource and more — or by a tag key such as team.",
    },
    {
      id: "filters",
      target: anchors.filters,
      placement: "bottom",
      title: "Filter the query",
      body: "Add conditions such as Service is Amazon EC2, or Region is none of a list, to narrow what the query counts. Tags work too.",
    },
    {
      id: "saved-views",
      target: anchors.savedViews,
      placement: "top",
      title: "Saved views",
      body: "Run a saved view's grouping and filters over the dates above, or manage your saved views.",
    },
    {
      id: "run",
      target: anchors.run,
      placement: "top",
      title: "Run the query",
      body: "Results update when you run the query. Your choices are remembered in this browser for next time.",
    },
    {
      id: "totals",
      target: anchors.totals,
      placement: "bottom",
      title: "Query totals",
      body: "The query's total in each currency — amounts in different currencies are never added together — and how many rows it returned.",
    },
    {
      id: "charge-types",
      target: anchors.chargeTypes,
      title: "By charge type",
      body: "Usage, credits, discounts and other charges that net to the totals. A near-zero total usually means a credit is offsetting usage.",
    },
    {
      id: "results",
      target: anchors.results,
      placement: "bottom",
      title: "Summary or Detailed results",
      body: "Summary labels each row with its group and a relative-cost bar; Detailed gives each grouping dimension its own column.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Replay this tour anytime from Help & Support — the question-mark button at the top of the page.",
    },
  ],
};
