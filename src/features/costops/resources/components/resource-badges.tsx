import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/primitives";
import {
  Box,
  Database,
  Globe2,
  HardDrive,
  Network,
  Server,
  Sigma,
} from "lucide-react";
import { humanize, resourceTypePresentation } from "../presentation";

export function ResourceTypeBadge({ type }: { type: string }) {
  const presentation = resourceTypePresentation(type);
  const Icon =
    type === "compute_instance"
      ? Server
      : type.includes("storage") || type === "machine_image"
        ? HardDrive
        : type.includes("database") ||
            type === "nosql_table" ||
            type === "cache_cluster"
          ? Database
          : type === "serverless_function"
            ? Sigma
            : type === "load_balancer" ||
                type === "nat_gateway" ||
                type === "elastic_ip"
              ? Network
              : type === "cdn_distribution"
                ? Globe2
                : Box;
  return (
    <Badge>
      <Icon size={11} aria-hidden="true" />
      {presentation.short}
    </Badge>
  );
}

export function ResourceStateBadge({ state }: { state: string | null }) {
  if (!state) return <span className="text-muted-foreground">—</span>;
  const normalized = state.toLowerCase();
  const status = [
    "running",
    "active",
    "available",
    "in-use",
    "enabled",
  ].includes(normalized)
    ? "success"
    : ["failed", "error", "impaired", "detached"].includes(normalized)
      ? "warning"
      : "neutral";
  return <StatusBadge status={status}>{humanize(state)}</StatusBadge>;
}
