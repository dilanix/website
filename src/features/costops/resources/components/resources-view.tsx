"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  queryResourcesAction,
  resourceFilterOptionsAction,
} from "@/app/dashboard/costops/actions";
import {
  DashboardError,
  EmptyState,
  PageHeader,
  Skeleton,
} from "@/components/dashboard/primitives";
import { useCostOps } from "../../costops-context";
import { CostOpsSyncControls } from "../../components/costops-sync-controls";
import { ResourceFilters, type FilterValues } from "./resource-filters";
import { ResourceSummaryCards } from "./resource-summary-cards";
import { ResourceTable } from "./resource-table";
import type {
  CloudResourceFilterOptions,
  CloudResourcePage,
  ResourceQuery,
  ResourceSort,
} from "../types";

const EMPTY_OPTIONS: CloudResourceFilterOptions = {
  providers: [],
  resourceTypes: [],
  regions: [],
  states: [],
};
const VALID_SORTS = new Set<ResourceSort>([
  "name",
  "-name",
  "external_id",
  "-external_id",
  "resource_class",
  "-resource_class",
  "region",
  "-region",
  "state",
  "-state",
  "last_seen_at",
  "-last_seen_at",
]);

export function ResourcesView() {
  const api = useCostOps();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const values: FilterValues = {
    search: params.get("search") ?? "",
    provider: params.get("provider") ?? "",
    resourceType: params.get("resource_type") ?? "",
    region: params.get("region") ?? "",
    state: params.get("state") ?? "",
    integrationId: params.get("integration_id") ?? "",
  };
  const page = Math.max(1, Number(params.get("page")) || 1);
  const rawSort = params.get("sort") as ResourceSort | null;
  const sort = rawSort && VALID_SORTS.has(rawSort) ? rawSort : "-last_seen_at";
  const [search, setSearch] = useState(values.search);
  const [data, setData] = useState<CloudResourcePage | null>(null);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);
  const replaceParams = useCallback(
    (changes: Record<string, string | number | undefined>) => {
      setRefetching(true);
      const next = new URLSearchParams(params.toString());
      Object.entries(changes).forEach(([key, value]) =>
        value === undefined || value === ""
          ? next.delete(key)
          : next.set(key, String(value)),
      );
      router.replace(`${pathname}${next.size ? `?${next}` : ""}` as Route, {
        scroll: false,
      });
    },
    [params, pathname, router],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(values.search), 0);
    return () => window.clearTimeout(timer);
  }, [values.search]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== values.search) replaceParams({ search, page: undefined });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, values.search, replaceParams]);
  const loadOptions = useCallback(async () => {
    const result = await resourceFilterOptionsAction();
    if (!result.error && result.data) setOptions(result.data);
  }, []);
  const query = useMemo<ResourceQuery>(
    () => ({
      search: values.search || undefined,
      provider: values.provider || undefined,
      resourceType: values.resourceType || undefined,
      region: values.region || undefined,
      state: values.state || undefined,
      integrationId: values.integrationId || undefined,
      page,
      pageSize: 25,
      sort,
    }),
    [
      values.search,
      values.provider,
      values.resourceType,
      values.region,
      values.state,
      values.integrationId,
      page,
      sort,
    ],
  );
  const load = useCallback(async () => {
    const current = ++requestId.current;
    const result = await queryResourcesAction(query);
    if (current !== requestId.current) return;
    if (result.error || !result.data) setError(true);
    else {
      setData(result.data);
      setError(false);
    }
    setLoading(false);
    setRefetching(false);
  }, [query]);
  useEffect(() => {
    const current = ++requestId.current;
    queryResourcesAction(query).then((result) => {
      if (current !== requestId.current) return;
      if (result.error || !result.data) setError(true);
      else {
        setData(result.data);
        setError(false);
      }
      setLoading(false);
      setRefetching(false);
    });
  }, [query]);
  useEffect(() => {
    resourceFilterOptionsAction().then((result) => {
      if (!result.error && result.data) setOptions(result.data);
    });
  }, []);
  const changeFilters = (next: FilterValues) => {
    setSearch(next.search);
    if (
      next.provider === values.provider &&
      next.resourceType === values.resourceType &&
      next.region === values.region &&
      next.state === values.state &&
      next.integrationId === values.integrationId
    )
      return;
    replaceParams({
      provider: next.provider,
      resource_type: next.resourceType,
      region: next.region,
      state: next.state,
      integration_id: next.integrationId,
      page: undefined,
    });
  };
  const clear = () => {
    setSearch("");
    replaceParams({
      search: undefined,
      provider: undefined,
      resource_type: undefined,
      region: undefined,
      state: undefined,
      integration_id: undefined,
      page: undefined,
    });
  };
  const refreshInventory = async () => {
    setRefetching(true);
    await Promise.all([load(), loadOptions()]);
  };
  const hasFilters = Object.values(values).some(Boolean);
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Resources"
        description="Cloud infrastructure discovered across your connected providers."
        action={<CostOpsSyncControls onSyncCompleted={refreshInventory} />}
      />
      {data ? (
        <ResourceSummaryCards summary={data.summary} />
      ) : (
        <Skeleton className="h-24 w-full" />
      )}
      <ResourceFilters
        values={{ ...values, search }}
        options={options}
        integrations={api.integrations.filter(
          (item) => item.status === "connected",
        )}
        onChange={changeFilters}
      />
      {error && !data ? (
        <DashboardError onRetry={() => void load()} />
      ) : loading ? (
        <div aria-label="Loading resources" className="space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-64" />
        </div>
      ) : data && data.items.length ? (
        <div
          className={refetching ? "opacity-60 transition-opacity" : ""}
          aria-busy={refetching}
        >
          <ResourceTable
            resources={data.items}
            integrations={api.integrations}
            sort={sort}
            onSort={(field) =>
              replaceParams({
                sort: sort === field ? `-${field}` : field,
                page: undefined,
              })
            }
          />
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            onPage={(next) =>
              replaceParams({ page: next === 1 ? undefined : next })
            }
          />
          {error ? (
            <p role="alert" className="text-muted-foreground mt-3 text-xs">
              Could not refresh inventory. Showing the last loaded results.
            </p>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title={hasFilters ? "No filter results" : "No resources"}
          description={
            hasFilters
              ? "No resources match the selected filters."
              : "Resources will appear here after a connected integration completes inventory collection."
          }
          actions={
            hasFilters ? (
              <button
                type="button"
                onClick={clear}
                className="border-foreground/15 rounded-lg border px-4 py-2 text-sm"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage(page: number): void;
}) {
  if (pages <= 1)
    return (
      <p className="text-muted-foreground mt-3 text-xs">{total} resources</p>
    );
  return (
    <nav
      aria-label="Resource pages"
      className="mt-4 flex items-center justify-between gap-3"
    >
      <p className="text-muted-foreground text-xs">
        Page {page} of {pages} · {total} resources
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="border-foreground/15 h-9 rounded-lg border px-3 text-xs disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="border-foreground/15 h-9 rounded-lg border px-3 text-xs disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
