import type { Product, ProductDashboardSnapshot } from "@/types";

const fallbackProducts: Product[] = [
  {
    slug: "dena",
    name: "Dena Cloud Storage",
    shortName: "Dena",
    eyebrow: "Pipeline Q4",
    headline: "High-Throughput Global Object & Block Storage for AI Datasets and Artifacts",
    description: "S3-compatible distributed object storage engineered for low-latency checkpointing and large dataset streaming.",
    status: "upcoming",
    featured: true,
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
