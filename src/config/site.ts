/**
 * Central place for site-wide metadata. Referenced by `src/app/layout.tsx`
 * and `src/lib/data/site.ts` so there is a single source of truth instead
 * of copy-pasted strings.
 */
export const siteConfig = {
  name: "Dilanix",
  domain: "dilanix.org",
  url: "https://dilanix.org",
  description:
    "Dilanix builds AWS cost optimization and multicloud cost visibility software, starting with Dilanix CostOps — built on FOCUS 1.2 billing data.",
} as const;

export type SiteConfig = typeof siteConfig;
