"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Edit2,
  Filter,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Zap,
  X,
} from "lucide-react";
import type {
  CoreAWSConnectionSetup,
  CoreConnectionActivity,
  CoreConnectionCapability,
  CoreConnectionScope,
  CoreConnectionSyncRun,
  CoreIntegrationCapability,
  CoreIntegrationConnection,
  IntegrationConnectionStatus,
} from "@/lib/core/api";
import {
  addConnectionScopeAction,
  disableConnectionAction,
  enableConnectionAction,
  removeConnectionAction,
  removeConnectionScopeAction,
  setConnectionCapabilitiesAction,
  triggerConnectionSyncAction,
  updateConnectionAction,
  verifyAwsConnectionAction,
} from "@/app/dashboard/integrations/actions";
import { EmptyState, Section, StatusBadge } from "./primitives";
import { AwsSetupPanel } from "./integrations/aws-setup-panel";
import { SyncProgress } from "./integrations/sync-progress";
import { useSyncRunPolling } from "./integrations/use-sync-run-polling";
import { cn } from "@/lib/utils";

function statusTone(
  status: IntegrationConnectionStatus,
): "success" | "neutral" | "warning" {
  if (status === "connected") return "success";
  if (status === "error" || status === "degraded") return "warning";
  return "neutral";
}

const REMOVABLE_STATUSES = new Set<IntegrationConnectionStatus>([
  "draft",
  "disabled",
]);

const SYNCABLE_STATUSES = new Set<IntegrationConnectionStatus>([
  "connected",
  "degraded",
]);

const ACTIVITY_LABELS: Record<CoreConnectionActivity["activity_type"], string> =
  {
    created: "Connection created",
    status_changed: "Status changed",
    capabilities_changed: "Capabilities changed",
    scopes_changed: "Scopes changed",
    sync_triggered: "Sync triggered",
    sync_finished: "Sync finished",
  };

function formatActivityDetail(detail: Record<string, unknown>): string | null {
  const entries = Object.entries(detail);
  if (!entries.length) return null;
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(", ");
}

type TabType = "sync" | "capabilities" | "scopes" | "activity";

