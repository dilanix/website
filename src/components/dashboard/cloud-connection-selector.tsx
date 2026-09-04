"use client";

import { useMemo, useTransition } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Cloud, LoaderCircle } from "lucide-react";
import type {
  CoreIntegration,
  CoreIntegrationConnection,
} from "@/lib/core/api";
import { StatusBadge } from "./primitives";

function statusTone(status: CoreIntegrationConnection["status"]) {
  if (status === "connected") return "success" as const;
  if (status === "error") return "warning" as const;
  return "neutral" as const;
}

export function CloudConnectionSelector({
  basePath,
  integrations,
  connections,
  selectedConnectionId,
}: {
  basePath: "/dashboard/resources" | "/dashboard/costs";
  integrations: CoreIntegration[];
  connections: CoreIntegrationConnection[];
  selectedConnectionId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
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
            { label: "Resources", path: "/dashboard/resources" as const },
            { label: "Costs", path: "/dashboard/costs" as const },
          ].map((item) => (
            <Link
              key={item.path}
              href={
                `${item.path}?connection=${encodeURIComponent(selectedConnectionId)}` as Route
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
            onChange={(event) => {
              const connectionId = event.target.value;
              const nextSearchParams = new URLSearchParams(
                searchParams.toString(),
              );
              nextSearchParams.set("connection", connectionId);
              startTransition(() => {
                router.push(`${basePath}?${nextSearchParams}` as Route);
              });
            }}
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
      </div>
    </section>
  );
}
