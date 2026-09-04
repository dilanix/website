This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The authenticated dashboard treats `/v1/auth/me` as the source of truth for effective
organization access. When the user has no active, non-deleted organization, the UI
shows only personal settings: organization-scoped navigation and entry points such as
Products, Integrations, API Keys, and Billing are omitted, and direct requests to those
routes redirect to Settings. Product dashboard routes additionally require an active
organization-product entitlement.

The Integrations dashboard treats Core's `connection_supported` response field as
the source of truth for executable provider onboarding. Planned catalog providers
remain visible with a disabled “Coming soon” action; provider slugs are never used as
a frontend availability allowlist. The static sync dataset list (`src/lib/sync/datasets.ts`)
mirrors only Core's currently runnable `DEFAULT_DATASETS` entries (`inventory.resources`,
`billing.cost_summary`, and `billing.cost_usage` today).

The `/dashboard/costs` page reads both of Core's billing datasets for the
selected connection, deliberately narrower/richer siblings never summed against
each other (`docs/SYNC_INGESTION_ARCHITECTURE.md` "Cost data" in the Core repo):

- **Cost overview** — `GET .../costs/totals` (`src/components/dashboard/unified-cost-totals.tsx`),
  Core's coverage-aware `BillingQueryService` read. Never branches on source
  itself; always shows which dataset actually answered (a `FOCUS` or
  `Cost Explorer` badge) and a rolling-30-day total plus previous-period diff.
- **Cost Explorer breakdown** — `GET .../cost-summaries`(`/totals`) — Core's AWS
  Cost Explorer-sourced `billing.cost_summary` data
  (`src/lib/billing/cost-summaries.ts`, `src/components/dashboard/cost-summary-panel.tsx`):
  period presets/custom range, per-cost-basis totals and daily chart, and raw
  paginated rows filterable by service.
- **FOCUS cost usage** — `GET .../cost-usage`(`/totals`) — Core's AWS FOCUS 1.2
  Data-Export-sourced `billing.cost_usage` data (`src/lib/billing/cost-usage.ts`,
  `src/components/dashboard/cost-usage-panel.tsx`): raw FOCUS detail rows
  (service, resource, region, SKU, charge category) filterable by service and
  billing account, with a `CostUsageMetric` selector (billed/effective/list/
  contracted — all four already present per row, so switching metric never
  re-fetches).

All three read paths 403 when `billing.read` isn't enabled on the connection
rather than returning an empty page (unlike the Resources tab), so the page only
fetches them server-side once that capability is already known to be enabled;
each panel explains the gap otherwise.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
