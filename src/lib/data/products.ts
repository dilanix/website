import type { Product, ProductDashboardSnapshot } from "@/types";

const fallbackProducts: Product[] = [
  {
    slug: "costops",
    name: "Dilanix CostOps",
    shortName: "CostOps",
    eyebrow: "Featured Product",
    headline: "AWS Cost Optimization & Multicloud Cost Visibility, Backed by FOCUS 1.2 Data",
    description:
      "Dilanix CostOps unifies AWS Cost Explorer and FOCUS 1.2 Data Export billing into one cost overview, so engineering and finance teams see where cloud spend actually goes and where AWS cost optimization opportunities are hiding — per account, per service, per resource.",
    status: "active",
    featured: true,
    tag: "Live",
    category: "Cloud Cost Optimization",
    capabilities: [
      { label: "AWS FOCUS 1.2 cost data export support" },
      { label: "AWS Cost Explorer breakdown by service" },
      { label: "Unified cost overview across billing sources" },
      { label: "Per-connection, per-account cost visibility" },
    ],
    features: [
      "AWS FOCUS 1.2 cost data export support",
      "AWS Cost Explorer breakdown by service",
      "Unified cost overview across billing sources",
      "Per-connection, per-account cost visibility",
    ],
    highlights: [
      { label: "Billing datasets", value: "FOCUS + Cost Explorer" },
      { label: "Cost metrics", value: "Billed, effective, list, contracted" },
    ],
    faqs: [
      {
        question: "What is AWS FOCUS cost data, and why does it matter for cost optimization?",
        answer:
          "FOCUS (FinOps Open Cost & Usage Specification) is a standardized, resource-level AWS billing export. Unlike Cost Explorer's rolled-up totals, FOCUS 1.2 data exposes per-resource, per-SKU charge detail across billed, effective, list, and contracted cost — the granularity real AWS cost optimization work needs.",
      },
      {
        question: "How is this different from using AWS Cost Explorer alone?",
        answer:
          "Cost Explorer is a great starting point but only shows one view of spend. Dilanix CostOps reads both AWS Cost Explorer and FOCUS data side by side in one cost overview, and always shows which dataset actually answered a given number, so you're never guessing which source to trust.",
      },
      {
        question: "Does Dilanix CostOps support more than AWS?",
        answer:
          "The current focus is deep AWS cost optimization support via Cost Explorer and FOCUS 1.2 exports, with the connection model designed to extend to additional cloud providers as the product grows.",
      },
    ],
    ctaLabel: "Talk to us about AWS cost optimization",
    ctaHref: "/contact",
  },
  {
    slug: "dena",
    name: "Dena Cloud Storage",
    shortName: "Dena",
    eyebrow: "Pipeline Q4",
    headline: "High-Throughput Global Object & Block Storage for AI Datasets and Artifacts",
    description: "S3-compatible distributed object storage engineered for low-latency checkpointing and large dataset streaming.",
    status: "upcoming",
    featured: false,
    tag: "Pipeline Q4",
    category: "Cloud Storage",
    capabilities: [
      { label: "S3 API Compatibility" },
      { label: "Zero Egress Fees Between Nodes" },
      { label: "Intelligent Tiering to Cold Archive" },
      { label: "Edge Caching & Multipart Accelerated Uploads" },
    ],
    features: [
      "S3 API Compatibility",
      "Zero Egress Fees Between Nodes",
      "Intelligent Tiering to Cold Archive",
      "Edge Caching & Multipart Accelerated Uploads",
    ],
    highlights: [
      { label: "Throughput Target", value: "100 Gbps" },
      { label: "Availability SLA", value: "99.99%" },
    ],
    ctaLabel: "Request Early Access",
    ctaHref: "/contact",
  },
  {
    slug: "pulse",
    name: "Dilanix Pulse",
    shortName: "Pulse",
    eyebrow: "Private Beta",
    headline: "Next-Generation Application Performance Monitoring & Distributed Tracing",
    description: "Low-overhead telemetry agents with eBPF-powered kernel tracing and automatic anomaly detection.",
    status: "upcoming",
    featured: false,
    tag: "Private Beta",
    category: "Observability",
    capabilities: [
      { label: "eBPF Kernel Instrumentation" },
      { label: "OpenTelemetry Native Collector" },
      { label: "Automated Distributed Trace Stitching" },
      { label: "Sub-millisecond Latency Outlier Detection" },
    ],
    features: [
      "eBPF Kernel Instrumentation",
      "OpenTelemetry Native Collector",
      "Automated Distributed Trace Stitching",
      "Sub-millisecond Latency Outlier Detection",
    ],
    highlights: [
      { label: "CPU Overhead", value: "< 0.5%" },
      { label: "Trace Ingestion", value: "1M spans/sec" },
    ],
    ctaLabel: "Request Early Access",
    ctaHref: "/contact",
  },
  {
    slug: "guard",
    name: "Dilanix Guard",
    shortName: "Guard",
    eyebrow: "Roadmap 2027",
    headline: "Cloud Infrastructure Security Posture Management & Continuous Compliance",
    description: "Continuous IAM drift detection, exposed bucket scanners, and automated CIS Benchmark compliance auditing.",
    status: "upcoming",
    featured: false,
    tag: "Roadmap 2027",
    category: "Cloud Security",
    capabilities: [
      { label: "Real-time IAM Policy Simulation" },
      { label: "SOC2 / ISO 27001 Automated Compliance" },
      { label: "Public Ingress & Security Group Scanner" },
      { label: "Secrets & Token Leak Detection in Logs" },
    ],
    features: [
      "Real-time IAM Policy Simulation",
      "SOC2 / ISO 27001 Automated Compliance",
      "Public Ingress & Security Group Scanner",
      "Secrets & Token Leak Detection in Logs",
    ],
    highlights: [
      { label: "Audit Frameworks", value: "CIS, SOC2, HIPAA" },
      { label: "Scan Interval", value: "Continuous" },
    ],
    ctaLabel: "Request Early Access",
    ctaHref: "/contact",
  },
];

