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
    "Dilanix maps your cloud resources, reads your real bill, and ranks the savings that are safe to make — with verified Console, Terraform, and CLI steps to make them.",
} as const;
