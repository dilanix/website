"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Plus, Trash2, X } from "lucide-react";
import type {
  CoreAWSConnectionSetup,
  CoreConnectionCapability,
  CoreConnectionScope,
  CoreIntegrationCapability,
  CoreIntegrationConnection,
  IntegrationConnectionStatus,
} from "@/lib/core/api";
import {
  addConnectionScopeAction,
  disableConnectionAction,
  enableConnectionAction,
  markConnectionConnectedAction,
  removeConnectionAction,
  removeConnectionScopeAction,
  setConnectionCapabilitiesAction,
} from "@/app/dashboard/integrations/actions";
import { EmptyState, Section, StatusBadge } from "./primitives";

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

const VERIFIABLE_STATUSES = new Set<IntegrationConnectionStatus>([
  "draft",
  "pending",
]);

export function ConnectionDetailClient({
  connection: initialConnection,
  capabilities,
  initialConnectionCapabilities,
  initialScopes,
  awsSetup,
}: {
  connection: CoreIntegrationConnection;
  capabilities: CoreIntegrationCapability[];
  initialConnectionCapabilities: CoreConnectionCapability[];
  initialScopes: CoreConnectionScope[];
  awsSetup: CoreAWSConnectionSetup;
}) {
  const router = useRouter();
  const [connection, setConnection] = useState(initialConnection);
  const [connectionCapabilities, setConnectionCapabilities] = useState(
    initialConnectionCapabilities,
  );
  const [scopes, setScopes] = useState(initialScopes);
  const [selectedCapabilityIds, setSelectedCapabilityIds] = useState<
    Set<string>
  >(() => new Set(initialConnectionCapabilities.map((c) => c.capability_id)));
  const [removeDialog, setRemoveDialog] = useState(false);
  const [scopeDialog, setScopeDialog] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [copiedExternalId, setCopiedExternalId] = useState(false);

  async function copyExternalId() {
    if (!awsSetup.external_id) return;
    await navigator.clipboard.writeText(awsSetup.external_id);
    setCopiedExternalId(true);
    setTimeout(() => setCopiedExternalId(false), 2000);
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

  function verify() {
    setError("");
    startTransition(async () => {
      const result = await markConnectionConnectedAction(connection.id);
      if (result.error) return setError(result.error);
      if (result.data) setConnection(result.data);
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
  const canVerify = VERIFIABLE_STATUSES.has(connection.status);

  return (
    <div className="flex flex-col gap-8">
      <div className="border-foreground/10 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
        <div className="flex items-center gap-3">
          <StatusBadge status={statusTone(connection.status)}>
            {connection.status}
          </StatusBadge>
          {connection.external_reference ? (
            <span className="text-muted-foreground text-xs">
              Ref: {connection.external_reference}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
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

      {awsSetup.cloudformation_supported ? (
        <Section title="AWS setup">
          <div className="border-foreground/10 bg-foreground/[0.015] rounded-xl border p-5">
            <p className="text-muted-foreground text-sm leading-6">
              Launch the CloudFormation stack to grant Dilanix a read-only
              cross-account IAM role. No AWS access keys are ever requested.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              {awsSetup.cloudformation_url ? (
                <a
                  href={awsSetup.cloudformation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent text-accent-foreground inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
                >
                  <ExternalLink size={15} />
                  Launch in AWS CloudFormation
                </a>
              ) : (
                <p className="text-muted-foreground text-sm">
                  CloudFormation launch isn&apos;t configured on this deployment
                  yet.
                </p>
              )}
            </div>
            {awsSetup.external_id ? (
              <div className="mt-4">
                <span className="text-muted-foreground mb-2 block text-xs font-medium">
                  External ID — paste this into the console&apos;s
                  &quot;ExternalId&quot; field
                </span>
                <div className="border-foreground/15 flex items-center gap-2 rounded-lg border p-3">
                  <code className="min-w-0 flex-1 overflow-hidden text-sm text-ellipsis">
                    {awsSetup.external_id}
                  </code>
                  <button
                    onClick={copyExternalId}
                    className="text-accent inline-flex shrink-0 items-center gap-1 text-xs"
                  >
                    {copiedExternalId ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                    {copiedExternalId ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ) : null}
            {canVerify ? (
              <div className="border-foreground/10 mt-5 border-t pt-5">
                <button
                  onClick={verify}
                  disabled={pending}
                  className="bg-accent text-accent-foreground rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {pending ? "Verifying…" : "Verify connection"}
                </button>
                <p className="text-muted-foreground mt-2 text-xs leading-5">
                  Click once the CloudFormation stack has finished creating.
                  Dilanix doesn&apos;t check AWS automatically yet — this marks
                  the connection connected based on your confirmation.
                </p>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      <Section
        title="Capabilities"
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
                  className="border-foreground/10 flex items-center gap-3 rounded-lg border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={capability.status !== "active" && !selected}
                    onChange={() => toggleCapability(capability.id)}
                  />
                  <span className="flex-1">
                    {capability.name}
                    <span className="text-muted-foreground ml-2 font-mono text-xs">
                      {capability.slug}
                    </span>
                  </span>
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
        action={
          <button
            onClick={() => setScopeDialog(true)}
            className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
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
                  onClick={() => removeScope(scope.scope_type, scope.scope_key)}
                  disabled={pending}
                  aria-label={`Remove scope ${scope.scope_type}/${scope.scope_key}`}
                  className="text-muted-foreground p-1 hover:text-red-500 disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No scopes"
            description="Scope this connection to specific regions, accounts, or projects."
          />
        )}
      </Section>

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
