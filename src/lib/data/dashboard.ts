import type { BillingPlan, DashboardOverview, Invoice, UsageRow } from "@/types";

// Keyed by product slug — only CostOps has dashboard content today, but
// this is the shape that lets each future product bring its own metrics
// instead of forcing everything through one cost-centric template.
const overviewBySlug: Record<string, DashboardOverview> = {
  costops: {
    monthlySpendUsd: 24820,
    potentialSavingsUsd: 4310,
    optimizationScore: 78,
    activeAlerts: 3,
    spendTrend: [
      21200, 21800, 22350, 21950, 23100, 23800, 22950, 24010, 24460, 23990,
      24610, 24280, 24950, 24820,
    ],
    breakdown: [
      { label: "AWS", amountUsd: 14240 },
      { label: "Vertex AI", amountUsd: 5280 },
      { label: "OpenAI", amountUsd: 3710 },
      { label: "Other", amountUsd: 1590 },
    ],
    recommendations: [
      {
        title: "ECS service document-analysis appears overprovisioned.",
        description:
          "Right-sizing based on trailing 30-day utilization would cut spend without affecting throughput.",
        monthlySavingUsd: 640,
        metrics: [
          { label: "Average CPU", value: "18%" },
          { label: "Average memory", value: "31%" },
        ],
      },
      {
        title: "3 idle EBS volumes detached for over 14 days.",
        description:
          "Unattached storage is still billed. Safe to snapshot and delete if no longer needed.",
        monthlySavingUsd: 210,
        metrics: [
          { label: "Volumes", value: "3" },
          { label: "Idle since", value: "14d+" },
        ],
      },
      {
        title:
          "GPT-4 usage on the summarization pipeline could move to a cheaper tier.",
        description:
          "Output quality on sampled requests held steady on a lower-cost model in the last eval run.",
        monthlySavingUsd: 890,
        metrics: [
          { label: "Requests/day", value: "12.4k" },
          { label: "Eval delta", value: "-0.3%" },
        ],
      },
    ],
    activity: [
      {
        id: "1",
        message: "Cost anomaly resolved on Vertex AI (batch-inference).",
        timestamp: "2h ago",
      },
      {
        id: "2",
        message: "New recommendation: right-size document-analysis service.",
        timestamp: "6h ago",
      },
      {
        id: "3",
        message: "Monthly spend crossed $24,000 threshold.",
        timestamp: "1d ago",
      },
      {
        id: "4",
        message: "3 idle EBS volumes flagged for cleanup.",
        timestamp: "2d ago",
      },
    ],
  },
};

const usageBySlug: Record<string, UsageRow[]> = {
  costops: [
    { id: "1", service: "ECS — document-analysis", provider: "AWS", monthlySpendUsd: 5120, trendPct: 4.2 },
    { id: "2", service: "S3 storage", provider: "AWS", monthlySpendUsd: 3480, trendPct: -1.8 },
    { id: "3", service: "RDS — postgres-primary", provider: "AWS", monthlySpendUsd: 2960, trendPct: 0.6 },
    { id: "4", service: "Vertex AI — batch-inference", provider: "Vertex AI", monthlySpendUsd: 3280, trendPct: 12.4 },
    { id: "5", service: "Vertex AI — embeddings", provider: "Vertex AI", monthlySpendUsd: 2000, trendPct: -3.1 },
    { id: "6", service: "GPT-4 — summarization", provider: "OpenAI", monthlySpendUsd: 2410, trendPct: 7.9 },
    { id: "7", service: "GPT-4 — support-assistant", provider: "OpenAI", monthlySpendUsd: 1300, trendPct: -5.4 },
    { id: "8", service: "CloudFront", provider: "AWS", monthlySpendUsd: 980, trendPct: 1.1 },
    { id: "9", service: "Datadog", provider: "Other", monthlySpendUsd: 610, trendPct: 0 },
    { id: "10", service: "PagerDuty", provider: "Other", monthlySpendUsd: 180, trendPct: 0 },
  ],
};

// Billing is account-level, not per-product — one subscription covers
// however many products the org has access to.
const invoices: Invoice[] = [
  { id: "INV-2026-08", date: "2026-08-01", amountUsd: 499, status: "paid" },
  { id: "INV-2026-07", date: "2026-07-01", amountUsd: 499, status: "paid" },
  { id: "INV-2026-06", date: "2026-06-01", amountUsd: 499, status: "paid" },
  { id: "INV-2026-05", date: "2026-05-01", amountUsd: 449, status: "paid" },
];

const plan: BillingPlan = {
  name: "Growth",
  priceUsd: 499,
  interval: "month",
  renewsOn: "2026-09-18",
  seats: 12,
};

// TODO: once this product has a real microservice (`product.apiBaseUrl` set),
// replace with `fetchProductApi(product, "/dashboard/overview", accessToken)`
// — each product's dashboard data comes from that product's own backend,
// not a shared one.
export async function getDashboardOverview(
  slug: string,
): Promise<DashboardOverview | undefined> {
  return overviewBySlug[slug];
}

// TODO: once this product has a real microservice (`product.apiBaseUrl` set),
// replace with `fetchProductApi(product, "/dashboard/usage", accessToken)`.
export async function getUsageBreakdown(
  slug: string,
): Promise<UsageRow[] | undefined> {
  return usageBySlug[slug];
}

// TODO: replace with `fetch(`${env.NEXT_PUBLIC_API_URL}/billing/invoices`)` once the backend ships.
export async function getInvoices(): Promise<Invoice[]> {
  return invoices;
}

// TODO: replace with `fetch(`${env.NEXT_PUBLIC_API_URL}/billing/plan`)` once the backend ships.
export async function getBillingPlan(): Promise<BillingPlan> {
  return plan;
}
