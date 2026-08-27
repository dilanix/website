/**
 * Mirrors the category/status vocabulary Dilanix Core's AWS inventory collector
 * actually produces (`src/modules/inventory/collectors/aws/{ec2,rds}.py` in the
 * Core repo). Both are free-form strings on the backend (no enum — a new provider
 * or resource family must never require a migration), so this is presentation-only
 * labeling/coloring, not a source of truth the backend enforces.
 */
export const RESOURCE_CATEGORY_LABELS: Record<string, string> = {
  compute: "Compute",
  database: "Database",
};

export function resourceCategoryLabel(category: string): string {
  return RESOURCE_CATEGORY_LABELS[category] ?? category;
}

const SUCCESS_STATUSES = new Set(["running", "available", "active"]);
const WARNING_STATUSES = new Set([
  "terminated",
  "terminating",
  "deleting",
  "deleted",
  "failed",
]);

export function resourceStatusTone(
  status: string,
): "success" | "neutral" | "warning" {
  const normalized = status.toLowerCase();
  if (SUCCESS_STATUSES.has(normalized)) return "success";
  if (WARNING_STATUSES.has(normalized)) return "warning";
  return "neutral";
}

/** Page size used for both the initial server fetch and client-side "Load more". */
export const RESOURCES_PAGE_SIZE = 20;