export function ConnectionDetailClient({
  connection: initialConnection,
  capabilities,
  initialConnectionCapabilities,
  initialScopes,
  awsSetup,
  initialSyncRuns,
  initialActivity,
}: {
  connection: CoreIntegrationConnection;
  capabilities: CoreIntegrationCapability[];
  initialConnectionCapabilities: CoreConnectionCapability[];
  initialScopes: CoreConnectionScope[];
  awsSetup: CoreAWSConnectionSetup;
  initialSyncRuns: CoreConnectionSyncRun[];
  initialActivity: CoreConnectionActivity[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("sync");
  const [connection, setConnection] = useState(initialConnection);
  const [connectionCapabilities, setConnectionCapabilities] = useState(
    initialConnectionCapabilities,
  );
  const [scopes, setScopes] = useState(initialScopes);
  const [syncRuns, setSyncRuns] = useState(initialSyncRuns);
  const [activity] = useState(initialActivity);
  const [selectedCapabilityIds, setSelectedCapabilityIds] = useState<
    Set<string>
  >(() => new Set(initialConnectionCapabilities.map((c) => c.capability_id)));
  const [editDialog, setEditDialog] = useState(false);
  const [verifyDialog, setVerifyDialog] = useState(false);
  const [removeDialog, setRemoveDialog] = useState(false);
  const [scopeDialog, setScopeDialog] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const runningRun = syncRuns.find((run) => run.status === "running") ?? null;
  const [polledRun] = useSyncRunPolling(connection.id, runningRun);
  // Merge fresh polled progress into the history list during render (React's documented
  // "adjusting state" pattern) rather than in an effect — guarded on object identity, since
  // each poll produces a new `polledRun` object only when the backend actually returns one.
  const [mergedPolledRun, setMergedPolledRun] =
    useState<CoreConnectionSyncRun | null>(null);
  if (polledRun && polledRun !== mergedPolledRun) {
    setMergedPolledRun(polledRun);
    setSyncRuns((current) =>
      current.map((run) => (run.id === polledRun.id ? polledRun : run)),
    );
  }

  const capabilitiesDirty = useMemo(() => {
    const current = new Set(connectionCapabilities.map((c) => c.capability_id));
    if (current.size !== selectedCapabilityIds.size) return true;
    for (const id of selectedCapabilityIds) if (!current.has(id)) return true;
    return false;
  }, [connectionCapabilities, selectedCapabilityIds]);

  function toggleCapability(id: string) {
    setSelectedCapabilityIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function saveCapabilities() {
    setError("");
    startTransition(async () => {
      const result = await setConnectionCapabilitiesAction(
        connection.id,
        Array.from(selectedCapabilityIds),
      );
      if (result.error) return setError(result.error);
      if (result.data) setConnectionCapabilities(result.data);
    });
  }

  function disable() {
    setError("");
    startTransition(async () => {
      const result = await disableConnectionAction(connection.id);
      if (result.error) return setError(result.error);
      if (result.data) setConnection(result.data);
    });
  }

  function enable() {
    setError("");
    startTransition(async () => {
      const result = await enableConnectionAction(connection.id);
      if (result.error) return setError(result.error);
      if (result.data) setConnection(result.data);
    });
  }

  function verifyAws(awsAccountId: string, onSuccess?: () => void) {
    setError("");
    startTransition(async () => {
      const result = await verifyAwsConnectionAction(
        connection.id,
        awsAccountId,
      );
      if (result.error) return setError(result.error);
      if (result.data) {
        setConnection(result.data.connection);
        if (result.data.sync_run) {
          setSyncRuns((current) => [result.data!.sync_run!, ...current]);
        }
        if (onSuccess) onSuccess();
      }
    });
  }

  function triggerSync() {
    setError("");
    startTransition(async () => {
      const result = await triggerConnectionSyncAction(connection.id);
      if (result.error) return setError(result.error);
      if (result.data) setSyncRuns((current) => [result.data!, ...current]);
    });
  }

  function remove() {
    setError("");
    startTransition(async () => {
      const result = await removeConnectionAction(connection.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard/integrations");
    });
  }

  function removeScope(scopeType: string, scopeKey: string) {
    setError("");
    startTransition(async () => {
      const result = await removeConnectionScopeAction(
        connection.id,
        scopeType,
        scopeKey,
      );
      if (result.error) return setError(result.error);
      setScopes((current) =>
        current.filter(
          (scope) =>
            !(scope.scope_type === scopeType && scope.scope_key === scopeKey),
        ),
      );
    });
  }

  const canRemove = REMOVABLE_STATUSES.has(connection.status);
  const hasRunningSync = syncRuns.some((run) => run.status === "running");
  const canSync = SYNCABLE_STATUSES.has(connection.status) && !hasRunningSync;

  const tabs: { id: TabType; label: string; icon: typeof RefreshCw; count?: number }[] = [
    {
      id: "sync",
      label: "Sync History",
      icon: RefreshCw,
      count: syncRuns.length,
    },
    {
      id: "capabilities",
      label: "Capabilities",
      icon: Zap,
      count: selectedCapabilityIds.size,
    },
    {
      id: "scopes",
      label: "Scopes",
      icon: Filter,
      count: scopes.length,
    },
    {
      id: "activity",
      label: "Activity",
      icon: Activity,
      count: activity.length,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Connection Header Bar */}
      <div className="border-foreground/10 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={statusTone(connection.status)}>
            {connection.status}
          </StatusBadge>
          {connection.external_reference ? (
            <span className="text-muted-foreground font-mono text-xs">
              Account / Ref: {connection.external_reference}
            </span>
          ) : null}
          {connection.last_verified_at ? (
            <span className="text-muted-foreground text-xs">
              Verified: {new Date(connection.last_verified_at).toLocaleDateString()}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEditDialog(true)}
            disabled={pending}
            className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
          >
            <Edit2 size={14} />
            Modify
          </button>
          {awsSetup.cloudformation_supported ? (
            <button
              onClick={() => setVerifyDialog(true)}
              disabled={pending || connection.status === "disabled"}
              className="bg-accent/10 text-accent hover:bg-accent/20 border-accent/30 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              <ShieldCheck size={14} />
              Re-verify
            </button>
          ) : null}
          {connection.status === "disabled" ? (
            <button
              onClick={enable}
              disabled={pending}
              className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
            >
              Enable
            </button>
          ) : (
            <button
              onClick={disable}
              disabled={pending}
              className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
            >
              Disable
            </button>
          )}
          <button
            onClick={() => setRemoveDialog(true)}
            disabled={pending || !canRemove}
            title={
              canRemove
                ? undefined
                : "Disable the connection before removing it"
            }
            className="rounded-lg border border-red-600/30 px-3 py-2 text-sm text-red-600 disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {/* Beautiful Navigation Tabs */}
      <div className="border-foreground/10 border-b">
        <nav className="-mb-px flex gap-1 sm:gap-2 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "border-accent text-accent font-semibold"
                    : "border-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-mono font-normal",
                      active
                        ? "bg-accent/15 text-accent"
                        : "bg-foreground/5 text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {/* Sync Tab */}
        {activeTab === "sync" && (
          <Section
            title="Sync Runs"
            action={
              <button
                onClick={triggerSync}
                disabled={pending || !canSync}
                title={
                  canSync
                    ? undefined
                    : hasRunningSync
                      ? "A sync is already running"
                      : "Connection must be connected or degraded to sync"
                }
                className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-40"
              >
                <RefreshCw size={13} />
                Sync now
              </button>
            }
          >
            {syncRuns.length ? (
              <div className="flex flex-col gap-4">
                {polledRun && polledRun.status === "running" ? (
                  <div className="border-foreground/10 bg-foreground/[0.015] rounded-xl border p-4">
                    <SyncProgress syncRun={polledRun} />
                  </div>
                ) : null}
                <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
                  {syncRuns
                    .filter(
                      (run) =>
                        run.id !== polledRun?.id || run.status !== "running",
                    )
                    .map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center justify-between gap-3 p-4 text-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              status={
                                run.status === "succeeded"
                                  ? "success"
                                  : run.status === "failed"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {run.status}
                            </StatusBadge>
                            <span className="text-muted-foreground text-xs">
                              {new Date(run.created_at).toLocaleString()}
                            </span>
                            {run.total_stages > 0 ? (
                              <span className="text-muted-foreground text-xs">
                                {run.completed_stages}/{run.total_stages}{" "}
                                operations
                              </span>
                            ) : null}
                          </div>
                          {run.error_message ? (
                            <p className="text-muted-foreground mt-1.5 text-xs">
                              {run.error_message}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No syncs yet"
                description="Sync pulls the latest data for this connection. Trigger one to start the history."
              />
            )}
          </Section>
        )}

        {/* Capabilities Tab */}
        {activeTab === "capabilities" && (
          <Section
            title="Assigned Capabilities"
            action={
              capabilitiesDirty ? (
                <button
                  onClick={saveCapabilities}
                  disabled={pending}
                  className="bg-accent text-accent-foreground rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                >
                  {pending ? "Saving…" : "Save changes"}
                </button>
              ) : undefined
            }
          >
            {capabilities.length ? (
              <div className="space-y-2">
                {capabilities.map((capability) => {
                  const selected = selectedCapabilityIds.has(capability.id);
                  return (
                    <label
                      key={capability.id}
                      className="border-foreground/10 hover:bg-foreground/[0.02] flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={capability.status !== "active" && !selected}
                        onChange={() => toggleCapability(capability.id)}
                        className="rounded border-foreground/20 text-accent focus:ring-accent"
                      />
                      <span className="flex-1">
                        <span className="font-medium">{capability.name}</span>
                        <span className="text-muted-foreground ml-2 font-mono text-xs">
                          {capability.slug}
                        </span>
                      </span>
                      {selected ? (
                        <CheckCircle2 size={16} className="text-success shrink-0" />
                      ) : null}
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                This integration has no capabilities defined yet.
              </p>
            )}
          </Section>
        )}

        {/* Scopes Tab */}
        {activeTab === "scopes" && (
          <Section
            title="Configured Scopes"
            action={
              <button
                onClick={() => setScopeDialog(true)}
                className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium"
              >
                <Plus size={13} />
                Add scope
              </button>
            }
          >
            {scopes.length ? (
              <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
                {scopes.map((scope) => (
                  <div
                    key={`${scope.scope_type}/${scope.scope_key}`}
                    className="flex items-center justify-between gap-3 p-4 text-sm"
                  >
                    <div>
                      <span className="text-muted-foreground text-xs tracking-wider uppercase">
                        {scope.scope_type}
                      </span>
                      <p className="mt-0.5 font-mono">{scope.scope_key}</p>
                    </div>
                    <button
                      onClick={() =>
                        removeScope(scope.scope_type, scope.scope_key)
                      }
                      disabled={pending}
                      aria-label={`Remove scope ${scope.scope_type}/${scope.scope_key}`}
                      className="text-muted-foreground p-1.5 hover:text-red-500 disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No scopes configured"
                description="Scope this connection to specific regions, accounts, or projects."
              />
            )}
          </Section>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <Section title="Activity Logs">
            {activity.length ? (
              <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
                {activity.map((event) => {
                  const detail = formatActivityDetail(event.detail);
                  return (
                    <div
                      key={event.id}
                      className="flex items-start justify-between gap-3 p-4 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {ACTIVITY_LABELS[event.activity_type]}
                        </p>
                        {detail ? (
                          <p className="text-muted-foreground mt-1 font-mono text-xs">
                            {detail}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No activity yet"
                description="Lifecycle events for this connection will show up here."
              />
            )}
          </Section>
        )}
      </div>

      {/* Modify Connection Dialog */}
      {editDialog ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
            className="bg-background border-foreground/15 w-full max-w-lg rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 id="edit-title" className="text-lg font-semibold">
                  Modify Connection
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Update connection details or CloudFormation setup configuration.
                </p>
              </div>
              <button
                onClick={() => setEditDialog(false)}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setError("");
                const data = new FormData(event.currentTarget);
                const name = String(data.get("name") ?? "").trim();
                const externalReference = String(
                  data.get("external_reference") ?? "",
                ).trim();
                startTransition(async () => {
                  const result = await updateConnectionAction(connection.id, {
                    name: name || undefined,
                    external_reference: externalReference || null,
                  });
                  if (result.error) return setError(result.error);
                  if (result.data) {
                    setConnection(result.data);
                    setEditDialog(false);
                  }
                });
              }}
              className="mt-5 space-y-4"
            >
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Connection Name</span>
                <input
                  name="name"
                  required
                  defaultValue={connection.name}
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 text-sm outline-none"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">
                  AWS Account ID / Reference
                </span>
                <input
                  name="external_reference"
                  defaultValue={connection.external_reference ?? ""}
                  placeholder="12-digit AWS account ID"
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono text-sm outline-none"
                />
              </label>

              {awsSetup.cloudformation_supported ? (
                <div className="pt-2">
                  <span className="text-muted-foreground mb-2 block text-xs font-semibold uppercase tracking-wider">
                    CloudFormation Stack Setup
                  </span>
                  <AwsSetupPanel awsSetup={awsSetup} />
                </div>
              ) : null}

              {error ? (
                <p role="alert" className="text-sm text-red-500">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                {awsSetup.cloudformation_supported ? (
                  <button
                    type="button"
                    disabled={pending || connection.status === "disabled"}
                    onClick={() => {
                      setEditDialog(false);
                      setVerifyDialog(true);
                    }}
                    className="bg-accent/10 text-accent hover:bg-accent/20 border-accent/30 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    <ShieldCheck size={14} />
                    Verify Connection
                  </button>
                ) : <span />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDialog(false)}
                    className="border-foreground/15 rounded-lg border px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={pending}
                    className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {pending ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Re-verify Connection Dialog */}
      {verifyDialog ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="verify-dialog-title"
            className="bg-background border-foreground/15 w-full max-w-lg rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 id="verify-dialog-title" className="text-lg font-semibold">
                  Re-verify Connection
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  Assumes the cross-account IAM role and confirms STS access.
                </p>
              </div>
              <button
                onClick={() => setVerifyDialog(false)}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>

            {awsSetup.cloudformation_supported ? (
              <div className="mt-4">
                <AwsSetupPanel
                  awsSetup={awsSetup}
                  footer={
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        const awsAccountId = String(
                          data.get("aws_account_id") ?? "",
                        ).trim();
                        verifyAws(awsAccountId, () => setVerifyDialog(false));
                      }}
                      className="space-y-4"
                    >
                      <label className="block text-sm">
                        <span className="mb-2 block font-medium">
                          AWS Account ID
                        </span>
                        <input
                          name="aws_account_id"
                          required
                          pattern="\d{12}"
                          title="12-digit AWS account ID"
                          placeholder="123456789012"
                          defaultValue={connection.external_reference ?? ""}
                          className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono text-sm outline-none"
                        />
                      </label>
                      {error ? (
                        <p role="alert" className="text-sm text-red-500">
                          {error}
                        </p>
                      ) : null}
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setVerifyDialog(false)}
                          className="border-foreground/15 rounded-lg border px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={pending}
                          className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                        >
                          {pending ? "Verifying…" : "Verify & Sync"}
                        </button>
                      </div>
                    </form>
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Remove Connection Dialog */}
      {removeDialog ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-title"
            className="bg-background border-foreground/15 w-full max-w-sm rounded-xl border p-6"
          >
            <h2 id="remove-title" className="font-semibold">
              Remove {connection.name}?
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              This permanently removes the connection and its capabilities and
              scopes.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setRemoveDialog(false)}
                className="border-foreground/15 rounded-lg border px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={pending}
                onClick={remove}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {pending ? "Removing…" : "Remove connection"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add Scope Dialog */}
      {scopeDialog ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="scope-title"
            className="bg-background border-foreground/15 w-full max-w-md rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <h2 id="scope-title" className="text-lg font-semibold">
                Add scope
              </h2>
              <button
                onClick={() => setScopeDialog(false)}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setError("");
                const data = new FormData(event.currentTarget);
                const scopeType = String(data.get("scope_type") ?? "").trim();
                const scopeKey = String(data.get("scope_key") ?? "").trim();
                startTransition(async () => {
                  const result = await addConnectionScopeAction(connection.id, {
                    scopeType,
                    scopeKey,
                    included: true,
                  });
                  if (result.error) return setError(result.error);
                  if (result.data) {
                    setScopes((current) => [...current, result.data!]);
                    setScopeDialog(false);
                  }
                });
              }}
              className="mt-6 space-y-5"
            >
              <label className="block text-sm">
                <span className="mb-2 block font-medium">Scope type</span>
                <input
                  name="scope_type"
                  required
                  placeholder="e.g. region, account, project"
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block font-medium">Scope key</span>
                <input
                  name="scope_key"
                  required
                  placeholder="e.g. us-east-1"
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                />
              </label>
              {error ? (
                <p role="alert" className="text-sm text-red-500">
                  {error}
                </p>
              ) : null}
              <button
                disabled={pending}
                className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {pending ? "Adding…" : "Add scope"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
