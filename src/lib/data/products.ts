import { env } from "@/env";
import type { Product, ProductDashboardSnapshot } from "@/types";

const fallbackProducts: Product[] = [
  {
    slug: "costops",
    name: "Dilanix CostOps",
    shortName: "CostOps",
    eyebrow: "Featured Product",
    headline: "Understand what your cloud and AI infrastructure really costs.",
    description:
      "CostOps helps engineering teams detect waste, explain cost changes, understand AI and cloud unit economics, and identify opportunities to reduce infrastructure spending.",
    status: "active",
    featured: true,
    tag: "Flagship Active",
    category: "Cloud FinOps",
    capabilities: [
      { label: "Cloud cost intelligence" },
      { label: "AI and LLM cost visibility" },
      { label: "Cost anomaly detection" },
      { label: "Waste detection" },
      { label: "Actionable optimization recommendations" },
      { label: "Unit economics" },
    ],
    features: [
      "AWS Cost Explorer Spend Ingestion",
      "Continuous EC2 & RDS Telemetry",
      "Capability-Driven Rightsizing Engine",
      "Zero-Hardcode AWS Price List API",
      "Quality-Scored Evidence Snapshots",
      "Granular Hourly & Daily Rollups",
      "PostgreSQL Concurrency Locking",
      "Machine-to-Machine API Keys",
    ],
    highlights: [
      { label: "Telemetry Sample Interval", value: "5 min" },
      { label: "Quality Score Threshold", value: "≥ 80%" },
      { label: "Average Savings Identified", value: "28%" },
    ],
    ctaLabel: "Explore CostOps",
    ctaHref: "/products/costops",
    apiBaseUrl: env.NEXT_PUBLIC_COSTOPS_API_URL,
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
      { label: "Zero Egress Fees" },
      { label: "Intelligent Tiering" },
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
      { label: "eBPF Kernel Tracing" },
      { label: "OpenTelemetry Collector" },
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
      { label: "IAM Policy Simulation" },
      { label: "Automated Compliance" },
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

type ApiProductDto = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  headline: string | null;
  tag: string | null;
  category: string | null;
  product_status: string;
  is_featured: boolean;
  sort_order: number;
  description: string | null;
  documentation?: string | null;
  features: string[];
  highlights: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
  dashboard_snapshot: Record<string, unknown> | null;
  dashboard_enabled: boolean;
  api_enabled: boolean;
};

type ApiCatalogDto = {
  featured: ApiProductDto | null;
  active: ApiProductDto[];
  upcoming: ApiProductDto[];
};

function mapDtoToProduct(dto: ApiProductDto): Product {
  const isCostops = dto.slug === "costops";
  return {
    slug: dto.slug,
    name: dto.name,
    shortName: dto.short_name ?? dto.name,
    eyebrow: dto.tag ?? (dto.is_featured ? "Featured Product" : undefined),
    headline: dto.headline ?? (dto.description ? dto.description.slice(0, 100) : dto.name),
    description: dto.description ?? "",
    status: (dto.product_status as Product["status"]) || "active",
    tag: dto.tag ?? undefined,
    category: dto.category ?? undefined,
    featured: dto.is_featured,
    capabilities: (dto.features || []).map((f) => ({ label: f })),
    features: dto.features || [],
    highlights: dto.highlights || [],
    faqs: dto.faqs || [],
    documentation: dto.documentation ?? undefined,
    sortOrder: dto.sort_order,
    ctaLabel: dto.product_status === "active" ? `Explore ${dto.short_name ?? dto.name}` : "Request Early Access",
    ctaHref: dto.product_status === "active" ? `/products/${dto.slug}` : "/contact",
    apiBaseUrl: isCostops ? env.NEXT_PUBLIC_COSTOPS_API_URL : undefined,
  };
}

export async function getProductsCatalog(): Promise<{
  featured: Product | undefined;
  active: Product[];
  upcoming: Product[];
}> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/products`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data: ApiCatalogDto = await res.json();
      const active = data.active.map(mapDtoToProduct);
      const upcoming = data.upcoming.map(mapDtoToProduct);
      const featured = data.featured ? mapDtoToProduct(data.featured) : active.find((p) => p.featured) ?? active[0];
      return { featured, active, upcoming };
    }
  } catch {
    // Graceful fallback to static seeds if backend is not reachable during build/offline
  }

  const active = fallbackProducts.filter((p) => p.status === "active");
  const upcoming = fallbackProducts.filter((p) => p.status !== "active");
  const featured = fallbackProducts.find((p) => p.featured) ?? active[0];
  return { featured, active, upcoming };
}

export async function getProducts(): Promise<Product[]> {
  const catalog = await getProductsCatalog();
  return [...catalog.active, ...catalog.upcoming];
}

export async function getFeaturedProduct(): Promise<Product | undefined> {
  const catalog = await getProductsCatalog();
  return catalog.featured;
}

export async function getUpcomingProducts(): Promise<Product[]> {
  const catalog = await getProductsCatalog();
  return catalog.upcoming;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/products/${slug}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data: ApiProductDto = await res.json();
      return mapDtoToProduct(data);
    }
  } catch {
    // Fallback to static seeds
  }
  return fallbackProducts.find((p) => p.slug === slug);
}

export async function getProductDashboardSnapshot(
  slug: string,
): Promise<ProductDashboardSnapshot | undefined> {
  return defaultDashboardSnapshots[slug];
}
