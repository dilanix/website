import {
  Archive,
  ArrowRightLeft,
  Boxes,
  Cable,
  Container,
  Database,
  Globe,
  HardDrive,
  Layers,
  MessagesSquare,
  Network,
  Route,
  Server,
  ShieldCheck,
  Split,
  SquareFunction,
  Waypoints,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface ResourceVisual {
  icon: LucideIcon;
  /** Short human label for the normalized type ("Load balancer"). */
  label: string;
  /** Tailwind gradient for the icon tile. */
  tile: string;
  /** Accent used for minimap dots and glows. */
  color: string;
}

/**
 * Visual identity by normalized, provider-neutral `resource_type` (with a
 * category fallback) — a new provider's resources get the same look without
 * frontend changes.
 */
const BY_RESOURCE_TYPE: Record<string, ResourceVisual> = {
  "compute.instance": {
    icon: Server,
    label: "Instance",
    tile: "from-orange-500 to-amber-500",
    color: "#f59e0b",
  },
  "compute.autoscaling_group": {
    icon: Layers,
    label: "Auto scaling group",
    tile: "from-orange-500 to-amber-500",
    color: "#f59e0b",
  },
  "compute.function": {
    icon: SquareFunction,
    label: "Function",
    tile: "from-amber-500 to-yellow-500",
    color: "#eab308",
  },
  "container.service": {
    icon: Container,
    label: "Container service",
    tile: "from-orange-500 to-red-500",
    color: "#f97316",
  },
  "container.cluster": {
    icon: Boxes,
    label: "Container cluster",
    tile: "from-orange-500 to-red-500",
    color: "#f97316",
  },
  "container.registry": {
    icon: Archive,
    label: "Container registry",
    tile: "from-orange-400 to-amber-500",
    color: "#fb923c",
  },
  "orchestration.cluster": {
    icon: Workflow,
    label: "Kubernetes cluster",
    tile: "from-sky-500 to-blue-600",
    color: "#0ea5e9",
  },
  "orchestration.nodegroup": {
    icon: Layers,
    label: "Node group",
    tile: "from-sky-500 to-blue-600",
    color: "#0ea5e9",
  },
  "orchestration.fargate_profile": {
    icon: Layers,
    label: "Fargate profile",
    tile: "from-sky-500 to-blue-600",
    color: "#0ea5e9",
  },
  "database.instance": {
    icon: Database,
    label: "Database",
    tile: "from-blue-500 to-indigo-600",
    color: "#3b82f6",
  },
  "database.cluster": {
    icon: Database,
    label: "Database cluster",
    tile: "from-blue-500 to-indigo-600",
    color: "#3b82f6",
  },
  "database.table": {
    icon: Database,
    label: "Table",
    tile: "from-indigo-500 to-violet-600",
    color: "#6366f1",
  },
  "cache.cluster": {
    icon: Zap,
    label: "Cache",
    tile: "from-rose-500 to-red-600",
    color: "#f43f5e",
  },
  "messaging.queue": {
    icon: MessagesSquare,
    label: "Queue",
    tile: "from-fuchsia-500 to-pink-600",
    color: "#d946ef",
  },
  "storage.bucket": {
    icon: Archive,
    label: "Bucket",
    tile: "from-emerald-500 to-green-600",
    color: "#10b981",
  },
  "storage.file_system": {
    icon: HardDrive,
    label: "File system",
    tile: "from-emerald-500 to-teal-600",
    color: "#14b8a6",
  },
  "storage.block_volume": {
    icon: HardDrive,
    label: "Volume",
    tile: "from-teal-500 to-emerald-600",
    color: "#14b8a6",
  },
  "network.load_balancer": {
    icon: Split,
    label: "Load balancer",
    tile: "from-violet-500 to-purple-600",
    color: "#8b5cf6",
  },
  "network.target_group": {
    icon: Waypoints,
    label: "Target group",
    tile: "from-violet-400 to-indigo-500",
    color: "#818cf8",
  },
  "network.vpc": {
    icon: Network,
    label: "VPC",
    tile: "from-cyan-500 to-sky-600",
    color: "#06b6d4",
  },
  "network.subnet": {
    icon: Network,
    label: "Subnet",
    tile: "from-cyan-500 to-teal-600",
    color: "#06b6d4",
  },
  "network.route_table": {
    icon: Route,
    label: "Route table",
    tile: "from-slate-500 to-slate-700",
    color: "#64748b",
  },
  "network.internet_gateway": {
    icon: Globe,
    label: "Internet gateway",
    tile: "from-purple-500 to-fuchsia-600",
    color: "#a855f7",
  },
  "network.nat_gateway": {
    icon: ArrowRightLeft,
    label: "NAT gateway",
    tile: "from-purple-500 to-violet-600",
    color: "#a855f7",
  },
  "network.interface": {
    icon: Cable,
    label: "Network interface",
    tile: "from-slate-500 to-cyan-700",
    color: "#94a3b8",
  },
  "network.ip_address": {
    icon: Globe,
    label: "IP address",
    tile: "from-slate-500 to-slate-700",
    color: "#94a3b8",
  },
  "network.security_group": {
    icon: ShieldCheck,
    label: "Security group",
    tile: "from-rose-500 to-pink-600",
    color: "#f43f5e",
  },
};

const BY_CATEGORY: Record<string, ResourceVisual> = {
  compute: BY_RESOURCE_TYPE["compute.instance"],
  container: BY_RESOURCE_TYPE["container.service"],
  orchestration: BY_RESOURCE_TYPE["orchestration.cluster"],
  database: BY_RESOURCE_TYPE["database.instance"],
  cache: BY_RESOURCE_TYPE["cache.cluster"],
  messaging: BY_RESOURCE_TYPE["messaging.queue"],
  storage: BY_RESOURCE_TYPE["storage.bucket"],
  network: {
    icon: Network,
    label: "Network",
    tile: "from-cyan-500 to-sky-600",
    color: "#06b6d4",
  },
};

const FALLBACK: ResourceVisual = {
  icon: Server,
  label: "Resource",
  tile: "from-slate-500 to-slate-700",
  color: "#94a3b8",
};

export function resourceVisual(
  resourceType: string,
  category: string,
): ResourceVisual {
  return BY_RESOURCE_TYPE[resourceType] ?? BY_CATEGORY[category] ?? FALLBACK;
}

export const CATEGORY_LABELS: Record<string, string> = {
  compute: "Compute",
  container: "Containers",
  orchestration: "Kubernetes",
  database: "Databases",
  cache: "Caches",
  messaging: "Messaging",
  storage: "Storage",
  network: "Network",
};

/** Evidence styling shared by edges, legend and inspectors. */
export const EVIDENCE_STYLES = {
  configured: { label: "Configured", color: "#a78bfa", dash: undefined },
  permitted: { label: "Permitted", color: "#fbbf24", dash: "6 5" },
  observed: { label: "Observed", color: "#34d399", dash: undefined },
  inferred: { label: "Inferred", color: "#60a5fa", dash: "2 5" },
  user_confirmed: { label: "Confirmed", color: "#22d3ee", dash: undefined },
} as const;
