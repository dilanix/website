"use client";

import { useEffect, useMemo, useTransition } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Cloud, LoaderCircle } from "lucide-react";
import type {
  CoreIntegration,
  CoreIntegrationConnection,
  CoreIntegrationTarget,
} from "@/lib/core/api";
import { StatusBadge } from "./primitives";
import { useDashboardFilterState } from "@/lib/dashboard/filter-storage";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function statusTone(status: CoreIntegrationConnection["status"]) {
  if (status === "connected") return "success" as const;
  if (status === "error") return "warning" as const;
  return "neutral" as const;
}

const ALL_TARGETS_VALUE = "all";

export function CloudConnectionSelector({
  basePath,
  integrations,
  connections,
  targets = [],
  selectedConnectionId,
  selectedTargetId = null,
  showResources,
  showCosts,
}: {
  basePath: "/dashboard/resources" | "/dashboard/costs";
  integrations: CoreIntegration[];
  connections: CoreIntegrationConnection[];
  /** Every target across `connections` — filtered per-connection below. A
   * connection's target dropdown only renders once it holds more than one
   * target; with zero or one, the connection filter alone is unambiguous. */
  targets?: CoreIntegrationTarget[];
  selectedConnectionId: string;
  selectedTargetId?: string | null;
  showResources: boolean;
  showCosts: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const storageKey = `cloud-connection:${basePath}`;
  const [storedConnectionId, setStoredConnectionId, { restored }] =
    useDashboardFilterState(storageKey, selectedConnectionId, isString);
  const targetStorageKey = `cloud-connection-target:${basePath}:${selectedConnectionId}`;
  const [storedTargetId, setStoredTargetId, { restored: targetRestored }] =
    useDashboardFilterState<string | null>(
      targetStorageKey,
      selectedTargetId,
      isNullableString,
    );
  const integrationsById = useMemo(
    () =>
      new Map(integrations.map((integration) => [integration.id, integration])),
    [integrations],
  );
  const selectedConnection = connections.find(
    (connection) => connection.id === selectedConnectionId,
  );
  const selectedIntegration = selectedConnection
    ? integrationsById.get(selectedConnection.integration_id)
    : undefined;
  const groupedConnections = integrations
    .map((integration) => ({
      integration,
      connections: connections.filter(
        (connection) => connection.integration_id === integration.id,
      ),
    }))
    .filter((group) => group.connections.length > 0);
  const unmatchedConnections = connections.filter(
    (connection) => !integrationsById.has(connection.integration_id),
  );
  const connectionTargets = useMemo(
    () =>
      targets.filter((target) => target.connection_id === selectedConnectionId),
    [targets, selectedConnectionId],
  );
  const selectedTarget = connectionTargets.find(
    (target) => target.id === selectedTargetId,
  );

  useEffect(() => {
    const requestedConnectionId = searchParams.get("connection");
    if (requestedConnectionId) {
      if (
        storedConnectionId !== requestedConnectionId &&
        connections.some((item) => item.id === requestedConnectionId)
      ) {
        setStoredConnectionId(requestedConnectionId);
      }
      return;
    }
    if (
      !restored ||
      storedConnectionId === selectedConnectionId ||
      !connections.some((item) => item.id === storedConnectionId)
    ) {
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.set("connection", storedConnectionId);
    router.replace(`${basePath}?${next}` as Route);
  }, [
    basePath,
    connections,
    restored,
    router,
    searchParams,
    selectedConnectionId,
    storageKey,
    storedConnectionId,
    setStoredConnectionId,
  ]);

  useEffect(() => {
    const requestedTargetId = searchParams.get("target");
    if (requestedTargetId) {
      if (
        storedTargetId !== requestedTargetId &&
        connectionTargets.some((item) => item.id === requestedTargetId)
      ) {
        setStoredTargetId(requestedTargetId);
      }
      return;
    }
    if (
      !targetRestored ||
      !storedTargetId ||
      storedTargetId === selectedTargetId ||
      !connectionTargets.some((item) => item.id === storedTargetId)
    ) {
      return;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.set("target", storedTargetId);
    router.replace(`${basePath}?${next}` as Route);
  }, [
    basePath,
    connectionTargets,
    router,
    searchParams,
    selectedTargetId,
    storedTargetId,
    setStoredTargetId,
    targetRestored,
  ]);

  function selectConnection(connectionId: string) {
    setStoredConnectionId(connectionId);
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("connection", connectionId);
    // A target belongs to exactly one connection — never carry it across.
    nextSearchParams.delete("target");
    startTransition(() => {
      router.push(`${basePath}?${nextSearchParams}` as Route);
    });
  }

  function selectTarget(value: string) {
    const targetId = value === ALL_TARGETS_VALUE ? null : value;
    setStoredTargetId(targetId);
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (targetId) nextSearchParams.set("target", targetId);
    else nextSearchParams.delete("target");
    startTransition(() => {
      router.push(`${basePath}?${nextSearchParams}` as Route);
    });
  }

  return (
    <section className="border-border-soft bg-card-strong/60 flex flex-col justify-between gap-4 rounded-2xl border p-4 shadow-[0_16px_40px_var(--shadow-card)] sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-accent/10 text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Cloud size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Cloud connection
          </p>
          <p className="mt-0.5 truncate text-sm font-medium">
            {selectedIntegration?.name ?? "Cloud provider"}
            {selectedConnection ? ` · ${selectedConnection.name}` : ""}
            {selectedTarget
              ? ` · ${selectedTarget.display_name ?? selectedTarget.external_id}`
              : ""}
          </p>
        </div>
        {selectedConnection ? (
          <StatusBadge status={statusTone(selectedConnection.status)}>
            {selectedConnection.status}
          </StatusBadge>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
        <div className="border-foreground/10 bg-background flex w-fit rounded-lg border p-1 text-xs">
          {[
            showResources
              ? { label: "Resources", path: "/dashboard/resources" as const }
              : null,
            showCosts
              ? { label: "Costs", path: "/dashboard/costs" as const }
              : null,
          ]
            .filter((item) => item !== null)
            .map((item) => (
              <Link
                key={item.path}
                href={
                  `${item.path}?${new URLSearchParams({
                    connection: selectedConnectionId,
                    ...(selectedTargetId ? { target: selectedTargetId } : {}),
                  }).toString()}` as Route
                }
                aria-current={basePath === item.path ? "page" : undefined}
                className={`rounded-md px-2.5 py-1.5 transition-colors ${
                  basePath === item.path
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
        </div>
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Select cloud connection</span>
          <select
            value={selectedConnectionId}
            disabled={pending}
            onChange={(event) => selectConnection(event.target.value)}
            className="border-foreground/15 bg-background focus:border-accent h-10 w-full appearance-none rounded-xl border py-2 pr-10 pl-3 text-sm outline-none disabled:opacity-60"
          >
            {groupedConnections.map(({ integration, connections: items }) => (
              <optgroup key={integration.id} label={integration.name}>
                {items.map((connection) => (
                  <option key={connection.id} value={connection.id}>
                    {connection.name}
                  </option>
                ))}
              </optgroup>
            ))}
            {unmatchedConnections.length ? (
              <optgroup label="Other">
                {unmatchedConnections.map((connection) => (
                  <option key={connection.id} value={connection.id}>
                    {connection.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
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
        {connectionTargets.length > 1 ? (
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Select target account</span>
            <select
              value={selectedTarget ? selectedTarget.id : ALL_TARGETS_VALUE}
              disabled={pending}
              onChange={(event) => selectTarget(event.target.value)}
              className="border-foreground/15 bg-background focus:border-accent h-9 w-full appearance-none rounded-lg border py-1.5 pr-9 pl-3 text-xs outline-none disabled:opacity-60"
            >
              <option value={ALL_TARGETS_VALUE}>All targets</option>
              {connectionTargets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.display_name ?? target.external_id}
                  {target.status === "disabled" ? " (historical)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="text-muted-foreground pointer-events-none absolute top-2.5 right-2.5"
            />
          </label>
        ) : null}
      </div>
    </section>
  );
}
