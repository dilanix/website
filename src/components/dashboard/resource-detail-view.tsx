import type { Route } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Braces,
  CalendarClock,
  Cloud,
  Fingerprint,
  Gauge,
  Layers3,
  MapPin,
  Tag,
} from "lucide-react";
import type { CoreResource } from "@/lib/core/api";
import {
  formatCapacityAttributes,
  formatResourceRelativeTime,
  formatSpecificationAttributes,
  resourceCategoryLabel,
  resourceLifecycleStatusLabel,
  resourceLifecycleStatusTone,
  resourceStatusTone,
  resourceTypeLabel,
} from "@/lib/inventory/resources";
import { ResourceCategoryIcon } from "./resource-category-icon";
import { StatusBadge } from "./primitives";

function hasContent(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function fieldLabel(value: string): string {
  const words = value.split(/[._-]+/).filter(Boolean);
  return words
    .map((word, index) =>
      index === 0 ? word[0].toUpperCase() + word.slice(1) : word.toLowerCase(),
    )
    .join(" ");
}

function formatScalar(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function ResourceTime({ value }: { value: string }) {
  return (
    <time dateTime={value} title={new Date(value).toLocaleString()}>
      {formatResourceRelativeTime(value)}
    </time>
  );
}

function AttributeGrid({
  attributes,
}: {
  attributes: Array<{ key: string; label: string; value: string }>;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {attributes.map(({ key, label, value }) => (
        <div
          key={key}
          className="border-border-soft bg-surface/40 min-w-0 rounded-xl border px-4 py-3.5"
        >
          <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            {label}
          </dt>
          <dd className="mt-1.5 truncate font-mono text-sm" title={value}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DetailCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border-soft bg-card-strong/70 rounded-2xl border p-5 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="bg-accent/10 text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ResourceDetailView({
  resource,
  connectionName,
  backHref,
}: {
  resource: CoreResource;
  connectionName: string;
  backHref: Route;
}) {
  const specificationAttributes = formatSpecificationAttributes(
    resource.specification,
  );
  const capacityAttributes = formatCapacityAttributes(resource.capacity);
  const tagEntries = Object.entries(resource.tags).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const extraEntries = Object.entries(resource.extra)
    .filter(([, value]) => hasContent(value))
    .sort(([left], [right]) => left.localeCompare(right));
  const lifecycleSince =
    resource.lifecycle_status === "missing"
      ? resource.missing_since
      : resource.lifecycle_status === "out_of_scope"
        ? resource.out_of_scope_since
        : null;

  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6">
      <Link
        href={backHref}
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft size={15} />
        Back to resources
      </Link>

      <header className="border-border-soft bg-card-strong/75 relative overflow-hidden rounded-3xl border shadow-[0_24px_70px_var(--shadow-card)]">
        <div
          aria-hidden="true"
          className="from-accent/18 via-accent-secondary/10 absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops),transparent_52%)]"
        />
        <div
          aria-hidden="true"
          className="bg-accent/8 absolute -top-24 -right-20 h-64 w-64 rounded-full blur-3xl"
        />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
              <span className="border-accent/15 bg-accent/10 text-accent flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border shadow-[0_16px_36px_var(--shadow-brand)]">
                <ResourceCategoryIcon category={resource.category} size={27} />
              </span>
              <div className="min-w-0">
                <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase">
                  <span>{resource.provider}</span>
                  <span aria-hidden="true">·</span>
                  <span>{resource.provider_resource_type}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tracking-normal normal-case">
                    {connectionName}
                  </span>
                </p>
                <h1 className="mt-2 max-w-4xl text-2xl font-semibold tracking-[-0.025em] break-words sm:text-3xl lg:text-4xl">
                  {resource.name ?? resource.external_id}
                </h1>
                <p className="text-muted-foreground mt-3 max-w-4xl font-mono text-xs leading-5 break-all sm:text-sm">
                  {resource.external_id}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <StatusBadge status={resourceStatusTone(resource.status)}>
                {resource.status}
              </StatusBadge>
              <StatusBadge
                status={resourceLifecycleStatusTone(resource.lifecycle_status)}
              >
                {resourceLifecycleStatusLabel(resource.lifecycle_status)}
                {lifecycleSince ? (
                  <>
                    {" · "}
                    <ResourceTime value={lifecycleSince} />
                  </>
                ) : null}
              </StatusBadge>
            </div>
          </div>
        </div>

        <dl className="border-border-soft bg-background/35 relative grid border-t sm:grid-cols-2 xl:grid-cols-4">
          <div className="border-border-soft flex min-w-0 gap-3 border-b p-5 sm:border-r xl:border-b-0">
            <MapPin className="text-accent mt-0.5 shrink-0" size={16} />
            <div className="min-w-0">
              <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">
                Location
              </dt>
              <dd className="mt-1 truncate font-mono text-sm">
                {resource.region}
                {resource.zone ? ` / ${resource.zone}` : ""}
              </dd>
            </div>
          </div>
          <div className="border-border-soft flex min-w-0 gap-3 border-b p-5 xl:border-r xl:border-b-0">
            <Gauge className="text-accent mt-0.5 shrink-0" size={16} />
            <div className="min-w-0">
              <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">
                Technical profile
              </dt>
              <dd className="mt-1 truncate text-sm">
                {resource.technical_summary ?? resource.provider_sku ?? "—"}
              </dd>
            </div>
          </div>
          <div className="border-border-soft flex min-w-0 gap-3 border-b p-5 sm:border-r sm:border-b-0">
            <CalendarClock className="text-accent mt-0.5 shrink-0" size={16} />
            <div>
              <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">
                First discovered
              </dt>
              <dd className="mt-1 text-sm">
                <ResourceTime value={resource.first_seen_at} />
              </dd>
            </div>
          </div>
          <div className="flex min-w-0 gap-3 p-5">
            <Activity className="text-success mt-0.5 shrink-0" size={16} />
            <div>
              <dt className="text-muted-foreground text-[11px] tracking-wide uppercase">
                Last observed
              </dt>
              <dd className="mt-1 text-sm">
                <ResourceTime value={resource.last_seen_at} />
              </dd>
            </div>
          </div>
        </dl>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(19rem,0.7fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <DetailCard
            icon={<Gauge size={17} />}
            title="Technical configuration"
            description="Normalized specification and provisioned capacity reported by the provider."
          >
            <div className="space-y-7">
              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h3 className="text-sm font-medium">Specification</h3>
                  {resource.provider_sku ? (
                    <span className="border-border-soft bg-surface/60 rounded-lg border px-2.5 py-1 font-mono text-xs">
                      {resource.provider_sku}
                    </span>
                  ) : null}
                </div>
                {specificationAttributes.length > 0 ? (
                  <AttributeGrid attributes={specificationAttributes} />
                ) : (
                  <p className="border-border-soft text-muted-foreground rounded-xl border border-dashed px-4 py-5 text-sm">
                    {resource.provider_sku
                      ? "The technical specification is still being resolved."
                      : "This resource type has no catalog specification."}
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium">
                  Provisioned capacity
                </h3>
                {capacityAttributes.length > 0 ? (
                  <AttributeGrid attributes={capacityAttributes} />
                ) : (
                  <p className="border-border-soft text-muted-foreground rounded-xl border border-dashed px-4 py-5 text-sm">
                    No configurable capacity is reported for this resource.
                  </p>
                )}
              </div>
            </div>
          </DetailCard>

          {extraEntries.length > 0 ? (
            <DetailCard
              icon={<Braces size={17} />}
              title="Provider details"
              description="Provider-specific metadata retained alongside the normalized inventory record."
            >
              <dl className="grid gap-3 sm:grid-cols-2">
                {extraEntries.map(([key, value]) => {
                  const structured =
                    typeof value === "object" && value !== null;
                  return (
                    <div
                      key={key}
                      className="border-border-soft bg-surface/35 min-w-0 rounded-xl border p-4"
                    >
                      <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        {fieldLabel(key)}
                      </dt>
                      <dd className="mt-2 min-w-0 font-mono text-xs leading-5">
                        {structured ? (
                          <pre className="max-h-52 overflow-auto break-words whitespace-pre-wrap">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          <span className="break-words">
                            {formatScalar(value)}
                          </span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </DetailCard>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <DetailCard icon={<Fingerprint size={17} />} title="Identity">
            <dl className="divide-border-soft divide-y text-sm">
              {[
                ["Provider", resource.provider.toUpperCase()],
                ["Category", resourceCategoryLabel(resource.category)],
                ["Resource type", resourceTypeLabel(resource.resource_type)],
                ["Provider type", resource.provider_resource_type],
                ["Region", resource.region],
                ["Zone", resource.zone ?? "Not zonal"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[minmax(7rem,0.8fr)_minmax(0,1fr)] gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium break-words">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="border-border-soft bg-surface/45 mt-5 rounded-xl border p-4">
              <p className="text-muted-foreground flex items-center gap-2 text-[11px] tracking-wide uppercase">
                <Cloud size={13} /> Provider resource key
              </p>
              <p className="mt-2 font-mono text-xs leading-5 break-all">
                {resource.provider_resource_key}
              </p>
            </div>
          </DetailCard>

          <DetailCard icon={<Layers3 size={17} />} title="Inventory record">
            <dl className="space-y-4 text-xs">
              <div>
                <dt className="text-muted-foreground">Resource ID</dt>
                <dd className="mt-1.5 font-mono break-all">{resource.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Target ID</dt>
                <dd className="mt-1.5 font-mono break-all">
                  {resource.target_id}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Connection ID</dt>
                <dd className="mt-1.5 font-mono break-all">
                  {resource.connection_id}
                </dd>
              </div>
            </dl>
          </DetailCard>

          <DetailCard icon={<Tag size={17} />} title="Tags">
            {tagEntries.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tagEntries.map(([key, value]) => (
                  <span
                    key={key}
                    className="border-border-soft bg-surface/50 max-w-full rounded-lg border px-2.5 py-1.5 font-mono text-xs break-all"
                  >
                    <span className="text-muted-foreground">{key}=</span>
                    {value}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No tags are attached to this resource.
              </p>
            )}
          </DetailCard>
        </aside>
      </div>
    </div>
  );
}
