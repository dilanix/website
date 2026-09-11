"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import {
  createAllocationAction,
  deleteAllocationAction,
  updateAllocationAction,
} from "@/app/dashboard/products/cost-actions";
import type { CoreAllocation, CoreScopeCondition } from "@/lib/core/api";
import { DestructiveActionDialog } from "@/components/dashboard/destructive-action-dialog";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { ScopeEditor, summarizeScope } from "./scope-editor";

function sortAllocations(allocations: CoreAllocation[]) {
  return [...allocations].sort((left, right) => left.priority - right.priority);
}

interface AllocationFormState {
  name: string;
  targetLabel: string;
  priority: string;
}

function toFormState(allocation?: CoreAllocation): AllocationFormState {
  return {
    name: allocation?.name ?? "",
    targetLabel: allocation?.target_label ?? "",
    priority: String(allocation?.priority ?? 0),
  };
}

function AllocationDialog({
  allocation,
  onClose,
  onSaved,
}: {
  allocation: CoreAllocation | null;
  onClose: () => void;
  onSaved: (allocation: CoreAllocation) => void;
}) {
  const [form, setForm] = useState<AllocationFormState>(() =>
    toFormState(allocation ?? undefined),
  );
  const [scope, setScope] = useState<CoreScopeCondition[]>(
    () => allocation?.scope ?? [],
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(allocation);

  function submit() {
    setError("");
    const priority = Number(form.priority);
    if (!Number.isFinite(priority) || priority < 0) {
      setError("Priority must be a non-negative number.");
      return;
    }
    const input = {
      name: form.name,
      targetLabel: form.targetLabel,
      priority,
      scope,
    };
    startTransition(async () => {
      const result = allocation
        ? await updateAllocationAction(allocation.id, input)
        : await createAllocationAction(input);
      if (result.error) return setError(result.error);
      if (result.data) onSaved(result.data);
    });
  }

  return (
    <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="allocation-dialog-title"
        className="bg-background border-foreground/15 my-8 w-full max-w-lg rounded-xl border p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="allocation-dialog-title" className="text-lg font-semibold">
            {isEditing ? "Edit allocation" : "Create allocation"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted-foreground p-1"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Name</span>
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm((f) => ({ ...f, name: event.target.value }))
              }
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">
              Target label (team, cost center, or business unit)
            </span>
            <input
              required
              value={form.targetLabel}
              onChange={(event) =>
                setForm((f) => ({ ...f, targetLabel: event.target.value }))
              }
              placeholder="Platform team"
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Priority</span>
            <input
              required
              inputMode="numeric"
              value={form.priority}
              onChange={(event) =>
                setForm((f) => ({ ...f, priority: event.target.value }))
              }
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono outline-none"
            />
            <span className="text-muted-foreground mt-1 block text-xs">
              Lower numbers match first when spend fits more than one
              allocation&apos;s scope.
            </span>
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-medium">Scope</span>
            <ScopeEditor initialValue={scope} onChange={setScope} />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          ) : null}

          <button
            disabled={pending}
            className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {pending
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Create allocation"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AllocationsClient({
  initialAllocations,
}: {
  initialAllocations: CoreAllocation[];
}) {
  const [allocations, setAllocations] = useState(() =>
    sortAllocations(initialAllocations),
  );
  const [dialogState, setDialogState] = useState<
    "closed" | "create" | CoreAllocation
  >("closed");
  const [deleteTarget, setDeleteTarget] = useState<CoreAllocation | null>(
    null,
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleEnabled(allocation: CoreAllocation) {
    setError("");
    startTransition(async () => {
      const result = await updateAllocationAction(allocation.id, {
        enabled: !allocation.enabled,
      });
      if (result.error) return setError(result.error);
      if (result.data) {
        setAllocations((current) =>
          sortAllocations(
            current.map((item) =>
              item.id === result.data!.id ? result.data! : item,
            ),
          ),
        );
      }
    });
  }

  function remove() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setError("");
    startTransition(async () => {
      const result = await deleteAllocationAction(target.id);
      if (result.error) return setError(result.error);
      setAllocations((current) =>
        current.filter((item) => item.id !== target.id),
      );
      setDeleteTarget(null);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          Label slices of spend by team, cost center, or business unit.
          Lower-priority-number allocations match first.
        </p>
        <button
          type="button"
          onClick={() => setDialogState("create")}
          className="bg-accent text-accent-foreground inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          <Plus size={15} /> Create allocation
        </button>
      </div>

      {error && dialogState === "closed" && !deleteTarget ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {allocations.length === 0 ? (
        <EmptyState
          title="No allocations yet"
          description="Create an allocation to attribute spend to a team, cost center, or business unit."
          actions={
            <button
              type="button"
              onClick={() => setDialogState("create")}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              Create allocation
            </button>
          }
        />
      ) : (
        <div className="border-border-soft overflow-hidden rounded-xl border">
          <div className="divide-border-soft divide-y">
            {allocations.map((allocation) => (
              <div
                key={allocation.id}
                className="flex flex-wrap items-start justify-between gap-4 p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="bg-accent/10 text-accent mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    <Tags size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        {allocation.name}
                      </p>
                      <StatusBadge
                        status={allocation.enabled ? "success" : "neutral"}
                      >
                        {allocation.enabled ? "Enabled" : "Disabled"}
                      </StatusBadge>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        priority {allocation.priority}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {allocation.target_label}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Scope: {summarizeScope(allocation.scope)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggleEnabled(allocation)}
                    className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-50"
                  >
                    {allocation.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialogState(allocation)}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setError("");
                      setDeleteTarget(allocation);
                    }}
                    className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dialogState !== "closed" ? (
        <AllocationDialog
          key={dialogState === "create" ? "create" : dialogState.id}
          allocation={dialogState === "create" ? null : dialogState}
          onClose={() => setDialogState("closed")}
          onSaved={(allocation) => {
            setAllocations((current) => {
              const exists = current.some((item) => item.id === allocation.id);
              return sortAllocations(
                exists
                  ? current.map((item) =>
                      item.id === allocation.id ? allocation : item,
                    )
                  : [...current, allocation],
              );
            });
            setDialogState("closed");
          }}
        />
      ) : null}

      {deleteTarget ? (
        <DestructiveActionDialog
          key={deleteTarget.id}
          title={`Delete ${deleteTarget.name}?`}
          description="This permanently deletes the allocation. This cannot be undone."
          pending={pending}
          error={error}
          onCancel={() => {
            setDeleteTarget(null);
            setError("");
          }}
          onConfirm={() => remove()}
        />
      ) : null}
    </div>
  );
}
