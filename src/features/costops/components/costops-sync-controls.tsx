"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useCostOps } from "../costops-context";
import { formatRelativeTime } from "../utils";
import {
  CostOpsAutoSyncSelect,
  type AutoSyncIntervalMinutes,
} from "./costops-auto-sync-select";

export function CostOpsSyncControls({
  integrationId,
  onSyncCompleted,
}: {
  integrationId?: string;
  onSyncCompleted?: () => void | Promise<void>;
}) {
  const api = useCostOps();
  const connected = useMemo(
    () => api.integrations.filter((item) => item.status === "connected"),
    [api.integrations],
  );
  const [selectedId, setSelectedId] = useState(
    integrationId ?? connected[0]?.id ?? "",
  );
  const [requesting, setRequesting] = useState(false);
  const [requestFailed, setRequestFailed] = useState(false);
  const [settingsUpdating, setSettingsUpdating] = useState(false);
  const [settingsFailed, setSettingsFailed] = useState(false);
  const [now, setNow] = useState(Date.now);
  const requestRef = useRef(false);
  const initiatedRef = useRef(false);
  const wasSyncingRef = useRef(false);
  const startedLastSyncedAtRef = useRef<string | null>(null);
  const onSyncCompletedRef = useRef(onSyncCompleted);

  const resolvedId =
    integrationId && connected.some((item) => item.id === integrationId)
      ? integrationId
      : connected.some((item) => item.id === selectedId)
        ? selectedId
        : (connected[0]?.id ?? "");
  const integration = connected.find((item) => item.id === resolvedId);
  const activeSync = integration ? api.activeSyncs[integration.id] : undefined;
  const latestRun = integration
    ? api.snapshot?.syncRuns[integration.id]?.[0]
    : undefined;
  const syncing = Boolean(
    integration &&
    (requesting ||
      api.syncStarting.has(integration.id) ||
      api.activeSyncs[integration.id]),
  );

  useEffect(() => {
    onSyncCompletedRef.current = onSyncCompleted;
  }, [onSyncCompleted]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (syncing) {
      wasSyncingRef.current = true;
      return;
    }
    if (!wasSyncingRef.current || !initiatedRef.current || !integration) return;
    if (integration.lastSyncStatus === "failed") {
      wasSyncingRef.current = false;
      initiatedRef.current = false;
      return;
    }
    if (
      integration.lastSyncStatus === "succeeded" &&
      integration.lastSyncedAt !== startedLastSyncedAtRef.current
    ) {
      wasSyncingRef.current = false;
      initiatedRef.current = false;
      void onSyncCompletedRef.current?.();
    }
  }, [integration, syncing]);

  if (!integration) return null;

  async function startSync() {
    if (requestRef.current || syncing || !integration) return;
    requestRef.current = true;
    initiatedRef.current = true;
    startedLastSyncedAtRef.current = integration.lastSyncedAt;
    setRequestFailed(false);
    setRequesting(true);
    try {
      await api.syncNow(integration.id);
    } catch {
      initiatedRef.current = false;
      wasSyncingRef.current = false;
      setRequestFailed(true);
    } finally {
      requestRef.current = false;
      setRequesting(false);
    }
  }

  async function updateAutoSync(interval: AutoSyncIntervalMinutes) {
    if (!integration || settingsUpdating) return;
    setSettingsUpdating(true);
    setSettingsFailed(false);
    try {
      await api.updateSyncSettings(integration.id, interval);
    } catch {
      setSettingsFailed(true);
    } finally {
      setSettingsUpdating(false);
    }
  }

  const failed =
    requestFailed || (!syncing && integration.lastSyncStatus === "failed");
  return (
    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
      {connected.length > 1 && !integrationId ? (
        <label className="sr-only" htmlFor="costops-sync-integration">
          Integration to sync
        </label>
      ) : null}
      {connected.length > 1 && !integrationId ? (
        <select
          id="costops-sync-integration"
          value={resolvedId}
          onChange={(event) => {
            setSelectedId(event.target.value);
            setRequestFailed(false);
          }}
          className="border-foreground/15 bg-background text-foreground hover:border-accent/50 h-9 max-w-40 rounded-lg border px-3 text-xs font-medium"
        >
          {connected.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      ) : null}
      <SyncStatus
        syncing={syncing}
        activeSync={activeSync}
        failed={failed}
        lastSyncedAt={integration.lastSyncedAt}
        now={now}
        latestRun={latestRun}
      />
      <button
        type="button"
        disabled={syncing}
        onClick={() => void startSync()}
        className="border-foreground/15 text-foreground hover:border-accent/50 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium disabled:opacity-50"
      >
        <RefreshCw
          size={13}
          className={syncing ? "animate-spin" : ""}
          aria-hidden="true"
        />
        {syncing ? "Syncing..." : failed ? "Retry" : "Sync now"}
      </button>
      <CostOpsAutoSyncSelect
        compact
        value={integration.autoSyncIntervalMinutes}
        disabled={settingsUpdating}
        onChange={(interval) => void updateAutoSync(interval)}
      />
      {settingsFailed ? (
        <span
          role="alert"
          className="text-xs text-amber-600 dark:text-amber-300"
        >
          Auto-sync update failed
        </span>
      ) : null}
    </div>
  );
}

function SyncStatus({
  syncing,
  activeSync,
  failed,
  lastSyncedAt,
  now,
  latestRun,
}: {
  syncing: boolean;
  activeSync?: import("../types").SyncRun;
  failed: boolean;
  lastSyncedAt: string | null;
  now: number;
  latestRun?: import("../types").SyncRun;
}) {
  if (syncing) {
    const current = activeSync?.progressCurrent ?? 0;
    const total = activeSync?.progressTotal ?? 5;
    const percent = Math.min(
      100,
      Math.round((current / Math.max(total, 1)) * 100),
    );
    return (
      <span
        className="border-foreground/15 text-muted-foreground inline-flex h-9 min-w-44 items-center gap-2 rounded-full border px-3 text-xs font-medium"
        title={activeSync?.progressMessage ?? "Starting sync"}
      >
        <RefreshCw
          size={12}
          className="text-accent animate-spin"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate">
          {activeSync?.progressMessage ?? "Starting sync"}
        </span>
        <span className="font-mono">{percent}%</span>
      </span>
    );
  }
  if (failed)
    return (
      <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 text-xs font-medium text-amber-600 dark:text-amber-300">
        <AlertTriangle size={12} aria-hidden="true" /> Sync failed
      </span>
    );
  if (latestRun?.status === "succeeded" && latestRun.warningCount > 0)
    return (
      <span
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 text-xs font-medium text-amber-600 dark:text-amber-300"
        title={latestRun.warnings
          .map((warning) => warning.message)
          .filter(Boolean)
          .join("\n")}
      >
        <AlertTriangle size={12} aria-hidden="true" /> Synced with{" "}
        {latestRun.warningCount} warning
        {latestRun.warningCount === 1 ? "" : "s"}
      </span>
    );
  return (
    <span className="border-foreground/15 text-muted-foreground inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium whitespace-nowrap">
      <span className="bg-success h-1.5 w-1.5 rounded-full" />
      {lastSyncedAt
        ? `Synced ${formatRelativeTime(lastSyncedAt, now)}`
        : "Not synced"}
    </span>
  );
}
