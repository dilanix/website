/**
 * Mirrors Dilanix Core's `DatasetRegistry` defaults
 * (`src/modules/sync/datasets.py` in the Core repo). The backend has no dataset
 * catalog endpoint yet — that's the still-unbuilt product-requirement planner — so
 * this static allowlist mirrors only datasets Core can execute now. Planned dataset
 * names must not appear here before their backend collector and persistence path are
 * runnable. Update this alongside any change to `DEFAULT_DATASETS` on the backend.
 */
export const SYNC_DATASETS = [
  {
    slug: "inventory.resources",
    label: "Inventory Resources",
    requiredCapability: "inventory.read",
  },
  {
    slug: "billing.cost_summary",
    label: "Cost Summary (AWS Cost Explorer)",
    requiredCapability: "billing.read",
  },
  {
    slug: "billing.cost_usage",
    label: "Cost Usage (AWS FOCUS Data Export)",
    requiredCapability: "billing.read",
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

/**
 * Interval presets for the automatic-sync dropdown. Mirrors the floor Dilanix
 * Core enforces on an enabled `SyncPolicy` (`Settings.sync_policy_minimum_interval_seconds`,
 * default 3600s/1h) — every preset here is at or above that floor, so the backend
 * never rejects a value this dropdown offers. `interval_seconds` accepts any
 * positive integer, not just these presets; this list exists purely as frontend
 * convenience.
 */
export const SYNC_INTERVAL_PRESETS = [
  { label: "Every hour", seconds: 3600 },
  { label: "Every 3 hours", seconds: 3 * 3600 },
  { label: "Every 7 hours", seconds: 7 * 3600 },
  { label: "Every 12 hours", seconds: 12 * 3600 },
  { label: "Every 24 hours", seconds: 24 * 3600 },
] as const;

export const DEFAULT_SYNC_INTERVAL_SECONDS = SYNC_INTERVAL_PRESETS[0].seconds;
