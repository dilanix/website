import type { CloudResource } from "./types";

const KNOWN_TYPES: Record<string, { label: string; short: string }> = {
  compute_instance: { label: "EC2 instance", short: "EC2" },
  block_storage_volume: { label: "EBS volume", short: "EBS" },
  block_storage_snapshot: { label: "EBS snapshot", short: "Snapshot" },
  machine_image: { label: "Amazon Machine Image", short: "AMI" },
  elastic_ip: { label: "Elastic IP", short: "EIP" },
  nat_gateway: { label: "NAT Gateway", short: "NAT" },
  autoscaling_group: { label: "Auto Scaling group", short: "ASG" },
  database_instance: { label: "RDS instance", short: "RDS" },
  database_cluster: { label: "RDS/Aurora cluster", short: "Aurora" },
  serverless_function: { label: "Lambda function", short: "Lambda" },
  load_balancer: { label: "Load balancer", short: "ELB" },
  object_storage_bucket: { label: "S3 bucket", short: "S3" },
  nosql_table: { label: "DynamoDB table", short: "DynamoDB" },
  cache_cluster: { label: "ElastiCache cluster", short: "ElastiCache" },
  container_cluster: { label: "ECS cluster", short: "ECS" },
  kubernetes_cluster: { label: "EKS cluster", short: "EKS" },
  search_domain: { label: "OpenSearch domain", short: "OpenSearch" },
  cdn_distribution: { label: "CloudFront distribution", short: "CloudFront" },
};

export function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function resourceTypePresentation(type: string) {
  return KNOWN_TYPES[type] ?? { label: humanize(type), short: humanize(type) };
}
export function resourceDisplayName(resource: CloudResource) {
  return resource.name?.trim() || resource.externalId;
}
export function formatRegion(region: string) {
  return region.toLowerCase() === "global" ? "Global" : region;
}
export function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value))
    return value.length ? value.map(formatMetadataValue).join(", ") : "—";
  return JSON.stringify(value, null, 2);
}
export function formatConfigurationValue(key: string, value: unknown): string {
  if (typeof value === "number") {
    if (/(?:^|_)bytes?$|code_size/.test(key)) {
      const gib = value / 1024 ** 3;
      return gib >= 1
        ? `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(gib)} GiB`
        : `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value / 1024 ** 2)} MiB`;
    }
    if (/(?:_gib|size_gib)$/.test(key))
      return `${new Intl.NumberFormat().format(value)} GiB`;
  }
  if (
    typeof value === "string" &&
    /(time|date|modified|created|launch)/.test(key) &&
    !Number.isNaN(Date.parse(value))
  ) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }
  return formatMetadataValue(value);
}

export const CURATED_CONFIGURATION_KEYS: Record<string, string[]> = {
  compute_instance: [
    "instance_type",
    "architecture",
    "platform",
    "launch_time",
    "image_id",
    "lifecycle",
    "private_ip_address",
    "public_ip_address",
    "volume_ids",
    "auto_scaling_group",
  ],
  block_storage_volume: [
    "size_gib",
    "volume_type",
    "iops",
    "throughput",
    "encrypted",
    "create_time",
    "attachments",
  ],
  block_storage_snapshot: [
    "volume_size_gib",
    "encrypted",
    "storage_tier",
    "start_time",
  ],
  serverless_function: [
    "runtime",
    "architectures",
    "memory_size",
    "timeout",
    "ephemeral_storage",
    "package_type",
    "last_modified",
    "code_size",
  ],
  database_instance: [
    "engine",
    "engine_version",
    "allocated_storage",
    "max_allocated_storage",
    "storage_type",
    "iops",
    "storage_throughput",
    "multi_az",
  ],
  database_cluster: [
    "engine",
    "engine_version",
    "members",
    "serverless_configuration",
  ],
  load_balancer: [
    "type",
    "scheme",
    "listeners",
    "target_groups",
    "registered_instances",
  ],
};
