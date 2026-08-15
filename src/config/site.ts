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
    "Dilanix builds intelligent software for engineering teams and modern businesses — combining AI, infrastructure, automation, and thoughtful product design.",
} as const;

export type SiteConfig = typeof siteConfig;
