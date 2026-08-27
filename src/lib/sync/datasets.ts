/**
 * Mirrors Dilanix Core's `DatasetRegistry` defaults
 * (`src/modules/sync/datasets.py` in the Core repo). The backend has no dataset
 * catalog endpoint yet — that's the still-unbuilt product-requirement planner — so
 * this static list is the only source of truth the frontend has for which datasets
 * can be synced and which capability each one requires. Update this alongside any
 * change to `DEFAULT_DATASETS` on the backend.
 */
export const SYNC_DATASETS = [
  {
    slug: "inventory.resources",
    label: "Inventory Resources",
    requiredCapability: "inventory.read",
  },
  {
    slug: "billing.cost_usage",
    label: "Cost & Usage",
    requiredCapability: "billing.read",
  },
  {
    slug: "metrics.utilization",
    label: "Utilization Metrics",
    requiredCapability: "metrics.read",
  },
  {
    slug: "security.findings",
    label: "Security Findings",
    requiredCapability: "security.read",
  },
] as const;

export type SyncDataset = (typeof SYNC_DATASETS)[number];

/** Page size used for both the initial server fetch and client-side "Load more". */
export const SYNC_RUNS_PAGE_SIZE = 10;

/** Datasets this connection can actually sync, given its currently enabled capabilities. */
export function eligibleSyncDatasets(
  enabledCapabilitySlugs: string[],
): SyncDataset[] {
  const enabled = new Set(enabledCapabilitySlugs);
  return SYNC_DATASETS.filter((dataset) =>
    enabled.has(dataset.requiredCapability),
  );
}
