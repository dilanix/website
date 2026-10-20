"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
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
import { EmptyState } from "./primitives";
import {
  ExpandableRow,
  ExpandableTable,
  RowMenu,
  RowTag,
  StatePill,
  type PillTone,
} from "./expandable-table";
import { SyncPanel } from "./sync-panel";
import { usePageTour } from "@/components/tours/tour-provider";
import { eligibleSyncDatasets } from "@/lib/sync/datasets";
import {
  SYNC_TOUR_KEY,
  syncActions,
  syncAnchors as tourAnchors,
} from "@/lib/tours/definitions/sync";
import type { SyncPanelTourRequest } from "@/lib/tours/definitions/sync-panel";

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

const GRID =
  "md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_5.5rem]";

const STATE_TONES: Record<SyncState, PillTone> = {
  running: "accent",
  failing: "danger",
  attention: "warning",
  never_synced: "neutral",
  healthy: "success",
  idle: "neutral",
};

function formatSynced(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConnectionSyncRow({
  item,
  open,
  onToggle,
  activeOrganizationCapabilityCodes,
  tourRequest,
}: {
  item: ConnectionSyncData;
  open: boolean;
  onToggle: () => void;
  activeOrganizationCapabilityCodes: string[];
  tourRequest?: SyncPanelTourRequest | null;
}) {
  const router = useRouter();
  const { connection } = item;
  const state = item.error ? null : connectionSyncState(item.runs, item.health);
  const healthy = item.health.filter((row) => row.status === "healthy").length;
  const synced = formatSynced(connection.last_synced_at);
  const connectionHref =
    `/dashboard/integrations/${connection.id}?tab=activity` as Route;

  return (
    <ExpandableRow
      id={connection.id}
      label={connection.name}
      open={open}
      onToggle={onToggle}
      gridClassName={GRID}
      title={
        <>
          <span className="block text-sm font-semibold">{connection.name}</span>
          <span
            data-tour={tourAnchors.connection}
            className="mt-2 flex flex-wrap gap-1.5"
          >
            <RowTag>{item.integrationName}</RowTag>
            <RowTag
              tone={connection.status === "connected" ? "success" : "warning"}
            >
              {connection.status}
            </RowTag>
          </span>
        </>
      }
      cells={[
        <div key="synced" data-tour={tourAnchors.synced} className="text-xs">
          <span className="text-muted-foreground block">Last synced</span>
          <span className="block text-sm font-medium">{synced ?? "Never"}</span>
        </div>,
        <div
          key="datasets"
          data-tour={tourAnchors.datasets}
          className="text-xs"
        >
          <span className="text-muted-foreground block">Datasets healthy</span>
          <span className="text-accent block font-mono text-xl font-semibold">
            {item.health.length > 0
              ? `${healthy} / ${item.health.length}`
              : "—"}
          </span>
        </div>,
        <span key="state" data-tour={tourAnchors.state} className="inline-flex">
          {item.error ? (
            <StatePill tone="warning">Unavailable</StatePill>
          ) : state ? (
            <StatePill tone={STATE_TONES[state]} spinning={state === "running"}>
              {SYNC_STATE_LABELS[state]}
            </StatePill>
          ) : null}
        </span>,
        <div
          key="actions"
          data-tour={tourAnchors.actions}
          className="flex items-center justify-end gap-1"
        >
          <button
            type="button"
            onClick={onToggle}
            className="text-accent px-2 py-1 text-xs font-medium hover:underline"
          >
            {open ? "Close" : "Details"}
          </button>
          <RowMenu
            label={`More actions for ${connection.name}`}
            items={[
              {
                label: "Open connection",
                onSelect: () => router.push(connectionHref),
              },
            ]}
          />
        </div>,
      ]}
    >
      <div className="mb-3 flex justify-end">
        <Link
          href={connectionHref}
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
          activeOrganizationCapabilityCodes={activeOrganizationCapabilityCodes}
          connectionUsable={connection.status === "connected"}
          initialRuns={item.runs}
          initialTotal={item.runsTotal}
          initialPolicies={item.policies}
          initialHealth={item.health}
          initialTargets={item.targets}
          tourRequest={tourRequest}
        />
      )}
    </ExpandableRow>
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

  // The tour opens the first connection's panel (and leaves it open), then
  // its dialogs and newest run, which it closes again.
  const [tourRequest, setTourRequest] = useState<SyncPanelTourRequest | null>(
    null,
  );
  const first = items[0];
  const firstCanSync = Boolean(
    first &&
    !first.error &&
    first.connection.status === "connected" &&
    eligibleSyncDatasets(
      first.enabledCapabilitySlugs,
      activeOrganizationCapabilityCodes,
      first.integrationSlug,
    ).length > 0,
  );
  function openFirst(request?: SyncPanelTourRequest) {
    if (!first || first.error) return false;
    setOpenIds((current) => new Set(current).add(first.connection.id));
    if (!request) return;
    setTourRequest(request);
    return () => setTourRequest(null);
  }
  usePageTour(SYNC_TOUR_KEY, {
    ready: true,
    available: items.length > 0,
    actions: {
      [syncActions.openRow]: () => openFirst(),
      [syncActions.schedules]: () =>
        firstCanSync ? openFirst("schedules") : false,
      [syncActions.syncNow]: () =>
        firstCanSync ? openFirst("sync-now") : false,
      [syncActions.latestRun]: () =>
        first && first.runs.length > 0 ? openFirst("latest-run") : false,
    },
  });

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
    <ExpandableTable
      label="Connections"
      columns={["Connection", "Last synced", "Datasets", "Status", ""]}
      gridClassName={GRID}
      footer={
        <>
          <span data-tour={tourAnchors.footer}>
            Each connection syncs on its own schedule.
          </span>
          <span>
            {items.length} connection{items.length === 1 ? "" : "s"}
          </span>
        </>
      }
    >
      {items.map((item, index) => (
        <ConnectionSyncRow
          key={item.connection.id}
          item={item}
          open={openIds.has(item.connection.id)}
          onToggle={() => toggle(item.connection.id)}
          activeOrganizationCapabilityCodes={activeOrganizationCapabilityCodes}
          tourRequest={index === 0 ? tourRequest : null}
        />
      ))}
    </ExpandableTable>
  );
}
