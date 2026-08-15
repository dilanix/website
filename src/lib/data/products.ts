import type { Product, ProductDashboardSnapshot } from "@/types";

const products: Product[] = [
  {
    slug: "costops",
    name: "CostOps",
    eyebrow: "Featured product",
    headline: "Understand what your cloud and AI infrastructure really costs.",
    description:
      "CostOps helps engineering teams detect waste, explain cost changes, understand AI and cloud unit economics, and identify opportunities to reduce infrastructure spending.",
    status: "active",
    featured: true,
    capabilities: [
      { label: "Cloud cost intelligence" },
      { label: "AI and LLM cost visibility" },
      { label: "Cost anomaly detection" },
      { label: "Waste detection" },
      { label: "Actionable optimization recommendations" },
      { label: "Unit economics" },
    ],
    ctaLabel: "Explore CostOps",
    ctaHref: "#products",
  },
];

const dashboardSnapshots: Record<string, ProductDashboardSnapshot> = {
  costops: {
    monthlySpendUsd: 24820,
    potentialSavingsUsd: 4310,
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
    recommendation: {
      title: "ECS service document-analysis appears overprovisioned.",
      description:
        "Right-sizing based on trailing 30-day utilization would cut spend without affecting throughput.",
      monthlySavingUsd: 640,
      metrics: [
        { label: "Average CPU", value: "18%" },
        { label: "Average memory", value: "31%" },
      ],
    },
  },
};

/** Stand-in for `GET /api/products`. */
export async function getProducts(): Promise<Product[]> {
  return products;
}

export async function getFeaturedProduct(): Promise<Product | undefined> {
  const all = await getProducts();
  return all.find((product) => product.featured);
}

/** Stand-in for `GET /api/products/{slug}/dashboard-snapshot`. */
export async function getProductDashboardSnapshot(
  slug: string,
): Promise<ProductDashboardSnapshot | undefined> {
  return dashboardSnapshots[slug];
}
