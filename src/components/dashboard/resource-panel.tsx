"use client";
import type { Route } from "next";
import Link from "next/link";
import {
  type ReactNode,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { ArrowUpDown, ChevronDown, RefreshCw, Search } from "lucide-react";
import type { CoreResource, CoreResourceFilterOptions } from "@/lib/core/api";
import {
  listResourcesAction,
  listResourceFiltersAction,
} from "@/app/dashboard/integrations/actions";
import {
  formatResourceRelativeTime,
  RESOURCE_LIFECYCLE_STATUS_LABELS,
  RESOURCES_PAGE_SIZE,
  resourceCategoryLabel,
  resourceLifecycleStatusLabel,
  resourceStatusTone,
  resourceTypeLabel,
} from "@/lib/inventory/resources";
import { EmptyState, StatusBadge } from "./primitives";
import { ResourceCategoryIcon } from "./resource-category-icon";
import { cn } from "@/lib/utils";
import { useDashboardFilterState } from "@/lib/dashboard/filter-storage";

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
      type="button"
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

/** A labeled native `<select>` dropdown filter — used instead of `FilterChip`
 * once a dimension has too many/open-ended values to lay out as a row of
 * chips (category × type across every resource family any connected
 * provider produces — not AWS-specific, see `filterOptions` below). A native
 * `<select>` also gets working keyboard/mobile picker behavior for free,
 * matching this app's existing dropdown convention
 * (`components/dashboard/api-keys-client.tsx`). */
function FilterSelect({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <span className="relative inline-flex items-center">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="border-foreground/15 bg-background hover:bg-foreground/5 appearance-none rounded-lg border py-1.5 pr-7 pl-3 text-xs font-medium outline-none disabled:opacity-50"
        >
          {children}
        </select>
        <ChevronDown
          size={12}
          className="text-muted-foreground pointer-events-none absolute right-2.5"
        />
      </span>
    </label>
  );
}

function ResourceRow({
  resource,
  href,
}: {
  resource: CoreResource;
  href: Route;
}) {
  return (
    <Link
      href={href}
      className="hover:bg-foreground/[0.025] grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition-colors md:grid-cols-[minmax(12rem,2fr)_minmax(8rem,1fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(6rem,0.7fr)]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="bg-foreground/5 text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
          <ResourceCategoryIcon category={resource.category} size={15} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {resource.name ?? resource.external_id}
          </span>
          <span className="text-muted-foreground block truncate font-mono text-[11px]">
            {resource.external_id}
          </span>
        </span>
      </span>
      <span className="text-muted-foreground hidden min-w-0 md:block">
        <span className="text-foreground block text-xs font-medium">
          {resource.provider.toUpperCase()}
        </span>
        <span className="block truncate text-[11px]">
          {resourceTypeLabel(resource.resource_type)}
        </span>
      </span>
      <span className="text-muted-foreground hidden truncate font-mono text-xs md:block">
        {resource.region}
      </span>
      <span className="justify-self-end md:justify-self-start">
        <StatusBadge status={resourceStatusTone(resource.status)}>
          {resource.status}
        </StatusBadge>
      </span>
      <span className="text-muted-foreground hidden text-xs md:block">
        {formatResourceRelativeTime(resource.last_seen_at)}
      </span>
    </Link>
  );
}

/** The full set of filter dimensions this panel drives — one place to thread
 * through `reload`/`loadMore` instead of four positional parameters that would
 * only grow more error-prone to reorder as filters are added. */
export interface ResourcePanelFilters {
  category: string | null;
  resourceType: string | null;
  region: string | null;
  lifecycleStatus: string;
}

export type ResourceSortKey =
  "name" | "provider" | "region" | "status" | "lastSeen";

function isNullableString(value: unknown) {
  return value === null || typeof value === "string";
}

function isResourcePanelFilters(value: unknown): value is ResourcePanelFilters {
  if (!value || typeof value !== "object") return false;
  const filters = value as Record<string, unknown>;
  return (
    isNullableString(filters.category) &&
    isNullableString(filters.resourceType) &&
    isNullableString(filters.region) &&
    typeof filters.lifecycleStatus === "string"
  );
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isResourceSortKey(value: unknown): value is ResourceSortKey {
  return ["name", "provider", "region", "status", "lastSeen"].includes(
    String(value),
  );
}

function isSortDirection(value: unknown): value is "asc" | "desc" {
  return value === "asc" || value === "desc";
}

function updateResourceUrl(values: Record<string, string | null>) {
  const url = new URL(window.location.href);
  Object.entries(values).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  });
  window.history.replaceState(null, "", url);
}

function SortHeader({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-left text-[11px] font-semibold tracking-wide uppercase",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label} <ArrowUpDown size={11} />
    </button>
  );
}

