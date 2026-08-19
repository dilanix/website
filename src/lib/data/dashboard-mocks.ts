import type { Route } from "next";

export type DashboardProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "active" | "pending" | "expired" | "disabled";
  accessExpiresAt?: string | null;
  href: Route;
  navigation: { label: string; href: Route }[];
};

export const dashboardProducts: DashboardProduct[] = [
  {
    id: "costops",
    name: "CostOps",
    slug: "costops",
    description:
      "Understand what your cloud and AI infrastructure really costs.",
    status: "active",
    href: "/dashboard/costops",
    navigation: [
      { label: "Overview", href: "/dashboard/costops" },
      { label: "Costs", href: "/dashboard/costops/costs" },
      { label: "Resources", href: "/dashboard/costops/resources" },
      { label: "Recommendations", href: "/dashboard/costops/recommendations" },
      { label: "Integrations", href: "/dashboard/costops/integrations" },
    ],
  },
];

export const costOpsOverview = {
  period: "Last 30 days",
  metrics: [
    { label: "Total spend", value: "$24,821" },
    { label: "Previous period", value: "$26,310" },
    { label: "Change", value: "-5.7%", tone: "positive" as const },
    { label: "Potential savings", value: "$3,420", tone: "positive" as const },
    { label: "Connected providers", value: "4" },
  ],
  dailySpend: [
    742, 801, 778, 836, 812, 799, 865, 901, 847, 821, 889, 934, 918, 876, 842,
    901, 887, 928, 962, 911, 879, 903, 944, 921, 884, 862, 896, 913, 871, 846,
  ],
  providers: [
    { label: "AWS", amount: 15420, share: 62.1 },
    { label: "OpenAI", amount: 4810, share: 19.4 },
    { label: "Google", amount: 2940, share: 11.8 },
    { label: "Other", amount: 1651, share: 6.7 },
  ],
  categories: [
    { label: "Compute", amount: 9240 },
    { label: "Databases", amount: 4180 },
    { label: "AI / LLM", amount: 7750 },
    { label: "Storage", amount: 1820 },
    { label: "Networking", amount: 1831 },
  ],
};

export const recommendations = [
  {
    id: "rec-1",
    title: "Oversized EC2 instances",
    resources: "3 resources",
    provider: "AWS",
    category: "Compute",
    saving: 820,
    confidence: "High",
    impact: "High",
  },
  {
    id: "rec-2",
    title: "Unused RDS instances",
    resources: "2 resources",
    provider: "AWS",
    category: "Database",
    saving: 460,
    confidence: "High",
    impact: "High",
  },
  {
    id: "rec-3",
    title: "GPT-5 workload model optimization",
    resources: "1 workload",
    provider: "OpenAI",
    category: "AI",
    saving: 390,
    confidence: "Medium",
    impact: "Medium",
  },
  {
    id: "rec-4",
    title: "Unused EBS volumes",
    resources: "7 resources",
    provider: "AWS",
    category: "Storage",
    saving: 210,
    confidence: "High",
    impact: "Medium",
  },
];

export const costRows = [
  {
    id: "1",
    provider: "AWS",
    service: "EC2",
    account: "Production",
    environment: "prod",
    cost: 5820,
    change: 4.2,
  },
  {
    id: "2",
    provider: "AWS",
    service: "RDS",
    account: "Production",
    environment: "prod",
    cost: 3420,
    change: -2.1,
  },
  {
    id: "3",
    provider: "OpenAI",
    service: "GPT-5",
    account: "Core API",
    environment: "prod",
    cost: 2910,
    change: 12.4,
  },
  {
    id: "4",
    provider: "Google",
    service: "Gemini",
    account: "Analysis",
    environment: "prod",
    cost: 1820,
    change: -8.7,
  },
  {
    id: "5",
    provider: "AWS",
    service: "S3",
    account: "Production",
    environment: "prod",
    cost: 920,
    change: 1.1,
  },
];

export const integrations = [
  {
    id: "aws",
    name: "Amazon Web Services",
    shortName: "AWS",
    connected: true,
    detail: "3 accounts",
    sync: "4 minutes ago",
  },
  {
    id: "openai",
    name: "OpenAI",
    shortName: "AI",
    connected: true,
    detail: "Usage and billing",
    sync: "7 minutes ago",
  },
  {
    id: "google",
    name: "Google Cloud",
    shortName: "GCP",
    connected: false,
    detail: "Connect billing and Gemini usage data.",
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    shortName: "AZ",
    connected: false,
    detail: "Connect Azure billing exports.",
  },
];

export const apiKeys = [
  {
    id: "key-1",
    name: "Production Backend",
    masked: "dil_live_8f2a••••••••",
    access: "CostOps",
    created: "Aug 18, 2026",
    lastUsed: "2 minutes ago",
  },
  {
    id: "key-2",
    name: "CI Integration",
    masked: "dil_live_c912••••••••",
    access: "Full access",
    created: "Aug 15, 2026",
    lastUsed: "Yesterday",
  },
];

export const billing = {
  plan: {
    name: "CostOps Pro",
    price: "$99 / month",
    status: "Active",
    nextDate: "September 18, 2026",
  },
  usage: [
    { label: "Cloud accounts", value: "3 / 10" },
    { label: "Monthly spend analyzed", value: "$24,821" },
    { label: "API requests", value: "12,482" },
  ],
  payment: { name: "Visa ending in 4242", expiry: "Expires 08/28" },
  invoices: [
    { id: "INV-2026-08", date: "Aug 18, 2026", amount: "$99", status: "Paid" },
    { id: "INV-2026-07", date: "Jul 18, 2026", amount: "$99", status: "Paid" },
  ],
};

export async function getDashboardProducts() {
  return dashboardProducts;
}
export async function getCostOpsOverview() {
  return costOpsOverview;
}
export async function getCostRows() {
  return costRows;
}
export async function getRecommendations() {
  return recommendations;
}
export async function getIntegrations() {
  return integrations;
}
export async function getApiKeys() {
  return apiKeys;
}
export async function getBilling() {
  return billing;
}
