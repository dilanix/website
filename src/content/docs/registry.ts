/**
 * The in-app documentation's table of contents. Order here is reading order:
 * the sidebar, search, and "Previous / Next" links all follow it. Page bodies
 * live in `./pages` and are looked up by slug in `./pages/index.tsx`.
 */
export type DocsIcon =
  | "sparkles"
  | "rocket"
  | "boxes"
  | "cloud"
  | "refresh"
  | "network"
  | "bell"
  | "users"
  | "dollar"
  | "lightbulb"
  | "app"
  | "radio"
  | "send"
  | "code"
  | "braces";

export interface DocsPageMeta {
  slug: string;
  title: string;
  description: string;
  icon: DocsIcon;
  /** Extra words search should match. */
  keywords?: string[];
}

export interface DocsSection {
  title: string;
  pages: DocsPageMeta[];
}

export const DOCS_SECTIONS: DocsSection[] = [
  {
    title: "Getting started",
    pages: [
      {
        slug: "welcome",
        title: "Welcome to Dilanix",
        description:
          "What Dilanix does, how data flows through it, and where to go next.",
        icon: "sparkles",
        keywords: ["introduction", "overview", "platform"],
      },
      {
        slug: "quickstart",
        title: "Quickstart",
        description:
          "From an empty workspace to your first cost numbers and recommendations.",
        icon: "rocket",
        keywords: ["start", "setup", "onboarding", "first steps"],
      },
      {
        slug: "concepts",
        title: "Core concepts",
        description:
          "Organizations, connections, targets, datasets, products, and roles.",
        icon: "boxes",
        keywords: ["glossary", "terms", "organization", "target", "dataset"],
      },
    ],
  },
  {
    title: "Platform",
    pages: [
      {
        slug: "connect-aws",
        title: "Connect AWS",
        description:
          "Grant read-only access with CloudFormation and verify your accounts.",
        icon: "cloud",
        keywords: [
          "aws",
          "cloudformation",
          "iam",
          "role",
          "external id",
          "integration",
        ],
      },
      {
        slug: "sync",
        title: "Sync and data health",
        description: "Datasets, schedules, and what each sync status means.",
        icon: "refresh",
        keywords: ["sync", "datasets", "freshness", "health", "schedule"],
      },
      {
        slug: "infrastructure",
        title: "Infrastructure graph",
        description:
          "See every resource and how your resources connect, with the evidence for each link.",
        icon: "network",
        keywords: [
          "graph",
          "resources",
          "dependencies",
          "relationships",
          "traffic",
        ],
      },
      {
        slug: "notifications",
        title: "Notifications",
        description:
          "Deliver alerts and reports to Email, Slack, Telegram, or a webhook.",
        icon: "bell",
        keywords: [
          "alerts",
          "slack",
          "email",
          "telegram",
          "webhook",
          "destinations",
        ],
      },
      {
        slug: "organization",
        title: "Organization, roles, and API keys",
        description: "Who can see and change what, and how to manage API keys.",
        icon: "users",
        keywords: [
          "roles",
          "permissions",
          "owner",
          "admin",
          "member",
          "viewer",
          "api keys",
        ],
      },
    ],
  },
  {
    title: "Products",
    pages: [
      {
        slug: "cost",
        title: "Cost",
        description:
          "Spend, trends, budgets, allocations, anomalies, and reports.",
        icon: "dollar",
        keywords: [
          "finops",
          "spend",
          "budget",
          "explorer",
          "anomalies",
          "reports",
        ],
      },
      {
        slug: "recommendations",
        title: "Recommendations",
        description:
          "How recommendations are made, ranked, and safely applied with How to fix.",
        icon: "lightbulb",
        keywords: [
          "savings",
          "optimization",
          "how to fix",
          "rank",
          "savings plan",
        ],
      },
    ],
  },
  {
    title: "Telemetry",
    pages: [
      {
        slug: "applications",
        title: "Applications and environments",
        description: "Model your services and where they run.",
        icon: "app",
        keywords: ["application", "environment", "production", "staging"],
      },
      {
        slug: "telemetry-sources",
        title: "Sources and ingestion tokens",
        description:
          "Create a telemetry source and a scoped, revocable token for it.",
        icon: "radio",
        keywords: ["telemetry", "source", "token", "scope", "otlp"],
      },
      {
        slug: "send-logs",
        title: "Send logs",
        description:
          "Ship application logs to Dilanix — with a live playground.",
        icon: "send",
        keywords: ["logs", "ingestion", "curl", "python", "node", "go"],
      },
    ],
  },
  {
    title: "Developers",
    pages: [
      {
        slug: "api",
        title: "API overview",
        description: "Ingestion tokens, API keys, errors, and conventions.",
        icon: "code",
        keywords: ["api", "rest", "api key", "bearer", "token", "errors"],
      },
      {
        slug: "api-reference",
        title: "API reference",
        description:
          "The endpoints your own code can call, with schemas, code samples, and Try it.",
        icon: "braces",
        keywords: ["endpoints", "openapi", "try it", "reference"],
      },
    ],
  },
];

export const DOCS_PAGES: DocsPageMeta[] = DOCS_SECTIONS.flatMap(
  (section) => section.pages,
);

export function docsHref(slug: string) {
  return `/dashboard/docs/${slug}`;
}

export function findDocsPage(slug: string) {
  return DOCS_PAGES.find((page) => page.slug === slug) ?? null;
}

export function neighbours(slug: string) {
  const index = DOCS_PAGES.findIndex((page) => page.slug === slug);
  return {
    previous: index > 0 ? DOCS_PAGES[index - 1] : null,
    next:
      index >= 0 && index < DOCS_PAGES.length - 1
        ? DOCS_PAGES[index + 1]
        : null,
  };
}

export function sectionOf(slug: string) {
  return (
    DOCS_SECTIONS.find((section) =>
      section.pages.some((page) => page.slug === slug),
    )?.title ?? null
  );
}
