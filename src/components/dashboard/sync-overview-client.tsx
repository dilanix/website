"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type {
  CoreIntegrationConnection,
  CoreIntegrationTarget,
  CoreSyncDatasetHealth,
  CoreSyncPolicy,
  CoreSyncRun,
} from "@/lib/core/api";
import {
  SYNC_STATE_LABELS,
  connectionSyncState,
  type SyncState,
} from "@/lib/sync/overview";
import { EmptyState, StatusBadge } from "./primitives";
import { SyncPanel } from "./sync-panel";
import { cn } from "@/lib/utils";

export type ConnectionSyncData = {
  connection: CoreIntegrationConnection;
  integrationName: string;
  integrationSlug: string;
  error: string | null;
  enabledCapabilitySlugs: string[];
  targets: CoreIntegrationTarget[];
  runs: CoreSyncRun[];
  runsTotal: number;
  policies: CoreSyncPolicy[];
  health: CoreSyncDatasetHealth[];
};

function stateTone(state: SyncState): "success" | "warning" | "neutral" {
  if (state === "healthy") return "success";
  if (state === "failing" || state === "attention") return "warning";
  return "neutral";
}

function stripe(state: SyncState | null) {
  if (state === "failing") return "bg-red-500";
  if (state === "attention") return "bg-amber-500";
  if (state === "running") return "bg-accent";
  if (state === "healthy") return "bg-success";
  return "bg-muted-foreground/40";
}

function formatSynced(value: string | null) {
  if (!value) return "never synced";
  return `last synced ${new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function ConnectionSyncCard({
  item,
  open,
  onToggle,
  activeOrganizationCapabilityCodes,
}: {
  item: ConnectionSyncData;
  open: boolean;
  onToggle: () => void;
  activeOrganizationCapabilityCodes: string[];
}) {
  const { connection } = item;
  const state = item.error ? null : connectionSyncState(item.runs, item.health);
  const healthy = item.health.filter((row) => row.status === "healthy").length;
  const bodyId = `sync-${connection.id}`;

  return (
    <article
      aria-label={connection.name}
      className={cn(
        "group/card relative overflow-hidden rounded-2xl border transition-all duration-200",
        open
          ? "border-accent/35 bg-card-strong/50 ring-accent/10 shadow-[0_18px_40px_var(--shadow-card)] ring-1"
          : "border-border-soft bg-card-strong/25 hover:border-foreground/15 hover:bg-card-strong/45",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          stripe(state),
          open ? "opacity-100" : "opacity-60 group-hover/card:opacity-100",
        )}
      />
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 py-3.5 pr-4 pl-5 text-left transition-colors",
          open && "bg-accent/[0.04] border-border-soft border-b",
        )}
      >
        <span
          className={cn(
            "border-border-soft bg-background/60 flex size-6 shrink-0 items-center justify-center rounded-full border transition-transform duration-200",
            open && "border-accent/40 text-accent rotate-180",
          )}
        >
          <ChevronDown size={14} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{connection.name}</span>
            <span className="text-muted-foreground text-xs">
              {item.integrationName}
            </span>
          </span>
          <span className="text-muted-foreground mt-1 block text-xs">
            {formatSynced(connection.last_synced_at)}
            {item.health.length > 0
              ? ` · ${healthy} of ${item.health.length} datasets healthy`
              : ""}
          </span>
        </span>
        {item.error ? (
          <StatusBadge status="warning">Unavailable</StatusBadge>
        ) : state ? (
          <StatusBadge status={stateTone(state)}>
            {state === "running" ? (
              <Loader2 size={11} className="animate-spin" aria-hidden />
            ) : null}
            {SYNC_STATE_LABELS[state]}
          </StatusBadge>
        ) : null}
      </button>

      {open ? (
        <div id={bodyId} className="animate-toast-in py-4 pr-4 pl-5">
          <div className="mb-3 flex justify-end">
            <Link
              href={
                `/dashboard/integrations/${connection.id}?tab=activity` as Route
              }
              className="text-accent inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline"
            >
              Open connection <ArrowUpRight size={12} aria-hidden />
            </Link>
          </div>
          {item.error ? (
            <p role="alert" className="text-sm text-red-500">
              {item.error}
            </p>
          ) : (
            <SyncPanel
              connectionId={connection.id}
              providerSlug={item.integrationSlug}
              enabledCapabilitySlugs={item.enabledCapabilitySlugs}
              activeOrganizationCapabilityCodes={
                activeOrganizationCapabilityCodes
              }
              connectionUsable={connection.status === "connected"}
              initialRuns={item.runs}
              initialTotal={item.runsTotal}
              initialPolicies={item.policies}
              initialHealth={item.health}
              initialTargets={item.targets}
            />
          )}
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground mt-3 ml-auto flex items-center gap-1 text-[11px]"
          >
            <ChevronUp size={12} aria-hidden /> Collapse
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function SyncOverviewClient({
  items,
  activeOrganizationCapabilityCodes,
}: {
  items: ConnectionSyncData[];
  activeOrganizationCapabilityCodes: string[];
}) {
  // A single connection is opened straight away; several start collapsed.
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(items.length === 1 ? [items[0].connection.id] : []),
  );

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No cloud connections yet"
        description="Connect a cloud account under Integrations — its data sync shows up here."
        actions={
          <Link
            href="/dashboard/integrations"
            className="bg-accent text-accent-foreground rounded-lg px-3 py-1.5 text-xs font-medium"
          >
            Go to Integrations
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ConnectionSyncCard
          key={item.connection.id}
          item={item}
          open={openIds.has(item.connection.id)}
          onToggle={() => toggle(item.connection.id)}
          activeOrganizationCapabilityCodes={activeOrganizationCapabilityCodes}
        />
      ))}
    </div>
  );
}
