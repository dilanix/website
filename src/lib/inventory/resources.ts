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

/**
 * `lifecycle_status` (`CoreResource.lifecycle_status`) is Dilanix's own view of
 * whether a resource still authoritatively exists — independent from the
 * provider's own `status` above (an EC2 instance the provider reports as
 * `terminated` is still `active` here until a complete snapshot fails to observe
 * it). Values mirror `modules.inventory.models.ResourceLifecycleStatus` in Core.
 */
export const RESOURCE_LIFECYCLE_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  missing: "Missing",
  out_of_scope: "Out of scope",
};

export function resourceLifecycleStatusLabel(lifecycleStatus: string): string {
  return RESOURCE_LIFECYCLE_STATUS_LABELS[lifecycleStatus] ?? lifecycleStatus;
}

export function resourceLifecycleStatusTone(
  lifecycleStatus: string,
): "success" | "neutral" | "warning" {
  if (lifecycleStatus === "missing") return "warning";
  if (lifecycleStatus === "out_of_scope") return "neutral";
  return "success";
}

const BYTES_PER_KIB = 1024;
const BYTES_PER_MIB = BYTES_PER_KIB * 1024;
const BYTES_PER_GIB = BYTES_PER_MIB * 1024;

function formatBytes(bytes: number): string {
  const [divisor, unit] =
    bytes >= BYTES_PER_GIB
      ? [BYTES_PER_GIB, "GiB"]
      : bytes >= BYTES_PER_MIB
        ? [BYTES_PER_MIB, "MiB"]
        : [BYTES_PER_KIB, "KiB"];
  const value = bytes / divisor;
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
}

/**
 * Renders a short "2 vCPU · 4 GiB" summary from a `CoreResourceSpecification`'s
 * canonical `attributes` (`compute.vcpu`, `memory.bytes` — the same vocabulary
 * Dilanix Core's catalog providers normalize into,
 * `src/modules/catalog/providers/aws/{ec2,rds}.py` in the Core repo). Reads only
 * the attributes it knows how to render and silently skips anything else — a new
 * canonical attribute must never require a frontend change just to keep resources
 * displaying. Returns `null` when there's nothing (yet) to show, e.g. specification
 * resolution hasn't completed.
 */
export function resourceSpecificationSummary(
  specification: { attributes: Record<string, unknown> } | null,
): string | null {
  if (!specification) return null;
  const parts: string[] = [];
  const vcpu = specification.attributes["compute.vcpu"];
  if (typeof vcpu === "number") parts.push(`${vcpu} vCPU`);
  const memoryBytes = specification.attributes["memory.bytes"];
  if (typeof memoryBytes === "number") parts.push(formatBytes(memoryBytes));
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Human labels for the canonical attribute vocabulary Dilanix Core's catalog
 * providers normalize into (`src/modules/catalog/providers/aws/{ec2,rds}.py`).
 * Deliberately not exhaustive/authoritative — an attribute missing here still
 * renders (see `formatSpecificationAttributeLabel`), just with its raw key, so a
 * new canonical attribute never silently disappears from the UI.
 */
const ATTRIBUTE_LABELS: Record<string, string> = {
  "compute.vcpu": "vCPU",
  "compute.cores": "Cores",
  "compute.threads_per_core": "Threads per core",
  "compute.virtualization_types": "Virtualization",
  "memory.bytes": "Memory",
  "cpu.architectures": "Architecture",
  "cpu.sustained_clock_speed_ghz": "Sustained clock speed",
  "network.performance": "Network performance",
  "network.max_interfaces": "Max network interfaces",
  "storage.description": "Storage",
  "storage.instance_store_supported": "Instance store",
  "storage.instance_store_bytes": "Instance store size",
  "storage.ebs_optimized_support": "EBS optimized",
  "storage.ebs_baseline_bandwidth_mbps": "EBS baseline bandwidth",
  "storage.ebs_baseline_throughput_mb_per_sec": "EBS baseline throughput",
};

/** Display order for the attributes above; anything else is appended after, alphabetically. */
const ATTRIBUTE_ORDER = Object.keys(ATTRIBUTE_LABELS);

export function formatSpecificationAttributeLabel(key: string): string {
  return ATTRIBUTE_LABELS[key] ?? key;
}

/**
 * Renders one canonical attribute's raw JSON value as something a human can
 * actually read — `4294967296` as "4 GiB", `true`/`false` as "Yes"/"No",
 * `["x86_64"]` as "x86_64" — instead of dumping `JSON.stringify`/`String()`
 * output. Falls back to a plain string for anything it doesn't specifically
 * recognize, so an unrecognized future attribute still renders, just unformatted.
 */
export function formatSpecificationAttributeValue(
  key: string,
  value: unknown,
): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "number") {
    if (key.endsWith(".bytes")) return formatBytes(value);
    if (key.endsWith("_mbps")) return `${value} Mbps`;
    if (key.endsWith("_mb_per_sec")) return `${value} MB/s`;
    if (key.endsWith("_ghz")) return `${value} GHz`;
    return String(value);
  }
  return String(value);
}

export interface FormattedSpecificationAttribute {
  key: string;
  label: string;
  value: string;
}

/**
 * The full attribute list for a resolved `CoreResourceSpecification`, labeled,
 * unit-formatted, and ordered for display (known attributes first in a fixed
 * order, then anything else alphabetically by raw key) — what
 * `ResourceRow`'s expanded detail view actually renders instead of the raw
 * `attributes` object.
 */
export function formatSpecificationAttributes(
  specification: { attributes: Record<string, unknown> } | null,
): FormattedSpecificationAttribute[] {
  if (!specification) return [];
  return Object.entries(specification.attributes)
    .sort(([a], [b]) => {
      const indexA = ATTRIBUTE_ORDER.indexOf(a);
      const indexB = ATTRIBUTE_ORDER.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    })
    .map(([key, value]) => ({
      key,
      label: formatSpecificationAttributeLabel(key),
      value: formatSpecificationAttributeValue(key, value),
    }));
}
