import { sharedTourAnchors } from "../anchors";
import type { TourDefinition } from "../types";
import { costAnchors } from "./cost";

export const COST_OVERVIEW_TOUR_KEY = "cost.overview";

/** Anchors the Cost Overview components set (`data-tour={costOverviewAnchors.x}`). */
export const costOverviewAnchors = {
  views: "cost-overview.views",
  period: "cost-overview.period",
  totals: "cost-overview.totals",
  pacing: "cost-overview.pacing",
  breakdown: "cost-overview.breakdown",
  drivers: "cost-overview.drivers",
  trajectory: "cost-overview.trajectory",
  management: "cost-overview.management",
} as const;

const anchors = costOverviewAnchors;

export const costOverviewTour: TourDefinition = {
  key: COST_OVERVIEW_TOUR_KEY,
  version: 1,
  title: "Cost Overview",
  description: "Track spend, budgets and anomalies across your cloud accounts.",
  product: "cost",
  route: "/dashboard/products/cost",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Cost",
      body: "Dilanix turns your cloud billing data into spend analytics, budgets and anomaly alerts. This quick tour shows you around the Cost overview.",
    },
    {
      id: "sections",
      target: sharedTourAnchors.productTabs,
      placement: "bottom",
      title: "Cost sections",
      body: "Overview is this page. Explorer answers ad-hoc questions about spend, and Budgets, Allocations, Anomalies, Saved Views and Reports help you track, attribute and share it.",
    },
    {
      id: "scope",
      target: costAnchors.dataScope,
      placement: "bottom",
      title: "Choose whose spend to see",
      body: "Show every connection, one connection, or one connected account. Only connections with billing access are listed, and your choice carries over to Explorer and Allocations.",
    },
    {
      id: "views",
      target: anchors.views,
      placement: "bottom",
      title: "Four ways to look at spend",
      body: "Summary is the at-a-glance view. Services and Resources list detailed charges for one connection, and Trends compares spend over time with the period before.",
    },
    {
      id: "period",
      target: anchors.period,
      placement: "bottom",
      title: "Pick a period",
      body: "Month to date is the default. Choose a preset or a custom range — the panels below compare it with the preceding period of equal length.",
    },
    {
      id: "totals",
      target: anchors.totals,
      placement: "bottom",
      title: "Spend this period",
      body: "Your total for the period in each billing currency, including credits and discounts, with the change from the previous period.",
    },
    {
      id: "pacing",
      target: anchors.pacing,
      title: "Budget pacing",
      body: "How spend is tracking against each active budget, projected to the end of the budget period.",
    },
    {
      id: "breakdown",
      target: anchors.breakdown,
      title: "Break down and drill in",
      body: "See how spend splits by provider, account, service, region, resource or tag, and what changed. Click a row to drill down a level.",
    },
    {
      id: "drivers",
      target: anchors.drivers,
      title: "Why did spend change?",
      body: "The services whose spend rose or fell the most compared with the previous period.",
    },
    {
      id: "trajectory",
      target: anchors.trajectory,
      title: "Trend, forecast and anomalies",
      body: "Cumulative spend for the period, projected to its end from the daily rate so far, with detected anomalies marked on the line.",
    },
    {
      id: "management",
      target: anchors.management,
      title: "Cost management at a glance",
      body: "Budgeted spend, budgets at risk, open anomalies and enabled allocations. Quick access below takes you straight to each.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Replay this tour anytime from Help & Support — the question-mark button at the top of the page.",
    },
  ],
};
