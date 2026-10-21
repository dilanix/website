const METADATA_ACRONYMS: Record<string, string> = {
  api: "API",
  arn: "ARN",
  arns: "ARNs",
  az: "AZ",
  cidr: "CIDR",
  cpu: "CPU",
  db: "DB",
  dlq: "DLQ",
  dns: "DNS",
  ecs: "ECS",
  efs: "EFS",
  gib: "GiB",
  gpu: "GPU",
  http: "HTTP",
  https: "HTTPS",
  id: "ID",
  ids: "IDs",
  ip: "IP",
  ipv4: "IPv4",
  ipv6: "IPv6",
  iops: "IOPS",
  kms: "KMS",
  mb: "MB",
  mib: "MiB",
  mibps: "MiB/s",
  os: "OS",
  ram: "RAM",
  rcu: "RCU",
  s3: "S3",
  sku: "SKU",
  ssl: "SSL",
  tls: "TLS",
  uri: "URI",
  url: "URL",
  urls: "URLs",
  vpc: "VPC",
  wcu: "WCU",
};

function metadataFieldLabel(value: string): string {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word, index) => {
      const normalized = word.toLowerCase();
      const label = METADATA_ACRONYMS[normalized] ?? normalized;
      if (index > 0 || METADATA_ACRONYMS[normalized]) return label;
      return label[0].toUpperCase() + label.slice(1);
    })
    .join(" ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasMetadataContent(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.some(hasMetadataContent);
  if (isRecord(value)) return Object.values(value).some(hasMetadataContent);
  return true;
}

function metadataEntries(metadata: Record<string, unknown>) {
  return Object.entries(metadata)
    .filter(([, value]) => hasMetadataContent(value))
    .sort(([left], [right]) => left.localeCompare(right));
}

function ScalarValue({ value }: { value: unknown }) {
  const formatted =
    typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);

  return <span className="break-words">{formatted}</span>;
}

function MetadataValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    const items = value.filter(hasMetadataContent);
    const containsStructure = items.some(
      (item) => Array.isArray(item) || isRecord(item),
    );

    if (!containsStructure) {
      return (
        <ul className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <li
              key={`${String(item)}-${index}`}
              className="border-border-soft bg-background/55 max-w-full rounded-lg border px-2.5 py-1.5 break-all"
            >
              <ScalarValue value={item} />
            </li>
          ))}
        </ul>
      );
    }

    return (
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li
            key={index}
            className="border-border-soft bg-background/40 rounded-xl border p-3.5"
          >
            <p className="text-muted-foreground mb-2 text-[10px] font-medium tracking-wide uppercase">
              Item {index + 1}
            </p>
            <MetadataValue value={item} />
          </li>
        ))}
      </ol>
    );
  }

  if (isRecord(value)) {
    return (
      <dl className="divide-border-soft divide-y">
        {metadataEntries(value).map(([key, nestedValue]) => (
          <div
            key={key}
            className="grid gap-1.5 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(8rem,0.65fr)_minmax(0,1fr)] sm:gap-4"
          >
            <dt className="text-muted-foreground text-xs">
              {metadataFieldLabel(key)}
            </dt>
            <dd className="min-w-0 font-mono text-xs leading-5 sm:text-right">
              <MetadataValue value={nestedValue} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <ScalarValue value={value} />;
}

/**
 * Renders Core's open-ended `Resource.extra` contract without knowing which
 * provider or resource family produced it. Scalars, lists, objects, and lists
 * of objects all remain readable, while empty enrichment fields are omitted.
 * This intentionally has no provider-specific field registry: new backend
 * metadata should appear on the resource page without a frontend release.
 */
export function ResourceMetadata({
  metadata,
}: {
  metadata: Record<string, unknown>;
}) {
  const entries = metadataEntries(metadata);

  if (entries.length === 0) return null;

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => {
        const structured = Array.isArray(value) || isRecord(value);

        return (
          <div
            key={key}
            className={`border-border-soft bg-surface/35 min-w-0 rounded-xl border p-4 ${structured ? "sm:col-span-2" : ""}`}
          >
            <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {metadataFieldLabel(key)}
            </dt>
            <dd className="mt-2 min-w-0 font-mono text-xs leading-5">
              <MetadataValue value={value} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export function hasResourceMetadata(
  metadata: Record<string, unknown>,
): boolean {
  return metadataEntries(metadata).length > 0;
}
