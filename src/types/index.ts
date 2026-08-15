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
  name: string;
  /** Short marker shown above the name, e.g. "FEATURED PRODUCT". */
  eyebrow?: string;
  /** One-line promise shown as the card's headline. */
  headline: string;
  description: string;
  status: "active" | "in-development";
  featured: boolean;
  capabilities: ProductCapability[];
  ctaLabel: string;
  ctaHref: string;
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
  publishedAt: string;
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
  social: SiteSocialLinks;
  nav: NavLink[];
}