const defaultDashboardSnapshots: Record<string, ProductDashboardSnapshot> = {
  costops: {
    monthlySpendUsd: 48600,
    potentialSavingsUsd: 7300,
    spendTrend: [
      41200, 42800, 43350, 44950, 45100, 46800, 45950, 47010, 47460, 46990,
      48610, 47280, 49150, 48600,
    ],
    breakdown: [
      { label: "EC2 & Compute", amountUsd: 21400 },
      { label: "S3 & Storage", amountUsd: 12800 },
      { label: "RDS & Databases", amountUsd: 9600 },
      { label: "Data Transfer", amountUsd: 4800 },
    ],
    recommendation: {
      title: "AWS cost optimization opportunity detected",
      description: "FOCUS cost data shows idle EC2 reservations and oversized RDS instances driving avoidable spend.",
      monthlySavingUsd: 7300,
      metrics: [
        { label: "Optimization score", value: "72%" },
        { label: "Cost data source", value: "FOCUS 1.2" },
      ],
    },
  },
  dena: {
    monthlySpendUsd: 14200,
    potentialSavingsUsd: 2800,
    spendTrend: [
      11200, 11800, 12350, 11950, 13100, 13800, 12950, 14010, 14460, 13990,
      14610, 14280, 14950, 14200,
    ],
    breakdown: [
      { label: "Object Storage", amountUsd: 8240 },
      { label: "Block Storage", amountUsd: 3980 },
      { label: "Data Transfer", amountUsd: 1980 },
    ],
    recommendation: {
      title: "Cold archive tiering opportunity",
      description: "Auto-tiering objects unread for 30+ days saves substantial storage spend.",
      monthlySavingUsd: 2800,
      metrics: [
        { label: "Cold tier ratio", value: "64%" },
        { label: "Average latency impact", value: "0ms" },
      ],
    },
  },
};

function mapDtoToProduct(
  dto: Record<string, unknown>,
): Product {
  const slug = String(dto.slug || "");
  const name = String(dto.name || "");
  const shortName = dto.short_name ? String(dto.short_name) : name;
  const isFeatured = Boolean(dto.is_featured);
  const status = dto.product_status === "active" ? "active" : "upcoming";
  const features = Array.isArray(dto.features) ? (dto.features as string[]) : [];
  const highlights = Array.isArray(dto.highlights)
    ? (dto.highlights as { label: string; value: string }[])
    : [];
  const faqs = Array.isArray(dto.faqs)
    ? (dto.faqs as { question: string; answer: string }[])
    : [];

  return {
    slug,
    name,
    shortName,
    eyebrow: isFeatured ? "Featured Product" : "Upcoming Product",
    headline: dto.headline ? String(dto.headline) : dto.description ? String(dto.description) : "",
    description: dto.description ? String(dto.description) : "",
    status,
    featured: isFeatured,
    tag: dto.tag ? String(dto.tag) : undefined,
    category: dto.category ? String(dto.category) : "Infrastructure",
    capabilities: features.length > 0
      ? features.map((label) => ({ label }))
      : [{ label: "High Availability" }, { label: "Enterprise Security" }],
    features,
    highlights,
    faqs,
    documentation: typeof dto.documentation === "string" ? dto.documentation : undefined,
    ctaLabel: "Request Early Access",
    ctaHref: "/contact",
  };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const { getPublicCatalog } = await import("@/lib/core/api");
    const catalog = await getPublicCatalog();
    const all = [
      ...(catalog.featured ? [catalog.featured] : []),
      ...catalog.active,
      ...catalog.upcoming,
    ];
    const seen = new Set<string>();
    const unique = all.filter((p) => {
      if (seen.has(p.slug)) return false;
      seen.add(p.slug);
      return true;
    });

    if (unique.length > 0) {
      return unique.map((p) => mapDtoToProduct(p as unknown as Record<string, unknown>));
    }
  } catch {
    // Graceful fallback
  }
  return fallbackProducts;
}

export async function getFeaturedProduct(): Promise<Product | undefined> {
  const all = await getProducts();
  return all.find((product) => product.featured) || all[0];
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  try {
    const { getPublicProductDetail } = await import("@/lib/core/api");
    const detail = await getPublicProductDetail(slug);
    if (detail) {
      return mapDtoToProduct(detail as unknown as Record<string, unknown>);
    }
  } catch {
    // Fallback
  }
  const all = await getProducts();
  return all.find((product) => product.slug === slug);
}

export async function getUpcomingProducts(): Promise<Product[]> {
  const all = await getProducts();
  const featured = await getFeaturedProduct();
  return all.filter((product) => product.slug !== featured?.slug);
}

export async function getProductDashboardSnapshot(
  slug: string,
): Promise<ProductDashboardSnapshot | undefined> {
  return defaultDashboardSnapshots[slug] ?? defaultDashboardSnapshots.dena;
}
