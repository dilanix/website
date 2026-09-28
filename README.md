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

The Cost product dashboard at `/dashboard/products/cost` is the only cost
workspace. Its Overview provides Summary, Services, Resources, and Trends
views (`?view=`) while preserving the selected connection/target in the URL:

- **Summary** — `cost/overview` plus Explorer series (`CostOverview`,
  `SpendOverviewClient`) and the cost-management entry points.
- **Services** — Cost Explorer-sourced service rows and per-cost-basis totals
  from `GET .../cost/data/connections/{connection_id}/summaries`(`/totals`)
  (`CostSummaryPanel`).
- **Resources** — normalized FOCUS charge rows (resource, region, SKU, charge
  category) from `GET .../cost/data/connections/{connection_id}/usage`
  (`CostUsagePanel`); shown only when the organization has the FOCUS export
  capability.
- **Trends** — `POST .../cost/spend-trends/query` (`CostTrends`): 30/90 completed
  days or 12 completed months (`?range=`), each bucket against the equal-length
  previous period, with the answering source (FOCUS or Cost Explorer) disclosed.

Services and Resources are connection-scoped and require `billing.read` on the
connection. Billing remains an internal normalized-data boundary with no
frontend-facing routes of its own.

The Infrastructure product dashboard has exactly two sections (`ProductTabs`):
**Graph** at `/dashboard/products/infrastructure` (default; an honest empty
state until Core has relationship producers — no renderer or mock data yet,
components live under `src/components/dashboard/infrastructure/`) and
**Resources** at `/dashboard/products/infrastructure/resources[/{resourceId}]`,
the normalized inventory UI. The former `/dashboard/resources` routes redirect
there (`next.config.ts`); Resources is no longer a Workspace sidebar item.

Cost Overview (`SpendOverviewClient`) defaults to calendar
month-to-date, with explicit rolling 1 day/3 days/Week/30 days presets plus a
custom range. It queries `GET .../cost/overview` first to resolve the actual
source and the largest complete trailing FOCUS range. The FOCUS-only current
spend and dimension widgets then query `POST .../cost/explorer/query` only for
that disclosed effective range; when Overview falls back to `cost_summary`,
they render an explicit unavailable state instead of a misleading zero or
partial total. The page also renders current-vs-equal-length-previous-period
comparison, a daily "Spend trend" line/area chart, per-currency top
services (with an explicit "Other services & credits" remainder so the
visible breakdown always reconciles to the header total), a "By charge
type" panel (the FOCUS `Usage`/`Credit`/`Tax`/... split, `by_charge_category`)
that makes a near-zero net total's usage/credit offsetting visible directly,
and a "Net cost breakdown" panel (`financial_breakdown`) reconciling the
header total into named `gross_usage`/`tax`/`credits`/`other_adjustments`
buckets down to `net_cost`, plus an informational discount-vs-list-price
figure shown only when Core reports one (never folded into the reconciling
buckets, to avoid double-counting a discount the header total already
reflects) — while retaining the Budget/Allocation/Anomaly
management summary below. The header stat cards also show each currency's
absolute change (`absolute_delta`) alongside the existing percentage. The
dedicated Explorer route at
`/dashboard/products/cost/explorer` reads `POST .../cost/explorer/query` and the
saved-view execution endpoint, with metric, daily/weekly/monthly granularity,
multi-dimension grouping (including tag keys), and the shared Cost scope-filter
DSL. The former Cost `/usage` route redirects to Explorer. Every query also
fires a second, parallel `cost/explorer/query` grouped only by
`charge_category` (`granularity: null`, i.e. one total per category for the
whole period) to render its own "By charge type" panel — the same
Usage/Credit/Tax context Overview shows, now available for any Explorer query
too, so a near-zero or unexpectedly small result is never a mystery. Results
render in one of two view modes (`Summary`/`Detailed` tabs, persisted like the
other Explorer controls): `Summary` is the existing grouped bar-chart table;
`Detailed` is a flat, spreadsheet-style table with one column per group
dimension actually present on the rows (read from the results themselves, not
the current `group_by` selection, so a saved view's own grouping renders
correctly too) plus `Currency` and `Amount`. Both views share one "Load more" control (250 rows
at a time) instead of a hard first-250 cutoff.

The Cost Allocations screen also reads
`GET .../cost/allocations/breakdown` for a period/metric showback or chargeback
view. It displays allocated and unallocated spend per currency, following
Core's first-enabled-rule-by-priority semantics, and recalculates after a rule
is created, edited, enabled/disabled, or deleted.

Overview, Explorer, saved-view execution, and Allocation breakdown forward the
shared Cost data scope as optional `connection_id`/`target_id` backend filters.
The selector only offers connections with an active per-connection
`billing.read` capability; the default combines all accessible connections,
while preserving the selected scope in the URL across Cost product tabs.

Dashboard data filters are also persisted in browser `localStorage`, scoped by
the effective organization. This includes connection/target scope, Resources
search and filters, billing filters, Cost Explorer and Allocation breakdown
controls, anomaly status, and resource metric selectors. Restored filters are
re-applied after refresh and when navigating between dashboard pages; explicit
URL query parameters take precedence so shared deep links remain deterministic.

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
