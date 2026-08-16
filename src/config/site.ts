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
    "Dilanix builds software products across AI, cloud infrastructure, automation, data, and engineering productivity.",
} as const;

export type SiteConfig = typeof siteConfig;
