"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import type {
  CoreSyncJob,
  CoreSyncPolicy,
  CoreSyncRun,
  SyncJobStatus,
  SyncRunStatus,
} from "@/lib/core/api";
import {
  getSyncRunAction,
  listSyncRunsAction,
  setSyncPolicyAction,
  startSyncAction,
} from "@/app/dashboard/integrations/actions";
import {
  eligibleSyncDatasets,
  SYNC_INTERVAL_PRESETS,
  SYNC_RUNS_PAGE_SIZE,
} from "@/lib/sync/datasets";
import { EmptyState, StatusBadge } from "./primitives";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ACTIVE_RUN_STATUSES = new Set<SyncRunStatus>([
  "queued",
  "running",
  "cancel_requested",
]);
const POLL_INTERVAL_MS = 4000;

function runStatusTone(
  status: SyncRunStatus,
): "success" | "neutral" | "warning" {
  if (status === "succeeded") return "success";
  if (status === "failed" || status === "partially_succeeded") return "warning";
  return "neutral";
}

function jobStatusTone(
  status: SyncJobStatus,
): "success" | "neutral" | "warning" {
  if (status === "succeeded") return "success";
  if (status === "failed") return "warning";
  return "neutral";
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

function formatDuration(
  startedAt: string | null,
  finishedAt: string | null,
): string | null {
  if (!startedAt || !finishedAt) return null;
  const totalSeconds = Math.max(
    0,
    Math.round(
      (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000,
    ),
  );
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/** For a future timestamp such as `SyncPolicy.next_run_at` — `formatRelativeTime`
 * above is "ago" phrasing only and would misread a future date as "just now". */
function formatNextRun(iso: string | null): string {
  if (!iso) return "not scheduled";
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 30_000) return "due now";
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return `in ${days}d`;
}

/** Merges a freshly-polled first page into the currently-held list, keeping any
 * additional pages loaded via "Load more" untouched (and de-duplicated). */
function mergeFirstPage(
  current: CoreSyncRun[],
  freshFirstPage: CoreSyncRun[],
): CoreSyncRun[] {
  const freshIds = new Set(freshFirstPage.map((run) => run.id));
  const rest = current
    .slice(freshFirstPage.length)
    .filter((run) => !freshIds.has(run.id));
  return [...freshFirstPage, ...rest];
}

function JobRow({ job }: { job: CoreSyncJob }) {
  return (
    <div className="border-foreground/10 bg-background flex flex-col gap-2 rounded-lg border p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={jobStatusTone(job.status)}>
            {job.status}
          </StatusBadge>
          <span className="font-mono">{job.dataset}</span>
        </div>
        <span className="text-muted-foreground font-mono" title={job.target_id}>
          target {job.target_id.slice(0, 8)}…
        </span>
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 font-mono">
        <span>read {job.records_read}</span>
        <span>created {job.records_created}</span>
        <span>updated {job.records_updated}</span>
        <span>deleted {job.records_deleted}</span>
        {job.attempt > 1 ? <span>attempt {job.attempt}</span> : null}
      </div>
      {job.status === "running" && job.heartbeat_at ? (
        <div className="text-accent flex items-center gap-1.5 font-mono">
          <span className="bg-accent inline-block h-1.5 w-1.5 animate-pulse rounded-full" />
          <span>progress updated {formatRelativeTime(job.heartbeat_at)}</span>
        </div>
      ) : null}
      {job.status === "failed" && job.error_message ? (
        <p className="flex items-start gap-1.5 text-red-500/90">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>
            {job.error_code ? (
              <span className="font-medium">{job.error_code}: </span>
            ) : null}
            {job.error_message}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function RunStatusIndicator({ status }: { status: SyncRunStatus }) {
  if (status === "running") {
    return (
      <span className="border-accent/25 bg-accent/10 text-accent inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
        <Loader2 size={12} className="animate-spin" />
        running
      </span>
    );
  }
  return <StatusBadge status={runStatusTone(status)}>{status}</StatusBadge>;
}

export function SyncPanel({
  connectionId,
  enabledCapabilitySlugs,
  initialRuns,
  initialTotal,
  initialPolicies,
}: {
  connectionId: string;
  enabledCapabilitySlugs: string[];
  initialRuns: CoreSyncRun[];
  initialTotal: number;
  initialPolicies: CoreSyncPolicy[];
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [total, setTotal] = useState(initialTotal);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [jobsByRunId, setJobsByRunId] = useState<Record<string, CoreSyncJob[]>>(
    {},
  );
  const [loadingJobsForRunId, setLoadingJobsForRunId] = useState<string | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(
    new Set(),
  );
  const [dialogError, setDialogError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [policies, setPolicies] = useState(initialPolicies);
  const [savingPolicyDataset, setSavingPolicyDataset] = useState<string | null>(
    null,
  );
  const [policyError, setPolicyError] = useState("");

  const eligibleDatasets = useMemo(
    () => eligibleSyncDatasets(enabledCapabilitySlugs),
    [enabledCapabilitySlugs],
  );
  const canSync = eligibleDatasets.length > 0;

  // Connection-wide policies only (`target_id: null`) — matching "Sync now",
  // which fans a manual run out across every verified target rather than asking
  // which one, automatic sync applies the same way per dataset.
  const policyByDataset = useMemo(() => {
    const map = new Map<string, CoreSyncPolicy>();
    for (const policy of policies) {
      if (policy.target_id === null) map.set(policy.dataset, policy);
    }
    return map;
  }, [policies]);

  function applyPolicy(
    datasetSlug: string,
    patch: { enabled?: boolean; intervalSeconds?: number },
  ) {
    const existing = policyByDataset.get(datasetSlug);
    const enabled = patch.enabled ?? existing?.enabled ?? false;
    const intervalSeconds =
      patch.intervalSeconds ??
      existing?.interval_seconds ??
      SYNC_INTERVAL_PRESETS[0].seconds;
    setPolicyError("");
    setSavingPolicyDataset(datasetSlug);
    startTransition(async () => {
      const result = await setSyncPolicyAction(connectionId, {
        dataset: datasetSlug,
        enabled,
        interval_seconds: intervalSeconds,
      });
      setSavingPolicyDataset(null);
      if (result.error) {
        setPolicyError(result.error);
        return;
      }
      if (result.data) {
        setPolicies((current) => [
          ...current.filter(
            (policy) =>
              !(policy.dataset === datasetSlug && policy.target_id === null),
          ),
          result.data!,
        ]);
      }
    });
  }

  const hasActiveRun = runs
    .slice(0, SYNC_RUNS_PAGE_SIZE)
    .some((run) => ACTIVE_RUN_STATUSES.has(run.status));

  useEffect(() => {
    if (!hasActiveRun) return;
    const interval = setInterval(() => {
      void (async () => {
        const result = await listSyncRunsAction(connectionId, {
          limit: SYNC_RUNS_PAGE_SIZE,
          offset: 0,
        });
        if (result.data) {
          setTotal(result.data.total);
          setRuns((current) => mergeFirstPage(current, result.data!.items));
        }
        // Also refresh the expanded run's own job rows while it's active — this
        // is what makes progress (records read/created/updated/deleted,
        // "progress updated Ns ago") exact and continuously updating rather than
        // only reflecting the run's start/done state.
        const expandedRun = result.data?.items.find(
          (run) => run.id === expandedRunId,
        );
        if (expandedRun && ACTIVE_RUN_STATUSES.has(expandedRun.status)) {
          const detail = await getSyncRunAction(connectionId, expandedRun.id);
          if (detail.data) {
            setJobsByRunId((current) => ({
              ...current,
              [expandedRun.id]: detail.data!.jobs,
            }));
          }
        }
      })();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hasActiveRun, connectionId, expandedRunId]);

  function openDialog() {
    setDialogError("");
    setSelectedDatasets(
      new Set(eligibleDatasets.length === 1 ? [eligibleDatasets[0].slug] : []),
    );
    setDialogOpen(true);
  }

  function toggleDataset(slug: string) {
    setSelectedDatasets((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function submitStartSync() {
    setDialogError("");
    startTransition(async () => {
      const result = await startSyncAction(
        connectionId,
        Array.from(selectedDatasets),
      );
      if (result.error) {
        setDialogError(result.error);
        return;
      }
      if (result.data) {
        setRuns((current) => [result.data!, ...current]);
        setTotal((current) => current + 1);
        setDialogOpen(false);
        setToastMessage("Sync started");
      }
    });
  }

  function toggleExpand(run: CoreSyncRun) {
    if (expandedRunId === run.id) {
      setExpandedRunId(null);
      return;
    }
    setExpandedRunId(run.id);
    if (jobsByRunId[run.id]) return;
    setLoadingJobsForRunId(run.id);
    startTransition(async () => {
      const result = await getSyncRunAction(connectionId, run.id);
      setLoadingJobsForRunId(null);
      if (result.data) {
        setJobsByRunId((current) => ({
          ...current,
          [run.id]: result.data!.jobs,
        }));
      }
    });
  }

  function loadMore() {
    setLoadingMore(true);
    startTransition(async () => {
      const result = await listSyncRunsAction(connectionId, {
        limit: SYNC_RUNS_PAGE_SIZE,
        offset: runs.length,
      });
      setLoadingMore(false);
      if (result.data) {
        setRuns((current) => [...current, ...result.data!.items]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {canSync ? (
        <div className="border-foreground/10 flex flex-col gap-3 rounded-xl border p-4">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <Clock size={14} className="text-muted-foreground" />
              Automatic sync
            </h3>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              Keep a dataset fresh on a schedule instead of syncing it by hand
              every time.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {eligibleDatasets.map((dataset) => {
              const policy = policyByDataset.get(dataset.slug);
              const enabled = policy?.enabled ?? false;
              const intervalSeconds =
                policy?.interval_seconds ?? SYNC_INTERVAL_PRESETS[0].seconds;
              const saving = savingPolicyDataset === dataset.slug;
              return (
                <div
                  key={dataset.slug}
                  className="border-foreground/10 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={saving}
                      onChange={(event) =>
                        applyPolicy(dataset.slug, {
                          enabled: event.target.checked,
                        })
                      }
                      className="border-foreground/20 text-accent focus:ring-accent rounded disabled:opacity-50"
                    />
                    <span className="min-w-0">
                      <span className="font-medium">{dataset.label}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-xs">
                        {dataset.slug}
                      </span>
                    </span>
                  </label>
                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      value={intervalSeconds}
                      disabled={!enabled || saving}
                      onChange={(event) =>
                        applyPolicy(dataset.slug, {
                          intervalSeconds: Number(event.target.value),
                        })
                      }
                      className="border-foreground/15 bg-background h-8 rounded-lg border px-2 text-xs disabled:opacity-50"
                    >
                      {SYNC_INTERVAL_PRESETS.map((preset) => (
                        <option key={preset.seconds} value={preset.seconds}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    {saving ? (
                      <Loader2
                        size={13}
                        className="text-muted-foreground animate-spin"
                      />
                    ) : enabled ? (
                      <span
                        className="text-muted-foreground font-mono text-xs whitespace-nowrap"
                        title={policy?.next_run_at ?? undefined}
                      >
                        next: {formatNextRun(policy?.next_run_at ?? null)}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          {policyError ? (
            <p role="alert" className="text-sm text-red-500">
              {policyError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground max-w-md text-sm leading-6">
          Start a manual sync to pull the latest data for this connection.
          Datasets require a matching capability to be enabled first.
        </p>
        <button
          onClick={openDialog}
          disabled={!canSync}
          title={
            canSync
              ? undefined
              : "Enable a capability such as Inventory Read before syncing."
          }
          className="bg-accent text-accent-foreground inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw size={14} />
          Sync now
        </button>
      </div>

      {runs.length === 0 ? (
        <EmptyState
          title="No syncs yet"
          description="Run a manual sync to see history and job status here."
          actions={
            canSync ? (
              <button
                onClick={openDialog}
                className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
              >
                <RefreshCw size={14} />
                Sync now
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
          {runs.map((run) => {
            const expanded = expandedRunId === run.id;
            const duration = formatDuration(run.started_at, run.finished_at);
            return (
              <div key={run.id}>
                <button
                  onClick={() => toggleExpand(run)}
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
                    <RunStatusIndicator status={run.status} />
                    <span className="text-muted-foreground text-xs capitalize">
                      {run.trigger}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex shrink-0 items-center gap-4 text-xs">
                    {duration ? (
                      <span className="font-mono">{duration}</span>
                    ) : null}
                    <span>{formatRelativeTime(run.created_at)}</span>
                  </div>
                </button>
                {expanded ? (
                  <div className="border-foreground/10 bg-foreground/[0.015] flex flex-col gap-2 border-t p-4">
                    {loadingJobsForRunId === run.id ? (
                      <div className="flex justify-center py-2">
                        <Loader2
                          size={16}
                          className="text-muted-foreground animate-spin"
                        />
                      </div>
                    ) : (
                      (jobsByRunId[run.id] ?? []).map((job) => (
                        <JobRow key={job.id} job={job} />
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {runs.length < total ? (
        <button
          onClick={loadMore}
          disabled={pending || loadingMore}
          className="border-foreground/15 hover:bg-foreground/5 self-center rounded-lg border px-4 py-2 text-xs font-medium disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}

      {dialogOpen ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-sync-title"
            className="bg-background border-foreground/15 w-full max-w-md rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 id="start-sync-title" className="text-lg font-semibold">
                  Start sync
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Choose which datasets to sync now.
                </p>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {eligibleDatasets.map((dataset) => {
                const selected = selectedDatasets.has(dataset.slug);
                return (
                  <label
                    key={dataset.slug}
                    className="border-foreground/10 hover:bg-foreground/[0.02] flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleDataset(dataset.slug)}
                      className="border-foreground/20 text-accent focus:ring-accent rounded"
                    />
                    <span className="flex-1">
                      <span className="font-medium">{dataset.label}</span>
                      <span className="text-muted-foreground ml-2 font-mono text-xs">
                        {dataset.slug}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            {dialogError ? (
              <p role="alert" className="mt-4 text-sm text-red-500">
                {dialogError}
              </p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="border-foreground/15 rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitStartSync}
                disabled={pending || selectedDatasets.size === 0}
                className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {pending ? "Starting…" : "Start sync"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastMessage ? (
        <Toast
          message={toastMessage}
          variant="success"
          onDismiss={() => setToastMessage(null)}
        />
      ) : null}
    </div>
  );
}
