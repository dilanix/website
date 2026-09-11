"use client";

import { useEffect, useMemo, useTransition } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Cloud, LoaderCircle } from "lucide-react";
import type {
  CoreIntegrationConnection,
  CoreIntegrationTarget,
} from "@/lib/core/api";
import { useDashboardFilterState } from "@/lib/dashboard/filter-storage";

const COST_ANALYTICS_PATHS = new Set([
  "/dashboard/products/cost",
  "/dashboard/products/cost/explorer",
  "/dashboard/products/cost/allocations",
]);

interface StoredCostDataScope {
  connectionId: string | null;
  targetId: string | null;
}

function isStoredCostDataScope(value: unknown): value is StoredCostDataScope {
  if (!value || typeof value !== "object") return false;
  const scope = value as Record<string, unknown>;
  return (
    (scope.connectionId === null || typeof scope.connectionId === "string") &&
    (scope.targetId === null || typeof scope.targetId === "string")
  );
}

export function CostDataScopeSelector({
  connections,
  targets,
}: {
  connections: CoreIntegrationConnection[];
  targets: CoreIntegrationTarget[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [storedScope, setStoredScope, { restored }] =
    useDashboardFilterState<StoredCostDataScope>(
      "cost.data-scope",
      { connectionId: null, targetId: null },
      isStoredCostDataScope,
    );
  const targetsByConnection = useMemo(() => {
    const result = new Map<string, CoreIntegrationTarget[]>();
    for (const target of targets) {
      const current = result.get(target.connection_id) ?? [];
      current.push(target);
      result.set(target.connection_id, current);
    }
    return result;
  }, [targets]);

  const requestedConnectionId = searchParams.get("connection");
  const requestedTargetId = searchParams.get("target");
  const selectedConnection = connections.find(
    (connection) => connection.id === requestedConnectionId,
  );
  const selectedTarget = selectedConnection
    ? targets.find(
        (target) =>
          target.id === requestedTargetId &&
          target.connection_id === selectedConnection.id,
      )
    : undefined;
  const invalidSelection = Boolean(
    (requestedConnectionId && !selectedConnection) ||
    (requestedTargetId && !selectedTarget),
  );

  useEffect(() => {
    if (!COST_ANALYTICS_PATHS.has(pathname)) return;
    if (requestedConnectionId) {
      if (
        !invalidSelection &&
        (storedScope.connectionId !== requestedConnectionId ||
          storedScope.targetId !== requestedTargetId)
      ) {
        setStoredScope({
          connectionId: requestedConnectionId,
          targetId: requestedTargetId,
        });
      }
      return;
    }
    if (!restored || !storedScope.connectionId) return;
    const connection = connections.find(
      (item) => item.id === storedScope.connectionId,
    );
    const target = storedScope.targetId
      ? targets.find(
          (item) =>
            item.id === storedScope.targetId &&
            item.connection_id === storedScope.connectionId,
        )
      : undefined;
    if (!connection || (storedScope.targetId && !target)) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("connection", connection.id);
    if (target) next.set("target", target.id);
    router.replace(`${pathname}?${next}` as Route, { scroll: false });
  }, [
    connections,
    invalidSelection,
    pathname,
    requestedConnectionId,
    requestedTargetId,
    restored,
    router,
    searchParams,
    setStoredScope,
    storedScope.connectionId,
    storedScope.targetId,
    targets,
  ]);
  const selectedValue = invalidSelection
    ? "invalid"
    : selectedTarget
      ? `target:${selectedTarget.id}`
      : selectedConnection
        ? `connection:${selectedConnection.id}`
        : "all";
  const selectedLabel = invalidSelection
    ? "Unavailable cost data scope"
    : selectedTarget
      ? `${selectedConnection?.name} · ${selectedTarget.display_name ?? selectedTarget.external_id}`
      : (selectedConnection?.name ?? "All accessible connections");

  function selectScope(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    let persisted: StoredCostDataScope = {
      connectionId: null,
      targetId: null,
    };
    if (value === "all") {
      next.delete("connection");
      next.delete("target");
    } else if (value.startsWith("connection:")) {
      const connectionId = value.slice("connection:".length);
      next.set("connection", connectionId);
      next.delete("target");
      persisted = { connectionId, targetId: null };
    } else if (value.startsWith("target:")) {
      const target = targets.find(
        (item) => item.id === value.slice("target:".length),
      );
      if (!target) return;
      next.set("connection", target.connection_id);
      next.set("target", target.id);
      persisted = {
        connectionId: target.connection_id,
        targetId: target.id,
      };
    }
    setStoredScope(persisted);
    const query = next.toString();
    startTransition(() => {
      router.replace(`${pathname}${query ? `?${query}` : ""}` as Route, {
        scroll: false,
      });
    });
  }

  if (!COST_ANALYTICS_PATHS.has(pathname)) return null;

  return (
    <section className="border-border-soft bg-dashboard-panel flex flex-col justify-between gap-3 rounded-2xl border p-4 shadow-[0_16px_44px_var(--shadow-card)] sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Cloud size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Cost data scope
          </p>
          <p className="mt-0.5 truncate text-sm font-medium">{selectedLabel}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Connections without billing.read are excluded automatically.
          </p>
        </div>
      </div>

      <label className="relative block w-full sm:w-80">
        <span className="sr-only">Select cost data scope</span>
        <select
          value={selectedValue}
          disabled={pending || connections.length === 0}
          onChange={(event) => selectScope(event.target.value)}
          className="border-foreground/15 bg-background focus:border-accent h-10 w-full appearance-none rounded-xl border py-2 pr-10 pl-3 text-sm outline-none disabled:opacity-60"
        >
          {invalidSelection ? (
            <option value="invalid" disabled>
              Unavailable or inaccessible scope
            </option>
          ) : null}
          <option value="all">All accessible connections</option>
          {connections.map((connection) => {
            const connectionTargets =
              targetsByConnection.get(connection.id) ?? [];
            return (
              <optgroup key={connection.id} label={connection.name}>
                <option value={`connection:${connection.id}`}>
                  All targets · {connection.name}
                </option>
                {connectionTargets.map((target) => (
                  <option key={target.id} value={`target:${target.id}`}>
                    {target.display_name ?? target.external_id}
                    {target.status === "disabled" ? " (historical)" : ""}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        {pending ? (
          <LoaderCircle
            size={15}
            className="text-muted-foreground pointer-events-none absolute top-3 right-3 animate-spin"
          />
        ) : (
          <ChevronDown
            size={15}
            className="text-muted-foreground pointer-events-none absolute top-3 right-3"
          />
        )}
      </label>
    </section>
  );
}
