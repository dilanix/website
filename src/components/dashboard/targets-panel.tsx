"use client";
import { useState, useTransition } from "react";
import { Loader2, RefreshCw, ShieldOff, X } from "lucide-react";
import type {
  CoreIntegrationTarget,
  IntegrationTargetStatus,
} from "@/lib/core/api";
import {
  disableTargetAction,
  listTargetsAction,
  replaceTargetIdentityAction,
} from "@/app/dashboard/integrations/actions";
import { EmptyState, StatusBadge } from "./primitives";

/** Core returns targets oldest-first; the live one is what a user actually
 * cares about seeing first, especially right after a replace. */
const STATUS_ORDER: Record<IntegrationTargetStatus, number> = {
  verified: 0,
  invalid: 1,
  disabled: 2,
};

function sortTargets(
  targets: CoreIntegrationTarget[],
): CoreIntegrationTarget[] {
  return [...targets].sort((a, b) => {
    const statusDelta = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDelta !== 0) return statusDelta;
    return b.created_at.localeCompare(a.created_at);
  });
}

function targetStatusTone(
  status: IntegrationTargetStatus,
): "success" | "neutral" | "warning" {
  if (status === "verified") return "success";
  if (status === "invalid") return "warning";
  return "neutral";
}

function TargetRow({
  connectionId,
  target,
  onChanged,
}: {
  connectionId: string;
  target: CoreIntegrationTarget;
  /** Reloads the whole list rather than merging just this row's response —
   * `replace` retires `target` server-side and returns only the new row it
   * created, so a targeted merge would leave this row's now-stale `verified`
   * status showing in the UI. */
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [replaceDialog, setReplaceDialog] = useState(false);
  const [error, setError] = useState("");

  function disable() {
    setError("");
    startTransition(async () => {
      const result = await disableTargetAction(connectionId, target.id);
      if (result.error) return setError(result.error);
      if (result.data) onChanged();
    });
  }

  function replace(requestedExternalId: string) {
    setError("");
    startTransition(async () => {
      const result = await replaceTargetIdentityAction(
        connectionId,
        target.id,
        requestedExternalId,
      );
      if (result.error) return setError(result.error);
      if (result.data) {
        onChanged();
        setReplaceDialog(false);
      }
    });
  }

  return (
    <div className="border-foreground/10 flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <StatusBadge status={targetStatusTone(target.status)}>
            {target.status}
          </StatusBadge>
          <span className="text-muted-foreground text-xs tracking-wider uppercase">
            {target.target_type}
          </span>
          <span className="min-w-0 truncate font-mono text-xs">
            {target.external_id}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setReplaceDialog(true)}
            disabled={pending}
            className="text-accent inline-flex items-center gap-1 text-xs hover:underline disabled:opacity-50"
          >
            <RefreshCw size={12} />
            Replace
          </button>
          {target.status !== "disabled" ? (
            <button
              type="button"
              onClick={disable}
              disabled={pending}
              className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:text-red-500 disabled:opacity-50"
            >
              <ShieldOff size={12} />
              Disable
            </button>
          ) : null}
        </div>
      </div>
      {target.display_name ? (
        <p className="text-muted-foreground text-xs">{target.display_name}</p>
      ) : null}
      {error && !replaceDialog ? (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      ) : null}

      {replaceDialog ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="replace-target-title"
            className="bg-background border-foreground/15 w-full max-w-md rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 id="replace-target-title" className="text-lg font-semibold">
                  Replace identity
                </h2>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  Disables this {target.target_type} and verifies a new one in
                  its place. The connection keeps its capabilities and scopes.
                </p>
              </div>
              <button
                onClick={() => setReplaceDialog(false)}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                replace(String(data.get("requested_external_id") ?? "").trim());
              }}
              className="mt-5 space-y-4"
            >
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">
                  New {target.target_type} ID
                </span>
                <input
                  name="requested_external_id"
                  required
                  placeholder="e.g. 123456789012"
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
                  onClick={() => setReplaceDialog(false)}
                  className="border-foreground/15 rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={pending}
                  className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {pending ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" />
                      Replacing…
                    </span>
                  ) : (
                    "Replace"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TargetsPanel({
  connectionId,
  initialTargets,
}: {
  connectionId: string;
  initialTargets: CoreIntegrationTarget[];
}) {
  const [targets, setTargets] = useState(() => sortTargets(initialTargets));
  const [, startReload] = useTransition();

  function reload() {
    startReload(async () => {
      const result = await listTargetsAction(connectionId);
      if (result.data) setTargets(sortTargets(result.data));
    });
  }

  if (targets.length === 0) {
    return (
      <EmptyState
        title="No provider identity yet"
        description="Verify this connection to resolve the account, subscription, or project it should sync from."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {targets.map((target) => (
        <TargetRow
          key={target.id}
          connectionId={connectionId}
          target={target}
          onChanged={reload}
        />
      ))}
    </div>
  );
}
