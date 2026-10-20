import type { TourDefinition } from "../types";

export const COST_ANOMALIES_TOUR_KEY = "cost.anomalies";

/** Anchors the Anomalies components set (`data-tour={costAnomaliesAnchors.x}`).
 *  Per-anomaly anchors sit on every row; the tour shows the first. */
export const costAnomaliesAnchors = {
  detection: "cost-anomalies.detection",
  filters: "cost-anomalies.filters",
  summary: "cost-anomalies.summary",
  details: "cost-anomalies.details",
  actions: "cost-anomalies.actions",
} as const;

const anchors = costAnomaliesAnchors;

export const costAnomaliesTour: TourDefinition = {
  key: COST_ANOMALIES_TOUR_KEY,
  version: 1,
  title: "Cost Anomalies",
  description: "How spend spikes are detected and how to work through them.",
  product: "cost",
  route: "/dashboard/products/cost/anomalies",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Anomalies",
      body: "Dilanix watches your daily spend and flags days that spike well above normal, so a runaway resource or a misconfiguration doesn't wait for the monthly bill. This tour shows how detection works and how to work through what it finds.",
    },
    {
      id: "detection",
      target: anchors.detection,
      placement: "bottom",
      title: "How detection works",
      body: "Every hour, Dilanix compares yesterday's total spend across your organization with the average of the 7 days before, separately for each currency. A day at least 50% above that average — and at least 1 currency unit above it — becomes an anomaly. Drops in spend are never flagged.",
    },
    {
      id: "filters",
      target: anchors.filters,
      placement: "bottom",
      title: "Filter by status",
      body: "All, or one status:\nOpen — new, nobody has looked at it yet.\nAcknowledged — someone is looking into it.\nResolved — explained or fixed.\nYour choice is remembered in this browser.",
    },
    {
      id: "summary",
      target: anchors.summary,
      placement: "bottom",
      title: "What happened",
      body: "Actual spend that day against the expected 7-day average.\nSeverity — low: 50–99% above average; medium: 100–299%, at least double; high: 300% or more. The icon is red for high and amber for medium.\nStatus — open, acknowledged or resolved.",
    },
    {
      id: "details",
      target: anchors.details,
      placement: "bottom",
      title: "When and how much",
      body: "The day the spike happened, how far above the average it was, and when Dilanix detected it. Scope reads All spend: detection covers your whole organization.",
    },
    {
      id: "actions",
      target: anchors.actions,
      placement: "left",
      title: "Acknowledge or resolve",
      body: "Acknowledge tells your team someone is on it. Resolve closes the anomaly once it's explained or fixed. Resolved is final — if spend spikes again, a new anomaly appears.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Open anomalies also show on the Cost overview: in the Needs attention strip, on the spend trajectory chart and under Recent anomalies. Replay this tour anytime from Help & Support.",
    },
  ],
};
