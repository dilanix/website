"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Edit2,
  Gauge,
  Plus,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import type {
  CoreAWSConnectionSetup,
  CoreConnectionCapability,
  CoreConnectionScope,
  CoreIntegrationCapability,
  CoreIntegrationConnection,
  CoreIntegrationTarget,
  CoreSyncPolicy,
  CoreSyncRun,
  IntegrationConnectionStatus,
} from "@/lib/core/api";
import {
  addConnectionScopeAction,
  disableConnectionAction,
  enableConnectionAction,
  purgeConnectionAction,
  removeConnectionAction,
  removeConnectionScopeAction,
  setConnectionCapabilitiesAction,
  updateConnectionAction,
  verifyAwsConnectionAction,
} from "@/app/dashboard/integrations/actions";
import { EmptyState, Section, StatusBadge } from "./primitives";
import { AwsSetupPanel } from "./integrations/aws-setup-panel";
import { SyncPanel } from "./sync-panel";
import { TargetsPanel } from "./targets-panel";
import { cn } from "@/lib/utils";

function statusTone(
  status: IntegrationConnectionStatus,
): "success" | "neutral" | "warning" {
  if (status === "connected") return "success";
  if (status === "error") return "warning";
  return "neutral";
}

const REMOVABLE_STATUSES = new Set<IntegrationConnectionStatus>([
  "draft",
  "disabled",
]);

export type ConnectionDetailTab =
  "overview" | "access" | "activity" | "settings";

