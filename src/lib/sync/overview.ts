import {
  integrationCapabilityCode,
  type CoreConnectionCapability,
  type CoreIntegrationCapability,
  type CoreSyncDatasetHealth,
  type CoreSyncRun,
} from "@/lib/core/api";

/** The capability slugs a connection may sync: enabled on the connection and
 * granted to the organization — what `SyncPanel` offers datasets for. */
export function enabledSyncCapabilitySlugs({
  integrationSlug,
  capabilities,
  connectionCapabilities,
  activeOrganizationCapabilityCodes,
}: {
  integrationSlug: string;
  capabilities: CoreIntegrationCapability[];
  connectionCapabilities: CoreConnectionCapability[];
  activeOrganizationCapabilityCodes: string[];
}) {
  const active = new Set(activeOrganizationCapabilityCodes);
  const available = new Set(
    capabilities
      .filter((capability) =>
        active.has(integrationCapabilityCode(integrationSlug, capability.slug)),
      )
      .map((capability) => capability.id),
  );
  return connectionCapabilities
    .filter((row) => row.enabled && available.has(row.capability_id))
    .map((row) => row.capability.slug);
}

export type SyncState =
  "running" | "failing" | "attention" | "never_synced" | "healthy" | "idle";

const ACTIVE_RUN_STATUSES = new Set<CoreSyncRun["status"]>([
  "queued",
  "running",
  "cancel_requested",
]);

/** One connection's sync at a glance: a run in flight wins, then the worst
 * dataset health. */
export function connectionSyncState(
  runs: CoreSyncRun[],
  health: CoreSyncDatasetHealth[],
): SyncState {
  if (runs.some((run) => ACTIVE_RUN_STATUSES.has(run.status))) return "running";
  if (health.some((item) => item.status === "failing")) return "failing";
  if (
    health.some(
      (item) => item.status === "degraded" || item.status === "delayed",
    )
  )
    return "attention";
  if (health.length === 0) return "idle";
  if (health.every((item) => item.status === "never_synced"))
    return "never_synced";
  return "healthy";
}

const SEVERITY: SyncState[] = [
  "running",
  "failing",
  "attention",
  "never_synced",
  "healthy",
  "idle",
];

/** What the menu shows for every connection together. */
export function combinedSyncState(states: SyncState[]): SyncState {
  return SEVERITY.find((state) => states.includes(state)) ?? "idle";
}

export const SYNC_STATE_LABELS: Record<SyncState, string> = {
  running: "Syncing",
  failing: "Failing",
  attention: "Needs attention",
  never_synced: "Never synced",
  healthy: "Healthy",
  idle: "No datasets",
};