const ALL_VALUE = "all";

export function ResourcePanel({
  connectionId,
  initialResources,
  initialTotal,
  initialFilterOptions,
  initialFilters,
  initialSearchQuery = "",
  initialSort = "lastSeen",
  initialSortDirection,
  preferInitialFilters = false,
}: {
  connectionId: string;
  initialResources: CoreResource[];
  initialTotal: number;
  /** What category/type/region options this connection's resources actually
   * had at page-load time (`ResourceService.list_resource_filter_options` in
   * Core) — never a frontend-hardcoded resource-family list, and not
   * AWS-specific: it reflects whatever `Resource.category`/`resource_type`
   * this connection's provider (AWS today, any future provider automatically)
   * actually produced. Refreshed alongside the resource list itself so a
   * family added mid-session (a new sync run, a newly implemented collector)
   * shows up without a reload. */
  initialFilterOptions: CoreResourceFilterOptions;
  initialFilters?: Partial<ResourcePanelFilters>;
  initialSearchQuery?: string;
  initialSort?: ResourceSortKey;
  initialSortDirection?: "asc" | "desc";
  preferInitialFilters?: boolean;
}) {
  const [resources, setResources] = useState(initialResources);
  const [total, setTotal] = useState(initialTotal);
  const [filterOptions, setFilterOptions] = useState(initialFilterOptions);
  const initialResolvedFilters: ResourcePanelFilters = {
    category: initialFilters?.category ?? null,
    resourceType: initialFilters?.resourceType ?? null,
    region: initialFilters?.region ?? null,
    // Mirrors the backend's own default (PR #6): the common view is "what
    // exists right now" — `missing`/`out_of_scope` history is opt-in.
    lifecycleStatus: initialFilters?.lifecycleStatus ?? "active",
  };
  const [filters, setFilters, { restored: filtersRestored }] =
    useDashboardFilterState<ResourcePanelFilters>(
      `resources:${connectionId}:filters`,
      initialResolvedFilters,
      isResourcePanelFilters,
      { fallbackPriority: preferInitialFilters },
    );
  const [searchQuery, setSearchQuery] = useDashboardFilterState(
    `resources:${connectionId}:search`,
    initialSearchQuery,
    isString,
    { fallbackPriority: preferInitialFilters },
  );
  const [sortKey, setSortKey] = useDashboardFilterState<ResourceSortKey>(
    `resources:${connectionId}:sort`,
    initialSort,
    isResourceSortKey,
    { fallbackPriority: preferInitialFilters },
  );
  const [sortDirection, setSortDirection] = useDashboardFilterState<
    "asc" | "desc"
  >(
    `resources:${connectionId}:direction`,
    initialSortDirection ?? (initialSort === "lastSeen" ? "desc" : "asc"),
    isSortDirection,
    { fallbackPriority: preferInitialFilters },
  );
  const [pending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const restoredFiltersApplied = useRef(false);

  function reload(next: ResourcePanelFilters) {
    setRefreshing(true);
    setError("");
    startTransition(async () => {
      const [resourcesResult, filtersResult] = await Promise.all([
        listResourcesAction(connectionId, {
          limit: RESOURCES_PAGE_SIZE,
          offset: 0,
          category: next.category,
          resourceType: next.resourceType,
          region: next.region,
          lifecycleStatus: next.lifecycleStatus,
        }),
        listResourceFiltersAction(connectionId),
      ]);
      setRefreshing(false);
      if (resourcesResult.error || filtersResult.error) {
        setError(
          resourcesResult.error ??
            filtersResult.error ??
            "Unable to refresh resources.",
        );
        return;
      }
      if (resourcesResult.data) {
        setResources(resourcesResult.data.items);
        setTotal(resourcesResult.data.total);
        setLastRefreshedAt(new Date());
      }
      if (filtersResult.data) {
        setFilterOptions(filtersResult.data);
      }
    });
  }
  const restoreFilters = useEffectEvent((next: ResourcePanelFilters) => {
    reload(next);
  });

  useEffect(() => {
    if (!filtersRestored || restoredFiltersApplied.current) return;
    restoredFiltersApplied.current = true;
    updateResourceUrl({
      category: filters.category,
      type: filters.resourceType,
      region: filters.region,
      lifecycle:
        filters.lifecycleStatus === "active" ? null : filters.lifecycleStatus,
      q: searchQuery.trim() || null,
      sort: sortKey,
      direction: sortDirection,
    });
    if (
      filters.category !== initialResolvedFilters.category ||
      filters.resourceType !== initialResolvedFilters.resourceType ||
      filters.region !== initialResolvedFilters.region ||
      filters.lifecycleStatus !== initialResolvedFilters.lifecycleStatus
    ) {
      window.setTimeout(() => restoreFilters(filters), 0);
    }
  }, [
    filters,
    filtersRestored,
    initialResolvedFilters.category,
    initialResolvedFilters.lifecycleStatus,
    initialResolvedFilters.region,
    initialResolvedFilters.resourceType,
    searchQuery,
    sortDirection,
    sortKey,
  ]);

  function selectCategory(next: string | null) {
    // A type chosen under the previous category may not exist under the new
    // one (or "All categories") — clear it rather than silently filtering by
    // a type/category combination the dropdown no longer offers.
    const nextFilters = { ...filters, category: next, resourceType: null };
    setFilters(nextFilters);
    updateResourceUrl({ category: next, type: null });
    reload(nextFilters);
  }

  function selectResourceType(next: string | null) {
    const nextFilters = { ...filters, resourceType: next };
    setFilters(nextFilters);
    updateResourceUrl({ type: next });
    reload(nextFilters);
  }

  function selectLifecycleStatus(next: string) {
    const nextFilters = { ...filters, lifecycleStatus: next };
    setFilters(nextFilters);
    updateResourceUrl({ lifecycle: next === "active" ? null : next });
    reload(nextFilters);
  }

  function selectRegion(next: string | null) {
    const nextFilters = { ...filters, region: next };
    setFilters(nextFilters);
    updateResourceUrl({ region: next });
    reload(nextFilters);
  }

  function loadMore() {
    setLoadingMore(true);
    setError("");
    startTransition(async () => {
      const result = await listResourcesAction(connectionId, {
        limit: RESOURCES_PAGE_SIZE,
        offset: resources.length,
        category: filters.category,
        resourceType: filters.resourceType,
        region: filters.region,
        lifecycleStatus: filters.lifecycleStatus,
      });
      setLoadingMore(false);
      if (result.error) return setError(result.error);
      if (result.data) {
        setResources((current) => [...current, ...result.data!.items]);
      }
    });
  }

  function selectSort(next: ResourceSortKey) {
    const nextDirection =
      sortKey === next ? (sortDirection === "asc" ? "desc" : "asc") : "asc";
    setSortKey(next);
    setSortDirection(nextDirection);
    updateResourceUrl({ sort: next, direction: nextDirection });
  }

  const visibleResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? resources.filter((resource) => {
          const searchable = [
            resource.name,
            resource.external_id,
            resource.provider,
            resource.provider_resource_type,
            resource.resource_type,
            resource.region,
            resource.provider_sku,
            ...Object.entries(resource.tags).flatMap(([key, value]) => [
              key,
              value,
            ]),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return searchable.includes(query);
        })
      : [...resources];

    const value = (resource: CoreResource) => {
      if (sortKey === "name") return resource.name ?? resource.external_id;
      if (sortKey === "provider")
        return `${resource.provider} ${resource.resource_type}`;
      if (sortKey === "region") return resource.region;
      if (sortKey === "status") return resource.status;
      return resource.last_seen_at;
    };
    return filtered.sort((left, right) => {
      const result = value(left).localeCompare(value(right), undefined, {
        numeric: true,
      });
      return sortDirection === "asc" ? result : -result;
    });
  }, [resources, searchQuery, sortDirection, sortKey]);

  // Every option below comes from `filterOptions` (`GET .../resources/filters`
  // in Core) — never a frontend-hardcoded resource-family/region list, so a
  // category/type/region only ever appears here when this connection actually
  // has a matching resource right now.
  const categories = Array.from(
    new Set(filterOptions.category_types.map((entry) => entry.category)),
  ).sort();
  const typesByCategory = filterOptions.category_types.reduce<
    Record<string, string[]>
  >((accumulator, entry) => {
    (accumulator[entry.category] ??= []).push(entry.resource_type);
    return accumulator;
  }, {});
  const typeOptionsByCategory = filters.category
    ? typesByCategory[filters.category]
    : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="border-border-soft bg-card-strong/45 rounded-2xl border p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Search resources</span>
            <Search
              size={15}
              className="text-muted-foreground pointer-events-none absolute top-2.5 left-3"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                updateResourceUrl({ q: event.target.value.trim() || null });
              }}
              placeholder="Search name, ID, type, tag…"
              className="border-foreground/15 bg-background focus:border-accent h-9 w-full rounded-lg border pr-3 pl-9 text-sm outline-none"
            />
          </label>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-muted-foreground text-xs">
              {searchQuery
                ? `${visibleResources.length} matching · ${resources.length} loaded`
                : `${resources.length} of ${total} resources`}
              {lastRefreshedAt
                ? ` · updated ${lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </span>
            <button
              type="button"
              onClick={() => reload(filters)}
              disabled={refreshing}
              className="border-foreground/15 hover:bg-foreground/5 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={refreshing ? "animate-spin" : undefined}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="border-border-soft mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-4">
          <FilterSelect
            label="Category"
            value={filters.category ?? ALL_VALUE}
            onChange={(value) =>
              selectCategory(value === ALL_VALUE ? null : value)
            }
            disabled={categories.length === 0}
          >
            <option value={ALL_VALUE}>All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {resourceCategoryLabel(category)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Type"
            value={filters.resourceType ?? ALL_VALUE}
            onChange={(value) =>
              selectResourceType(value === ALL_VALUE ? null : value)
            }
            disabled={filterOptions.category_types.length === 0}
          >
            <option value={ALL_VALUE}>All types</option>
            {typeOptionsByCategory
              ? typeOptionsByCategory.map((type) => (
                  <option key={type} value={type}>
                    {resourceTypeLabel(type)}
                  </option>
                ))
              : Object.entries(typesByCategory).map(([categoryKey, types]) => (
                  <optgroup
                    key={categoryKey}
                    label={resourceCategoryLabel(categoryKey)}
                  >
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {resourceTypeLabel(type)}
                      </option>
                    ))}
                  </optgroup>
                ))}
          </FilterSelect>
          <FilterSelect
            label="Region"
            value={filters.region ?? ALL_VALUE}
            onChange={(value) =>
              selectRegion(value === ALL_VALUE ? null : value)
            }
            disabled={filterOptions.regions.length === 0}
          >
            <option value={ALL_VALUE}>Any region</option>
            {filterOptions.regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </FilterSelect>
          <div className="bg-foreground/10 hidden h-5 w-px sm:block" />
          <FilterGroup label="Lifecycle">
            {Object.entries(RESOURCE_LIFECYCLE_STATUS_LABELS).map(
              ([key, label]) => (
                <FilterChip
                  key={key}
                  active={filters.lifecycleStatus === key}
                  onClick={() => selectLifecycleStatus(key)}
                >
                  {label}
                </FilterChip>
              ),
            )}
          </FilterGroup>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => reload(filters)}
            className="font-medium text-amber-700 hover:underline dark:text-amber-300"
          >
            Try again
          </button>
        </div>
      ) : null}

      {resources.length === 0 ? (
        <EmptyState
          title={
            filters.lifecycleStatus === "active"
              ? "No resources discovered yet"
              : `No ${resourceLifecycleStatusLabel(filters.lifecycleStatus).toLowerCase()} resources`
          }
          description={
            filters.lifecycleStatus === "active"
              ? "Run an inventory sync for this connection to discover resources here."
              : "Nothing currently matches this filter."
          }
        />
      ) : visibleResources.length === 0 ? (
        <EmptyState
          title="No matching resources"
          description="Try a different search term or clear one of the filters."
          actions={
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                updateResourceUrl({ q: null });
              }}
              className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Clear search
            </button>
          }
        />
      ) : (
        <div className="border-border-soft overflow-hidden rounded-2xl border">
          <div className="border-border-soft bg-foreground/[0.025] hidden grid-cols-[minmax(12rem,2fr)_minmax(8rem,1fr)_minmax(7rem,0.8fr)_minmax(7rem,0.8fr)_minmax(6rem,0.7fr)] items-center gap-3 border-b px-4 py-3 md:grid">
            <SortHeader
              label="Resource"
              active={sortKey === "name"}
              onClick={() => selectSort("name")}
            />
            <SortHeader
              label="Provider / type"
              active={sortKey === "provider"}
              onClick={() => selectSort("provider")}
            />
            <SortHeader
              label="Region"
              active={sortKey === "region"}
              onClick={() => selectSort("region")}
            />
            <SortHeader
              label="Status"
              active={sortKey === "status"}
              onClick={() => selectSort("status")}
            />
            <SortHeader
              label="Last seen"
              active={sortKey === "lastSeen"}
              onClick={() => selectSort("lastSeen")}
            />
          </div>
          <div className="divide-border-soft divide-y">
            {visibleResources.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                href={
                  `/dashboard/resources/${resource.id}?${new URLSearchParams({
                    connection: connectionId,
                    ...(filters.category ? { category: filters.category } : {}),
                    ...(filters.resourceType
                      ? { type: filters.resourceType }
                      : {}),
                    ...(filters.region ? { region: filters.region } : {}),
                    lifecycle: resource.lifecycle_status,
                    ...(searchQuery.trim() ? { q: searchQuery.trim() } : {}),
                    sort: sortKey,
                    direction: sortDirection,
                  }).toString()}` as Route
                }
              />
            ))}
          </div>
        </div>
      )}

      {resources.length < total ? (
        <button
          type="button"
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
