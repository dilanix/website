"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  AlertCircle,
  Ban,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import type {
  CoreSyncJob,
  CoreSyncJobAttempt,
  CoreSyncPolicy,
  CoreSyncRun,
  CoreSyncRunDetail,
  SyncJobAttemptOutcome,
  SyncJobStatus,
  SyncRunStatus,
} from "@/lib/core/api";
import {
  cancelSyncAction,
  getSyncJobAttemptsAction,
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
import { stageProgress } from "@/lib/sync/progress";
import { useSyncRunEvents } from "@/hooks/use-sync-run-events";
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

function attemptOutcomeTone(
  outcome: SyncJobAttemptOutcome,
): "success" | "neutral" | "warning" {
  if (outcome === "succeeded") return "success";
  if (outcome === "failed") return "warning";
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

function JobAttemptHistory({
  connectionId,
  syncRunId,
  syncJobId,
}: {
  connectionId: string;
  syncRunId: string;
  syncJobId: string;
}) {
  const [attempts, setAttempts] = useState<CoreSyncJobAttempt[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getSyncJobAttemptsAction(
        connectionId,
        syncRunId,
        syncJobId,
      );
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        return;
      }
      setAttempts(result.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [connectionId, syncRunId, syncJobId]);

  if (error) {
    return <p className="text-xs text-red-500">{error}</p>;
  }
  if (!attempts) {
    return (
      <div className="text-muted-foreground flex items-center gap-1.5 py-1 text-xs">
        <Loader2 size={11} className="animate-spin" />
        Loading attempt history…
      </div>
    );
  }
  if (attempts.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">No recorded attempts.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {attempts.map((attempt) => (
        <li
          key={attempt.id}
          className="border-foreground/10 bg-foreground/[0.02] flex flex-col gap-1 rounded-md border p-2 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono">attempt {attempt.attempt}</span>
            <StatusBadge status={attemptOutcomeTone(attempt.outcome)}>
              {attempt.outcome.replace("_", " ")}
            </StatusBadge>
            <span className="text-muted-foreground font-mono">
              {formatRelativeTime(attempt.finished_at)}
            </span>
          </div>
          {attempt.error_code || attempt.error_message ? (
            <p className="flex items-start gap-1.5 text-red-500/90">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span>
                {attempt.error_code ? (
                  <span className="font-medium">{attempt.error_code}: </span>
                ) : null}
                {attempt.error_message}
              </span>
            </p>
          ) : null}
          <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 font-mono">
            <span>read {attempt.records_read}</span>
            <span>created {attempt.records_created}</span>
            <span>updated {attempt.records_updated}</span>
            <span>deleted {attempt.records_deleted}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function JobRow({
  job,
  connectionId,
  syncRunId,
}: {
  job: CoreSyncJob;
  connectionId: string;
  syncRunId: string;
}) {
  const progress = stageProgress(job);
  const [showHistory, setShowHistory] = useState(false);
  return (
    <div className="border-foreground/10 bg-background flex flex-col gap-2 rounded-lg border p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={jobStatusTone(job.status)}>
            {job.status}
          </StatusBadge>
          <span className="font-mono">{job.dataset}</span>
          {job.collector_version || job.normalizer_version ? (
            <span
              className="border-foreground/10 text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]"
              title="Which version of the collector, and of its provider-field mapping, produced this job's data."
            >
              collector v{job.collector_version ?? "?"} · normalizer v
              {job.normalizer_version ?? "?"}
            </span>
          ) : null}
        </div>
        <span className="text-muted-foreground font-mono" title={job.target_id}>
          target {job.target_id.slice(0, 8)}…
        </span>
      </div>

      {progress && job.status === "running" ? (
        <div className="flex items-center gap-2">
          <div className="bg-foreground/10 h-1.5 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-accent h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <span className="text-muted-foreground shrink-0 font-mono">
            {progress.label}
          </span>
        </div>
      ) : null}

      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 font-mono">
        <span>read {job.records_read}</span>
        <span>created {job.records_created}</span>
        <span>updated {job.records_updated}</span>
        <span>deleted {job.records_deleted}</span>
        <span className="flex items-center gap-1.5">
          attempt {job.attempt}
          <button
            type="button"
            onClick={() => setShowHistory((current) => !current)}
            className="text-accent hover:underline"
          >
            {showHistory ? "hide history" : "history"}
          </button>
        </span>
      </div>

      {showHistory ? (
        <JobAttemptHistory
          connectionId={connectionId}
          syncRunId={syncRunId}
          syncJobId={job.id}
        />
      ) : null}

      {job.status === "running" && job.current_stage ? (
        <div
          className="text-muted-foreground truncate font-mono"
          title={job.current_stage}
        >
          last: {job.current_stage}
        </div>
      ) : null}

      {job.status === "running" && job.heartbeat_at ? (
        <div className="text-accent flex items-center gap-1.5 font-mono">
          <span className="bg-accent inline-block h-1.5 w-1.5 animate-pulse rounded-full" />
          <span>progress updated {formatRelativeTime(job.heartbeat_at)}</span>
        </div>
      ) : null}

      {job.status === "cancel_requested" ? (
        <div className="text-muted-foreground flex items-center gap-1.5 font-mono">
          <Loader2 size={12} className="animate-spin" />
          <span>cancellation requested — waiting for a safe point to stop</span>
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
  if (status === "running" || status === "cancel_requested") {
    return (
      <span className="border-accent/25 bg-accent/10 text-accent inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
        <Loader2 size={12} className="animate-spin" />
        {status === "cancel_requested" ? "cancelling" : "running"}
      </span>
    );
  }
  return <StatusBadge status={runStatusTone(status)}>{status}</StatusBadge>;
}

function CancelRunButton({
  status,
  pending,
  onCancel,
}: {
  status: SyncRunStatus;
  pending: boolean;
  onCancel: (event: React.MouseEvent) => void;
}) {
  if (status !== "queued" && status !== "running") return null;
  return (
    <button
      onClick={onCancel}
      disabled={pending}
      title="Cancel this sync"
      className="text-muted-foreground inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 hover:text-red-500 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Ban size={12} />
      )}
      Cancel
    </button>
  );
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
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [policies, setPolicies] = useState(initialPolicies);
  const [savingPolicyDataset, setSavingPolicyDataset] = useState<string | null>(
    null,
  );
  const [policyError, setPolicyError] = useState("");
  const [cancellingRunId, setCancellingRunId] = useState<string | null>(null);

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

  // Keeps the run list itself (status badges, duration, "Load more" totals)
  // fresh. Per-job progress for the *expanded* run is handled below by a live
  // SSE stream instead — see `useSyncRunEvents`.
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
      })();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hasActiveRun, connectionId]);

  const expandedRun = useMemo(
    () => runs.find((run) => run.id === expandedRunId) ?? null,
    [runs, expandedRunId],
  );
  const expandedRunActive = Boolean(
    expandedRun && ACTIVE_RUN_STATUSES.has(expandedRun.status),
  );

  // Persists every live frame — including the final one, sent just before the
  // stream's `done` event — directly into the same state the rest of the
  // panel already reads (`runs`, `jobsByRunId`). Doing this from the frame
  // callback itself, rather than mirroring a "latest frame" value from the
  // hook through a `useEffect`, is what makes the finished state stick: once
  // a run turns terminal, `expandedRunActive` below flips to `false` and the
  // stream tears down, so nothing would ever re-deliver that final frame for
  // an effect to react to later.
  const handleLiveFrame = useCallback((frame: CoreSyncRunDetail) => {
    setJobsByRunId((current) => ({ ...current, [frame.id]: frame.jobs }));
    setRuns((current) =>
      current.map((run) =>
        run.id === frame.id
          ? {
              ...run,
              status: frame.status,
              started_at: frame.started_at,
              finished_at: frame.finished_at,
            }
          : run,
      ),
    );
  }, []);

  // Live progress for the expanded run — same `SyncRunDetailRead` shape as
  // `GET .../syncs/{id}`, pushed roughly once a second while the run is in
  // flight instead of the 4s list-poll cadence above.
  const { failed: liveStreamFailed } = useSyncRunEvents(
    connectionId,
    expandedRunId,
    expandedRunActive,
    handleLiveFrame,
  );

  // Fallback only — if the live stream can't connect (e.g. a proxy blocking
  // SSE), poll the expanded run's job detail the same way the panel did
  // before the live stream existed, so progress still updates eventually.
  useEffect(() => {
    if (!expandedRunActive || !liveStreamFailed || !expandedRunId) return;
    const interval = setInterval(() => {
      void (async () => {
        const detail = await getSyncRunAction(connectionId, expandedRunId);
        if (detail.data) handleLiveFrame(detail.data);
      })();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [
    expandedRunActive,
    liveStreamFailed,
    expandedRunId,
    connectionId,
    handleLiveFrame,
  ]);

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
        setToast({ message: "Sync started", variant: "success" });
      }
    });
  }

  function cancelRun(runId: string, event: React.MouseEvent) {
    event.stopPropagation(); // don't also toggle the row's expand/collapse
    setCancellingRunId(runId);
    startTransition(async () => {
      const result = await cancelSyncAction(connectionId, runId);
      setCancellingRunId(null);
      if (result.error) {
        setToast({ message: result.error, variant: "error" });
        return;
      }
      if (result.data) {
        const cancelled = result.data;
        setRuns((current) =>
          current.map((run) => (run.id === cancelled.id ? cancelled : run)),
        );
        setToast({
          message:
            cancelled.status === "cancelled"
              ? "Sync cancelled"
              : "Cancellation requested",
          variant: "success",
        });
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
      if (result.data) handleLiveFrame(result.data);
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
                {/* A `div` (not `button`) — it needs to contain the Cancel
                    button below, and a `<button>` cannot nest another one. */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(run)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    toggleExpand(run);
                  }}
                  className="hover:bg-foreground/[0.02] flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left text-sm transition-colors"
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
                    <CancelRunButton
                      status={run.status}
                      pending={cancellingRunId === run.id}
                      onCancel={(event) => cancelRun(run.id, event)}
                    />
                  </div>
                </div>
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
                        <JobRow
                          key={job.id}
                          job={job}
                          connectionId={connectionId}
                          syncRunId={run.id}
                        />
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

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}
