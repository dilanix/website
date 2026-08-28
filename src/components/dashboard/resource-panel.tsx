"use client";
import { type ReactNode, useState, useTransition } from "react";
import { ChevronRight, Cpu, Database, RefreshCw, Server } from "lucide-react";
import type { CoreResource } from "@/lib/core/api";
import { listResourcesAction } from "@/app/dashboard/integrations/actions";
import {
  formatSpecificationAttributes,
  RESOURCE_CATEGORY_LABELS,
  RESOURCE_LIFECYCLE_STATUS_LABELS,
  RESOURCES_PAGE_SIZE,
  resourceCategoryLabel,
  resourceLifecycleStatusLabel,
  resourceLifecycleStatusTone,
  resourceSpecificationSummary,
  resourceStatusTone,
} from "@/lib/inventory/resources";
import { EmptyState, StatusBadge } from "./primitives";
import { cn } from "@/lib/utils";

/** Renders as a plain conditional (never a dynamically-assigned component
 * reference) so it stays a stable JSX tag across renders. */
function CategoryIcon({ category, size }: { category: string; size: number }) {
  if (category === "compute") return <Cpu size={size} />;
  if (category === "database") return <Database size={size} />;
  return <Server size={size} />;
}

/** One labeled cluster of filter chips (e.g. "Category" or "Status") — grouping
 * keeps unrelated filter dimensions visually distinct instead of reading as one
 * flat row of buttons. */
