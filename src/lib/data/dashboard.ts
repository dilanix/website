import type {
  BillingPlan,
  DashboardOverview,
  Invoice,
  UsageRow,
} from "@/types";

const overviewBySlug: Record<string, DashboardOverview> = {
  dena: {
    monthlySpendUsd: 14200,
    potentialSavingsUsd: 2800,
    optimizationScore: 84,
    activeAlerts: 1,
    spendTrend: [
      11200, 11800, 12350, 11950, 13100, 13800, 12950, 14010, 14460, 13990,
      14610, 14280, 14950, 14200,
    ],
    breakdown: [
      { label: "Object Storage", amountUsd: 8240 },
      { label: "Block Storage", amountUsd: 3980 },
      { label: "Data Transfer", amountUsd: 1980 },
    ],
    recommendations: [
      {
        title: "Cold archive tiering opportunity",
        description:
          "Auto-tiering objects unread for 30+ days saves substantial storage spend.",
        monthlySavingUsd: 2800,
        metrics: [
          { label: "Cold tier ratio", value: "64%" },
          { label: "Average latency impact", value: "0ms" },
        ],
      },
    ],
    activity: [
      {
        id: "1",
        message: "High-throughput cluster checkpointing verified.",
        timestamp: "2h ago",
      },
      {
        id: "2",
        message: "Storage bucket replication healthy across regions.",
        timestamp: "6h ago",
      },
    ],
  },
  pulse: {
    monthlySpendUsd: 8400,
    potentialSavingsUsd: 1200,
    optimizationScore: 91,
    activeAlerts: 0,
    spendTrend: [
      7200, 7500, 7800, 8100, 8000, 8200, 8300, 8400,
    ],
    breakdown: [
      { label: "Trace Ingestion", amountUsd: 4800 },
      { label: "Metric Storage", amountUsd: 2600 },
      { label: "Alerting", amountUsd: 1000 },
    ],
    recommendations: [
      {
        title: "Adaptive trace sampling enabled",
        description: "Downsample non-error traces during off-peak hours.",
        monthlySavingUsd: 1200,
        metrics: [
          { label: "Sampling efficiency", value: "99.8%" },
        ],
      },
    ],
    activity: [
      {
        id: "1",
        message: "eBPF kernel collector running on 42 nodes.",
        timestamp: "1h ago",
      },
    ],
  },
};

const usageBySlug: Record<string, UsageRow[]> = {
  dena: [
    {
      id: "1",
      service: "Primary Hot Storage Tier",
      provider: "Dena Core",
      monthlySpendUsd: 8240,
      trendPct: 2.1,
    },
    {
      id: "2",
      service: "Block Storage Volumes",
      provider: "Dena Block",
      monthlySpendUsd: 3980,
      trendPct: 1.4,
    },
    {
      id: "3",
      service: "Inter-Region Zero-Egress Transit",
      provider: "Dena Network",
      monthlySpendUsd: 1980,
      trendPct: -0.8,
    },
  ],
  pulse: [
    {
      id: "1",
      service: "Distributed Tracing Collector",
      provider: "Pulse APM",
      monthlySpendUsd: 4800,
      trendPct: 1.2,
    },
    {
      id: "2",
      service: "Time-Series Metric Retention",
      provider: "Pulse Storage",
      monthlySpendUsd: 2600,
      trendPct: 0.5,
    },
  ],
};

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

export async function getDashboardOverview(
  slug: string,
): Promise<DashboardOverview | undefined> {
  return overviewBySlug[slug] ?? overviewBySlug.dena;
}

export async function getUsageBreakdown(
  slug: string,
): Promise<UsageRow[] | undefined> {
  return usageBySlug[slug] ?? usageBySlug.dena;
}

export async function getInvoices(): Promise<Invoice[]> {
  return invoices;
}

export async function getBillingPlan(): Promise<BillingPlan> {
  return plan;
}
