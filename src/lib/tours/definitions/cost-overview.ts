import { sharedTourAnchors } from "../anchors";
import type { TourDefinition } from "../types";
import { costAnchors } from "./cost";

export const COST_OVERVIEW_TOUR_KEY = "cost.overview";

/** Anchors the Cost Overview components set (`data-tour={costOverviewAnchors.x}`). */
export const costOverviewAnchors = {
  views: "cost-overview.views",
  explorerLink: "cost-overview.explorer-link",
  attention: "cost-overview.attention",
  period: "cost-overview.period",
  totals: "cost-overview.totals",
  pacing: "cost-overview.pacing",
  breakdownDimensions: "cost-overview.breakdown-dimensions",
  breakdown: "cost-overview.breakdown",
  drivers: "cost-overview.drivers",
  trajectory: "cost-overview.trajectory",
  netCost: "cost-overview.net-cost",
  topServices: "cost-overview.top-services",
  chargeTypes: "cost-overview.charge-types",
  management: "cost-overview.management",
  quickAccess: "cost-overview.quick-access",
  recentAnomalies: "cost-overview.recent-anomalies",
} as const;

const anchors = costOverviewAnchors;

export const costOverviewTour: TourDefinition = {
  key: COST_OVERVIEW_TOUR_KEY,
  version: 2,
  title: "Cost Overview",
  description: "What every panel of the Cost overview tells you.",
  product: "cost",
  route: "/dashboard/products/cost",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Cost",
      body: "Dilanix turns your cloud bills into spend analytics, budgets and anomaly alerts. This tour goes through every part of the Cost overview and what each one tells you.",
    },
    {
      id: "sections",
      target: sharedTourAnchors.productTabs,
      placement: "bottom",
      title: "Cost sections",
      body: "Overview (this page) summarizes spend. Explorer answers your own questions with grouping and filters. Budgets set limits with email alerts, Allocations split spend between teams, Anomalies lists unusual spikes, Saved Views stores Explorer queries, and Reports sends spend reports on demand or on a schedule.",
    },
    {
      id: "scope",
      target: costAnchors.dataScope,
      placement: "bottom",
      title: "Choose whose spend to see",
      body: "Show every connection, one connection, or one connected account — e.g. only production. Only connections with billing access are listed, and your choice carries over to Explorer and Allocations.",
    },
    {
      id: "views",
      target: anchors.views,
      placement: "bottom",
      title: "Four ways to look at spend",
      body: "Summary is this view. Services and Resources list detailed charges for one connection — choose one in the scope above first. Trends compares spend over time with the period before.",
    },
    {
      id: "explorer-link",
      target: anchors.explorerLink,
      placement: "left",
      title: "Open Explorer",
      body: "When you need your own grouping or filters, this opens Explorer with the same scope.",
    },
    {
      id: "attention",
      target: anchors.attention,
      placement: "bottom",
      title: "Needs attention",
      body: "Budgets that are over or forecast to overrun, and open anomalies, with links straight to them. When nothing needs you, it's a single all-clear line.",
    },
    {
      id: "period",
      target: anchors.period,
      placement: "bottom",
      title: "Pick a period",
      body: "Month to date is the default; 1 day, 3 days, Week and 30 days look back from today, and Custom takes any start and end date. Every panel compares the period with the one just before it, of equal length.",
    },
    {
      id: "totals",
      target: anchors.totals,
      placement: "bottom",
      title: "Spend this period",
      body: "Total spend in each billing currency, after credits and discounts, with the change from the previous period. Green means spend went down.",
    },
    {
      id: "pacing",
      target: anchors.pacing,
      title: "Budget pacing",
      body: "Cumulative spend against an active budget's line, with a dashed projection to the end of the budget period. With several budgets in one currency, the chips switch between them.",
    },
    {
      id: "breakdown-dimensions",
      target: anchors.breakdownDimensions,
      placement: "bottom",
      title: "Choose what to break down by",
      body: "Split spend by Provider, Billing account ID, Service, Region or Resource ID — or choose Tag and enter a tag key such as team.",
    },
    {
      id: "breakdown",
      target: anchors.breakdown,
      title: "Breakdown and drill-down",
      body: "Spend for each value this period and last, with the change and a status: New, Up, Down, Flat or Gone. Click a row to drill in — e.g. a service, then its regions — and All spend to step back out.",
    },
    {
      id: "drivers",
      target: anchors.drivers,
      title: "Why did spend change?",
      body: "The services that grew or shrank the most against the previous period, with their before and after amounts. New and dropped services are included.",
    },
    {
      id: "trajectory",
      target: anchors.trajectory,
      title: "Trend, forecast and anomalies",
      body: "Cumulative spend for the period, projected to its end from the daily rate so far, with detected anomalies marked on the line.",
    },
    {
      id: "net-cost",
      target: anchors.netCost,
      title: "Net cost breakdown",
      body: "How gross usage, tax, credits and other adjustments add up to net cost — the amount you're actually billed. Where available, it also shows how much your discounts saved against list prices.",
    },
    {
      id: "top-services",
      target: anchors.topServices,
      title: "Top services",
      body: "The services you spent the most on this period, with everything else grouped as Other.",
    },
    {
      id: "charge-types",
      target: anchors.chargeTypes,
      title: "By charge type",
      body: "Usage, purchases, credits, tax and other charge categories behind the totals — the place to look when a total seems low because a credit offsets usage.",
    },
    {
      id: "management",
      target: anchors.management,
      title: "Cost management at a glance",
      body: "Budgeted spend across active budgets, how many budgets have already sent an alert this period, open anomalies, and enabled allocation rules.",
    },
    {
      id: "quick-access",
      target: anchors.quickAccess,
      title: "Quick access",
      body: "Shortcuts to Budgets, Allocations, Anomalies, Saved Views and Reports, each with a count of what's set up.",
    },
    {
      id: "recent-anomalies",
      target: anchors.recentAnomalies,
      title: "Recent anomalies",
      body: "The latest spend anomalies: actual against expected spend, and their status. Dilanix checks every hour, comparing yesterday's spend with a trailing 7-day average.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Replay this tour anytime from Help & Support — the question-mark button at the top of the page.",
    },
  ],
};
