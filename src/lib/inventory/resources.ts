/**
 * Turns a raw `snake_case`/`dot.separated` backend token into a readable label
 * by default — `"nat_gateway"` -> `"Nat gateway"`, `"orchestration"` ->
 * `"Orchestration"` — so any `category`/`resource_type` Core's `Resource`
 * model ever holds renders sensibly with zero frontend change. These are
 * provider-neutral platform fields (`modules.inventory.models.Resource` in
 * Core), never an AWS-specific vocabulary — a future non-AWS provider's
 * categories/types get exactly the same automatic treatment, no frontend
 * change required. `KNOWN_LABEL_OVERRIDES` below only fixes the handful of
 * cases this mechanical rule gets wrong (acronyms, a friendlier phrasing) — it
 * is cosmetic polish, not the source of truth for what categories/types
 * *exist*: that list comes from `listResourceFilters` (`resource-panel.tsx`),
 * never a hardcoded set here.
 */
function humanizeToken(value: string): string {
  const words = value.split(/[._-]+/).filter(Boolean);
  return words
    .map((word, index) =>
      index === 0 ? word[0].toUpperCase() + word.slice(1) : word.toLowerCase(),
    )
    .join(" ");
}

/** Overrides for the few tokens `humanizeToken` alone doesn't render well
 * (acronyms like VPC/NAT, or a phrasing nicer than the mechanical split). Not
 * exhaustive by design — anything missing here still renders correctly via
 * `humanizeToken`, it just isn't specially polished yet. */
const KNOWN_LABEL_OVERRIDES: Record<string, string> = {
  database: "Database",
  "database.instance": "Database instance",
  "network.vpc": "VPC",
  "network.nat_gateway": "NAT gateway",
  "network.ip_address": "IP address",
};

export function resourceCategoryLabel(category: string): string {
  return KNOWN_LABEL_OVERRIDES[category] ?? humanizeToken(category);
}

/**
 * Labels a canonical `resource_type` (`"container.service"`,
 * `"network.nat_gateway"` — the provider-neutral type, never
 * `provider_resource_type` like `ec2.instance`/`ecs.service`, which stays
 * provider-specific) using the resource_type's own override key first, then
 * falling back to humanizing just its last dotted segment (`"service"` from
 * `"container.service"`) so an unrecognized future type still reads as a
 * plain word, not a dotted backend token.
 */
export function resourceTypeLabel(resourceType: string): string {
  if (KNOWN_LABEL_OVERRIDES[resourceType])
    return KNOWN_LABEL_OVERRIDES[resourceType];
  const segment = resourceType.split(".").pop() ?? resourceType;
  return KNOWN_LABEL_OVERRIDES[segment] ?? humanizeToken(segment);
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
  // `Resource.capacity`'s vocabulary (Core's `modules.inventory.summary`) —
  // this resource's own configured/provisioned capacity, distinct from the
  // specification attributes above but rendered through the same table.
  "storage.size_bytes": "Size",
  "storage.iops": "IOPS",
  "storage.throughput_mib_per_sec": "Throughput",
  "dynamodb.read_capacity_units": "Read capacity",
  "dynamodb.write_capacity_units": "Write capacity",
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
    // Broad "ends with bytes" (not just ".bytes") so both "memory.bytes" and
    // "storage.size_bytes"/"storage.instance_store_bytes" get formatted —
    // every current key ending in "bytes" genuinely means a byte count, so
    // this has no false-positive risk.
    if (key.endsWith("bytes")) return formatBytes(value);
    if (key.endsWith("_mbps")) return `${value} Mbps`;
    if (key.endsWith("_mb_per_sec")) return `${value} MB/s`;
    if (key.endsWith("_mib_per_sec")) return `${value} MiB/s`;
    if (key.endsWith("_ghz")) return `${value} GHz`;
    if (key === "storage.iops") return `${value} IOPS`;
    if (key === "dynamodb.read_capacity_units") return `${value} RCU`;
    if (key === "dynamodb.write_capacity_units") return `${value} WCU`;
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
 * Labels, unit-formats, and orders a canonical attribute record for display
 * (known attributes first in a fixed order, then anything else alphabetically
 * by raw key) — the shared implementation behind `formatSpecificationAttributes`
 * (`specification.attributes`) and `formatCapacityAttributes`
 * (`Resource.capacity`): the same dotted-key vocabulary, just two different
 * sources on `CoreResource`.
 */
function formatAttributeEntries(
  attributes: Record<string, unknown>,
): FormattedSpecificationAttribute[] {
  return Object.entries(attributes)
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

/**
 * The full attribute list for a resolved `CoreResourceSpecification` — what
 * `ResourceRow`'s expanded "Specification" detail view renders instead of the
 * raw `attributes` object.
 */
export function formatSpecificationAttributes(
  specification: { attributes: Record<string, unknown> } | null,
): FormattedSpecificationAttribute[] {
  if (!specification) return [];
  return formatAttributeEntries(specification.attributes);
}

/**
 * The full attribute list for `Resource.capacity` — what `ResourceRow`'s
 * expanded "Capacity" detail view renders. Unlike `specification`, `capacity`
 * is never `null` on `CoreResource` (an empty object, not null, means "no
 * capacity concept for this resource type"), so this takes the record
 * directly.
 */
export function formatCapacityAttributes(
  capacity: Record<string, unknown>,
): FormattedSpecificationAttribute[] {
  return formatAttributeEntries(capacity);
}