export function ConnectionDetailClient({
  connection: initialConnection,
  integrationName,
  initialTab,
  capabilities,
  initialConnectionCapabilities,
  initialScopes,
  awsSetup,
  initialTargets,
  initialSyncRuns,
  initialSyncTotal,
  initialSyncPolicies,
}: {
  connection: CoreIntegrationConnection;
  integrationName: string;
  initialTab: ConnectionDetailTab;
  capabilities: CoreIntegrationCapability[];
  initialConnectionCapabilities: CoreConnectionCapability[];
  initialScopes: CoreConnectionScope[];
  awsSetup: CoreAWSConnectionSetup;
  initialTargets: CoreIntegrationTarget[];
  initialSyncRuns: CoreSyncRun[];
  initialSyncTotal: number;
  initialSyncPolicies: CoreSyncPolicy[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ConnectionDetailTab>(initialTab);
  const [connection, setConnection] = useState(initialConnection);
  const [connectionCapabilities, setConnectionCapabilities] = useState(
    initialConnectionCapabilities,
  );
  const [scopes, setScopes] = useState(initialScopes);
  const [selectedCapabilityIds, setSelectedCapabilityIds] = useState<
    Set<string>
  >(() => new Set(initialConnectionCapabilities.map((c) => c.capability_id)));
  const [editDialog, setEditDialog] = useState(false);
  const [verifyDialog, setVerifyDialog] = useState(false);
  const [removeDialog, setRemoveDialog] = useState(false);
  const [purgeDialog, setPurgeDialog] = useState(false);
  const [purgeConfirmName, setPurgeConfirmName] = useState("");
  const [scopeDialog, setScopeDialog] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function syncTabFromHistory() {
      const tab = new URL(window.location.href).searchParams.get("tab");
      if (
        tab === "overview" ||
        tab === "access" ||
        tab === "activity" ||
        tab === "settings"
      ) {
        setActiveTab(tab);
      } else {
        setActiveTab("overview");
      }
    }
    window.addEventListener("popstate", syncTabFromHistory);
    return () => window.removeEventListener("popstate", syncTabFromHistory);
  }, []);

  function selectTab(tab: ConnectionDetailTab) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.pushState(null, "", url);
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
    setNotice("");
    startTransition(async () => {
      const result = await setConnectionCapabilitiesAction(
        connection.id,
        Array.from(selectedCapabilityIds),
      );
      if (result.error) return setError(result.error);
      if (result.data) {
        setConnectionCapabilities(result.data);
        setNotice("Access capabilities saved.");
      }
    });
  }

  function disable() {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await disableConnectionAction(connection.id);
      if (result.error) return setError(result.error);
      if (result.data) {
        setConnection(result.data);
        setNotice("Connection disabled.");
      }
    });
  }

  function enable() {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await enableConnectionAction(connection.id);
      if (result.error) return setError(result.error);
      if (result.data) {
        setConnection(result.data);
        setNotice("Connection enabled.");
      }
    });
  }

  function verifyAws(awsAccountId: string, onSuccess?: () => void) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await verifyAwsConnectionAction(
        connection.id,
        awsAccountId,
      );
      if (result.error) return setError(result.error);
      if (result.data) {
        setConnection(result.data.connection);
        setNotice("Connection verified successfully.");
        if (onSuccess) onSuccess();
      }
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

  function purge() {
    setError("");
    startTransition(async () => {
      const result = await purgeConnectionAction(connection.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard/integrations");
    });
  }

  function removeScope(scopeType: string, scopeKey: string) {
    setError("");
    setNotice("");
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
      setNotice("Scope removed.");
    });
  }

  const canRemove = REMOVABLE_STATUSES.has(connection.status);

  const tabs: {
    id: ConnectionDetailTab;
    label: string;
    icon: typeof Gauge;
    count?: number;
  }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: Gauge,
    },
    {
      id: "access",
      label: "Access",
      icon: Shield,
      count: selectedCapabilityIds.size + scopes.length,
    },
    {
      id: "activity",
      label: "Sync & Activity",
      icon: Activity,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  const enabledCapabilitySlugs = useMemo(
    () =>
      connectionCapabilities
        .filter((row) => row.enabled)
        .map((row) => row.capability.slug),
    [connectionCapabilities],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="border-border-soft bg-card-strong/50 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 shadow-[0_16px_40px_var(--shadow-card)]">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            {integrationName}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
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
                Verified:{" "}
                {new Date(connection.last_verified_at).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>
        <button
          onClick={() => selectTab("settings")}
          className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"
        >
          <Settings size={14} />
          Manage connection
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="border-success/25 bg-success/8 text-success rounded-xl border px-4 py-3 text-sm"
        >
          {notice}
        </p>
      ) : null}

      <div className="border-foreground/10 border-b">
        <nav
          className="-mb-px flex gap-1 overflow-x-auto sm:gap-2"
          aria-label="Tabs"
          role="tablist"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`connection-tab-${tab.id}`}
                aria-controls={`connection-panel-${tab.id}`}
                aria-selected={active}
                onClick={() => selectTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-accent text-accent font-semibold"
                    : "text-muted-foreground hover:border-foreground/20 hover:text-foreground border-transparent",
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-xs font-normal",
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

      <div className="pt-2">
        {activeTab === "overview" ? (
          <div
            id="connection-panel-overview"
            role="tabpanel"
            aria-labelledby="connection-tab-overview"
            className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]"
          >
            <section className="border-border-soft rounded-2xl border p-5">
              <h2 className="text-base font-semibold">Connection details</h2>
              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs">Provider</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {integrationName}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Account / reference
                  </dt>
                  <dd className="mt-1 truncate font-mono text-sm">
                    {connection.external_reference ?? "Not verified yet"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Last verified
                  </dt>
                  <dd className="mt-1 text-sm">
                    {connection.last_verified_at
                      ? new Date(connection.last_verified_at).toLocaleString()
                      : "Never"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Last successful sync
                  </dt>
                  <dd className="mt-1 text-sm">
                    {connection.last_success_at
                      ? new Date(connection.last_success_at).toLocaleString()
                      : "Never"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="border-border-soft rounded-2xl border p-5">
              <h2 className="text-base font-semibold">Cloud data</h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                Resource inventory and provider spend live in shared multicloud
                workspaces.
              </p>
              <div className="mt-5 grid gap-2">
                <Link
                  href={
                    `/dashboard/resources?connection=${connection.id}` as Route
                  }
                  className="border-foreground/10 hover:border-accent/30 hover:bg-accent/5 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Boxes size={15} className="text-accent" /> Resources
                  </span>
                  <span className="text-muted-foreground text-xs">
                    View all
                  </span>
                </Link>
                <Link
                  href={`/dashboard/costs?connection=${connection.id}` as Route}
                  className="border-foreground/10 hover:border-accent/30 hover:bg-accent/5 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CircleDollarSign size={15} className="text-accent" /> Costs
                  </span>
                  <span className="text-muted-foreground text-xs">
                    View all
                  </span>
                </Link>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "access" ? (
          <div
            id="connection-panel-access"
            role="tabpanel"
            aria-labelledby="connection-tab-access"
            className="space-y-5"
          >
            <Section
              title="Capabilities"
              className="border-border-soft rounded-2xl border p-5"
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
                        className="border-foreground/10 hover:bg-foreground/[0.02] flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={capability.status !== "active" && !selected}
                          onChange={() => toggleCapability(capability.id)}
                          className="border-foreground/20 text-accent focus:ring-accent rounded"
                        />
                        <span className="flex-1">
                          <span className="font-medium">{capability.name}</span>
                          <span className="text-muted-foreground ml-2 font-mono text-xs">
                            {capability.slug}
                          </span>
                        </span>
                        {selected ? (
                          <CheckCircle2
                            size={16}
                            className="text-success shrink-0"
                          />
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

            <Section
              title="Scopes"
              className="border-border-soft rounded-2xl border p-5"
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
                  description="Limit this connection to specific regions or services. Provider accounts, subscriptions, and projects are resolved during verification."
                />
              )}
            </Section>

            <Section
              title="Provider identity"
              className="border-border-soft rounded-2xl border p-5"
            >
              <TargetsPanel
                connectionId={connection.id}
                initialTargets={initialTargets}
              />
            </Section>
          </div>
        ) : null}

        {activeTab === "activity" ? (
          <div
            id="connection-panel-activity"
            role="tabpanel"
            aria-labelledby="connection-tab-activity"
          >
            <Section title="Sync & Activity">
              <SyncPanel
                connectionId={connection.id}
                enabledCapabilitySlugs={enabledCapabilitySlugs}
                initialRuns={initialSyncRuns}
                initialTotal={initialSyncTotal}
                initialPolicies={initialSyncPolicies}
              />
            </Section>
          </div>
        ) : null}

        {activeTab === "settings" ? (
          <div
            id="connection-panel-settings"
            role="tabpanel"
            aria-labelledby="connection-tab-settings"
            className="space-y-10"
          >
            <Section title="Connection settings">
              <div className="border-border-soft rounded-2xl border p-5">
                <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                  Update the connection name, provider reference, and
                  verification configuration.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
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
                </div>
              </div>
            </Section>

            <Section title="Connection lifecycle">
              <div className="border-border-soft flex flex-col justify-between gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-sm font-medium">Connection status</h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    Disable collection temporarily, or remove this data source.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
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
            </Section>

            <Section title="Danger zone">
              <div className="border-border-soft flex flex-col justify-between gap-5 rounded-2xl border border-red-600/20 bg-red-600/5 p-5 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-sm font-medium">
                    Delete permanently (purge)
                  </h3>
                  <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-6">
                    Irreversibly deletes this connection together with every
                    sync history, inventory resource, and cost data row it
                    owns — a separate, harder-to-undo action from Remove
                    above, which refuses once real history exists.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPurgeConfirmName("");
                    setPurgeDialog(true);
                  }}
                  disabled={pending || !canRemove}
                  title={
                    canRemove
                      ? undefined
                      : "Disable the connection before purging it"
                  }
                  className="shrink-0 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  Delete permanently
                </button>
              </div>
            </Section>
          </div>
        ) : null}
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
                  Update connection details or CloudFormation setup
                  configuration.
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
                startTransition(async () => {
                  const result = await updateConnectionAction(connection.id, {
                    name: name || undefined,
                    ...(awsSetup.cloudformation_supported
                      ? {}
                      : {
                          external_reference:
                            String(
                              data.get("external_reference") ?? "",
                            ).trim() || null,
                        }),
                  });
                  if (result.error) return setError(result.error);
                  if (result.data) {
                    setConnection(result.data);
                    setEditDialog(false);
                    setNotice("Connection settings saved.");
                  }
                });
              }}
              className="mt-5 space-y-4"
            >
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">
                  Connection Name
                </span>
                <input
                  name="name"
                  required
                  defaultValue={connection.name}
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 text-sm outline-none"
                />
              </label>

              {awsSetup.cloudformation_supported ? (
                <p className="border-foreground/10 text-muted-foreground rounded-lg border p-3 text-xs leading-5">
                  Provider identity is set by verification, not by hand — use{" "}
                  <span className="font-medium">Verify Connection</span> below
                  to confirm the AWS account this connection resolves to.
                </p>
              ) : (
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">Reference</span>
                  <input
                    name="external_reference"
                    defaultValue={connection.external_reference ?? ""}
                    placeholder="Optional external reference"
                    className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono text-sm outline-none"
                  />
                </label>
              )}

              {awsSetup.cloudformation_supported ? (
                <div className="pt-2">
                  <span className="text-muted-foreground mb-2 block text-xs font-semibold tracking-wider uppercase">
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
                ) : (
                  <span />
                )}
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
                          {pending ? "Verifying…" : "Verify"}
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

      {/* Purge Connection Dialog */}
      {purgeDialog ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="purge-title"
            className="bg-background border-foreground/15 w-full max-w-sm rounded-xl border p-6"
          >
            <h2 id="purge-title" className="font-semibold text-red-600">
              Permanently delete {connection.name}?
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              This irreversibly deletes the connection together with every
              sync checkpoint, sync run, inventory resource, and cost row it
              owns. This cannot be undone.
            </p>
            <label className="mt-4 block text-sm">
              <span className="mb-1.5 block font-medium">
                Type <span className="font-mono">{connection.name}</span> to
                confirm
              </span>
              <input
                value={purgeConfirmName}
                onChange={(event) => setPurgeConfirmName(event.target.value)}
                autoFocus
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 text-sm outline-none"
              />
            </label>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-red-500">
                {error}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPurgeDialog(false)}
                className="border-foreground/15 rounded-lg border px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={pending || purgeConfirmName !== connection.name}
                onClick={purge}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {pending ? "Deleting…" : "Delete permanently"}
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
                    setNotice("Scope added.");
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
                  placeholder="e.g. region, service"
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                />
                <span className="text-muted-foreground mt-1.5 block text-xs">
                  Not accounts, subscriptions, projects, or clusters — those are
                  resolved by verification.
                </span>
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
