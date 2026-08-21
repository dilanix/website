/**
 * Shared domain entities. These mirror the shape the future FastAPI +
 * PostgreSQL backend will serve, so page/section components can stay
 * unchanged when `src/lib/data/*` switches from local mocks to `fetch`.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface ProductCapability {
  label: string;
}

export interface Product {
  slug: string;
  /** Full brand name, e.g. "Dilanix CostOps" — used where the Dilanix relationship should read clearly. */
  name: string;
  /** Compact name for dense UI, e.g. "CostOps". Falls back to `name` if omitted. */
  shortName?: string;
  /** Short marker shown above the name, e.g. "FEATURED PRODUCT". */
  eyebrow?: string;
  /** One-line promise shown as the card's headline. */
  headline: string;
  description: string;
  status: "active" | "in-development" | "upcoming" | "beta";
  tag?: string;
  category?: string;
  featured: boolean;
  capabilities: ProductCapability[];
  features?: string[];
  highlights?: { label: string; value: string }[];
  faqs?: ProductFaqItem[];
  documentation?: string;
  sortOrder?: number;
  ctaLabel: string;
  ctaHref: string;
  /**
   * Base URL of this product's own backend microservice.
   */
  apiBaseUrl?: string;
}

export interface CostBreakdownItem {
  label: string;
  amountUsd: number;
}

export interface DashboardMetric {
  label: string;
  value: string;
}

export interface DashboardRecommendation {
  title: string;
  description: string;
  monthlySavingUsd: number;
  metrics: DashboardMetric[];
}

export interface ProductDashboardSnapshot {
  monthlySpendUsd: number;
  potentialSavingsUsd: number;
  /** Trailing daily spend, oldest first — drives the sparkline. */
  spendTrend: number[];
  breakdown: CostBreakdownItem[];
  recommendation: DashboardRecommendation;
}

export interface DashboardOverview {
  monthlySpendUsd: number;
  potentialSavingsUsd: number;
  /** 0–100. */
  optimizationScore: number;
  activeAlerts: number;
  /** Trailing daily spend, oldest first — drives the sparkline. */
  spendTrend: number[];
  breakdown: CostBreakdownItem[];
  recommendations: DashboardRecommendation[];
  activity: { id: string; message: string; timestamp: string }[];
}

export interface UsageRow {
  id: string;
  service: string;
  provider: string;
  monthlySpendUsd: number;
  /** Percent change vs. the prior period — positive means spend went up. */
  trendPct: number;
}

export interface Invoice {
  id: string;
  date: string;
  amountUsd: number;
  status: "paid" | "pending" | "failed";
}

export interface BillingPlan {
  name: string;
  priceUsd: number;
  interval: "month" | "year";
  renewsOn: string;
  seats: number;
}

export type PhilosophyIcon = "target" | "wrench" | "sparkles" | "gauge";

export interface PhilosophyPrinciple {
  title: string;
  description: string;
  icon: PhilosophyIcon;
}

export type TechnologyIcon =
  "ai" | "cloud" | "data" | "automation" | "developer-tools";

export interface TechnologyCategory {
  label: string;
  description: string;
  icon: TechnologyIcon;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category?: string;
  readTime?: string;
  author?: {
    name: string;
    role: string;
    avatar?: string;
  };
  publishedAt: string;
  status: "draft" | "published";
}

export interface ProductFaqItem {
  question: string;
  answer: string;
}

export interface ProductComparisonItem {
  feature: string;
  costops: boolean | string;
  legacyFinOps: boolean | string;
  spreadsheets: boolean | string;
  highlight?: boolean;
}

export interface CompanyPage {
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface SiteSocialLinks {
  linkedin?: string;
  github?: string;
}

export interface SiteSettings {
  name: string;
  domain: string;
  description: string;
  url: string;
  email: string;
  calendlyUrl: string;
  social: SiteSocialLinks;
  nav: NavLink[];
}
