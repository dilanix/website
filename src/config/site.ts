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
    "Dilanix is a cross-platform Technology Intelligence & Cost Management Platform that connects infrastructure context, resources, and cost data in one operating view.",
} as const;