function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-accent/25 bg-accent/10 text-accent"
          : "border-foreground/10 text-muted-foreground hover:bg-foreground/5",
      )}
    >
      {children}
    </button>
  );
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.round(diffMs / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ResourceRow({ resource }: { resource: CoreResource }) {
  const [expanded, setExpanded] = useState(false);
  const tagEntries = Object.entries(resource.tags);
  const extraEntries = Object.entries(resource.extra).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );
  const specificationSummary = resourceSpecificationSummary(
    resource.specification,
  );
  const specificationAttributes = formatSpecificationAttributes(
    resource.specification,
  );
  const lifecycleSince =
    resource.lifecycle_status === "missing"
      ? resource.missing_since
      : resource.lifecycle_status === "out_of_scope"
        ? resource.out_of_scope_since
        : null;

  return (
    <div>
      <button
        onClick={() => setExpanded((current) => !current)}
        className="hover:bg-foreground/[0.02] flex w-full items-center justify-between gap-3 p-4 text-left text-sm transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-3">
          <ChevronRight
            size={14}
            className={cn(
              "text-muted-foreground shrink-0 transition-transform",
              expanded && "rotate-90",
            )}
          />
          <span className="bg-foreground/5 text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <CategoryIcon category={resource.category} size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">
              {resource.name ?? resource.external_id}
            </p>
            <p className="text-muted-foreground truncate font-mono text-xs">
              {resource.provider_resource_type}
              {resource.provider_sku ? ` · ${resource.provider_sku}` : ""}
            </p>
          </div>
        </div>
        <div className="text-muted-foreground flex shrink-0 items-center gap-4 text-xs">
          {specificationSummary ? (
            <span className="hidden font-mono md:inline">
              {specificationSummary}
            </span>
          ) : null}
          <span className="hidden font-mono sm:inline">{resource.region}</span>
          {resource.lifecycle_status !== "active" ? (
            <StatusBadge
              status={resourceLifecycleStatusTone(resource.lifecycle_status)}
            >
              {resourceLifecycleStatusLabel(resource.lifecycle_status)}
              {lifecycleSince ? ` · ${formatRelativeTime(lifecycleSince)}` : ""}
            </StatusBadge>
          ) : null}
          <StatusBadge status={resourceStatusTone(resource.status)}>
            {resource.status}
          </StatusBadge>
          <span>{formatRelativeTime(resource.last_seen_at)}</span>
        </div>
      </button>
      {expanded ? (
        <div className="border-foreground/10 bg-foreground/[0.015] flex flex-col gap-3 border-t p-4 text-xs">
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 font-mono">
            <span>external id {resource.external_id}</span>
            {resource.zone ? <span>zone {resource.zone}</span> : null}
            <span>first seen {formatRelativeTime(resource.first_seen_at)}</span>
          </div>
          {resource.provider_sku ? (
            specificationAttributes.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-1.5 font-medium">
                  Specification
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                  {specificationAttributes.map(({ key, label, value }) => (
                    <div key={key} className="min-w-0">
                      <dt className="text-muted-foreground truncate">
                        {label}
                      </dt>
                      <dd className="truncate font-mono">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                Technical specification not resolved yet.
              </p>
            )
          ) : null}
          {tagEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tagEntries.map(([key, value]) => (
                <span
                  key={key}
                  className="border-foreground/10 bg-background rounded-full border px-2 py-0.5 font-mono"
                >
                  {key}={value}
                </span>
              ))}
            </div>
          ) : null}
          {extraEntries.length > 0 ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {extraEntries.map(([key, value]) => (
                <div key={key} className="min-w-0">
                  <dt className="text-muted-foreground truncate">{key}</dt>
                  <dd className="truncate font-mono">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ResourcePanel({
  connectionId,
  initialResources,
  initialTotal,
}: {
  connectionId: string;
  initialResources: CoreResource[];
  initialTotal: number;
}) {
  const [resources, setResources] = useState(initialResources);
  const [total, setTotal] = useState(initialTotal);
  const [category, setCategory] = useState<string | null>(null);
  // Mirrors the backend's own default (PR #6): the common view is "what exists
  // right now" — `missing`/`out_of_scope` history is opt-in, never the default.
  const [lifecycleStatus, setLifecycleStatus] = useState<string>("active");
  const [pending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  function reload(nextCategory: string | null, nextLifecycleStatus: string) {
    setRefreshing(true);
    startTransition(async () => {
      const result = await listResourcesAction(connectionId, {
        limit: RESOURCES_PAGE_SIZE,
        offset: 0,
        category: nextCategory,
        lifecycleStatus: nextLifecycleStatus,
      });
      setRefreshing(false);
      if (result.data) {
        setResources(result.data.items);
        setTotal(result.data.total);
      }
    });
  }

  function selectCategory(next: string | null) {
    setCategory(next);
    reload(next, lifecycleStatus);
  }

  function selectLifecycleStatus(next: string) {
    setLifecycleStatus(next);
    reload(category, next);
  }

  function loadMore() {
    setLoadingMore(true);
    startTransition(async () => {
      const result = await listResourcesAction(connectionId, {
        limit: RESOURCES_PAGE_SIZE,
        offset: resources.length,
        category,
        lifecycleStatus,
      });
      setLoadingMore(false);
      if (result.data) {
        setResources((current) => [...current, ...result.data!.items]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <FilterGroup label="Category">
            <FilterChip
              active={category === null}
              onClick={() => selectCategory(null)}
            >
              All
            </FilterChip>
            {Object.keys(RESOURCE_CATEGORY_LABELS).map((key) => (
              <FilterChip
                key={key}
                active={category === key}
                onClick={() => selectCategory(key)}
              >
                {resourceCategoryLabel(key)}
              </FilterChip>
            ))}
          </FilterGroup>
          <div className="bg-foreground/10 hidden h-5 w-px sm:block" />
          <FilterGroup label="Status">
            {Object.entries(RESOURCE_LIFECYCLE_STATUS_LABELS).map(
              ([key, label]) => (
                <FilterChip
                  key={key}
                  active={lifecycleStatus === key}
                  onClick={() => selectLifecycleStatus(key)}
                >
                  {label}
                </FilterChip>
              ),
            )}
          </FilterGroup>
        </div>
        <button
          onClick={() => reload(category, lifecycleStatus)}
          disabled={refreshing}
          className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
        >
          <RefreshCw
            size={13}
            className={refreshing ? "animate-spin" : undefined}
          />
          Refresh
        </button>
      </div>

      {resources.length === 0 ? (
        <EmptyState
          title={
            lifecycleStatus === "active"
              ? "No resources discovered yet"
              : `No ${resourceLifecycleStatusLabel(lifecycleStatus).toLowerCase()} resources`
          }
          description={
            lifecycleStatus === "active"
              ? "Run an inventory sync for this connection to discover resources here."
              : "Nothing currently matches this filter."
          }
        />
      ) : (
        <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
          {resources.map((resource) => (
            <ResourceRow key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      {resources.length < total ? (
        <button
          onClick={loadMore}
          disabled={pending || loadingMore}
          className="border-foreground/15 hover:bg-foreground/5 self-center rounded-lg border px-4 py-2 text-xs font-medium disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
