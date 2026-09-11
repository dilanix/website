"use client";

import { useState, useTransition } from "react";
import { Bookmark, Globe2, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createSavedViewAction,
  deleteSavedViewAction,
  updateSavedViewAction,
} from "@/app/dashboard/products/cost-actions";
import type {
  CoreSavedView,
  CoreScopeCondition,
  ExplorerGranularity,
  SavedViewVisibility,
  ScopeDimension,
} from "@/lib/core/api";
import { DestructiveActionDialog } from "@/components/dashboard/destructive-action-dialog";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { SCOPE_DIMENSION_LABELS, ScopeEditor, summarizeScope } from "./scope-editor";

type GroupByDimension = Exclude<ScopeDimension, "tag">;

const GROUP_BY_DIMENSIONS = (
  Object.keys(SCOPE_DIMENSION_LABELS) as ScopeDimension[]
).filter((dimension): dimension is GroupByDimension => dimension !== "tag");

const GRANULARITY_LABELS: Record<ExplorerGranularity, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

function sortSavedViews(views: CoreSavedView[]) {
  return [...views].sort((left, right) => left.name.localeCompare(right.name));
}

interface SavedViewFormState {
  name: string;
  description: string;
  groupBy: GroupByDimension[];
  granularity: ExplorerGranularity;
  visibility: SavedViewVisibility;
}

function toFormState(view?: CoreSavedView): SavedViewFormState {
  return {
    name: view?.name ?? "",
    description: view?.description ?? "",
    groupBy: (view?.group_by.filter(
      (dimension): dimension is GroupByDimension => dimension !== "tag",
    )) ?? [],
    granularity: view?.granularity ?? "daily",
    visibility: view?.visibility ?? "private",
  };
}

function SavedViewDialog({
  view,
  onClose,
  onSaved,
}: {
  view: CoreSavedView | null;
  onClose: () => void;
  onSaved: (view: CoreSavedView) => void;
}) {
  const [form, setForm] = useState<SavedViewFormState>(() =>
    toFormState(view ?? undefined),
  );
  const [scope, setScope] = useState<CoreScopeCondition[]>(
    () => view?.scope ?? [],
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(view);

  function toggleGroupBy(dimension: GroupByDimension) {
    setForm((f) => ({
      ...f,
      groupBy: f.groupBy.includes(dimension)
        ? f.groupBy.filter((item) => item !== dimension)
        : [...f.groupBy, dimension],
    }));
  }

  function submit() {
    setError("");
    const input = {
      name: form.name,
      description: form.description.trim() || null,
      groupBy: form.groupBy,
      granularity: form.granularity,
      visibility: form.visibility,
      scope,
    };
    startTransition(async () => {
      const result = view
        ? await updateSavedViewAction(view.id, input)
        : await createSavedViewAction(input);
      if (result.error) return setError(result.error);
      if (result.data) onSaved(result.data);
    });
  }

  return (
    <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-view-dialog-title"
        className="bg-background border-foreground/15 my-8 w-full max-w-xl rounded-xl border p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="saved-view-dialog-title" className="text-lg font-semibold">
            {isEditing ? "Edit saved view" : "Create saved view"}
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
            <span className="mb-1.5 block font-medium">Description</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm((f) => ({ ...f, description: event.target.value }))
              }
              className="border-foreground/15 bg-background focus:border-accent w-full rounded-lg border px-3 py-2 outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Granularity</span>
              <select
                value={form.granularity}
                onChange={(event) =>
                  setForm((f) => ({
                    ...f,
                    granularity: event.target.value as ExplorerGranularity,
                  }))
                }
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
              >
                {(Object.keys(GRANULARITY_LABELS) as ExplorerGranularity[]).map(
                  (granularity) => (
                    <option key={granularity} value={granularity}>
                      {GRANULARITY_LABELS[granularity]}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Visibility</span>
              <select
                value={form.visibility}
                onChange={(event) =>
                  setForm((f) => ({
                    ...f,
                    visibility: event.target.value as SavedViewVisibility,
                  }))
                }
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
              >
                <option value="private">Only me</option>
                <option value="organization">Everyone in the org</option>
              </select>
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">Group by</span>
            <div className="flex flex-wrap gap-1.5">
              {GROUP_BY_DIMENSIONS.map((dimension) => {
                const active = form.groupBy.includes(dimension);
                return (
                  <button
                    key={dimension}
                    type="button"
                    onClick={() => toggleGroupBy(dimension)}
                    className={
                      active
                        ? "border-accent/30 bg-accent/10 text-accent rounded-full border px-2.5 py-1 text-[11px] font-medium"
                        : "border-foreground/10 text-muted-foreground hover:text-foreground rounded-full border px-2.5 py-1 text-[11px] font-medium"
                    }
                  >
                    {SCOPE_DIMENSION_LABELS[dimension]}
                  </button>
                );
              })}
            </div>
          </div>

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
                : "Create saved view"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function SavedViewsClient({
  initialSavedViews,
  currentUserId,
}: {
  initialSavedViews: CoreSavedView[];
  currentUserId: string;
}) {
  const [views, setViews] = useState(() => sortSavedViews(initialSavedViews));
  const [dialogState, setDialogState] = useState<
    "closed" | "create" | CoreSavedView
  >("closed");
  const [deleteTarget, setDeleteTarget] = useState<CoreSavedView | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setError("");
    startTransition(async () => {
      const result = await deleteSavedViewAction(target.id);
      if (result.error) return setError(result.error);
      setViews((current) => current.filter((item) => item.id !== target.id));
      setDeleteTarget(null);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          Save a scope, grouping, and granularity to come back to later, or
          share it with the rest of the organization.
        </p>
        <button
          type="button"
          onClick={() => setDialogState("create")}
          className="bg-accent text-accent-foreground inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          <Plus size={15} /> Create saved view
        </button>
      </div>

      {error && dialogState === "closed" && !deleteTarget ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {views.length === 0 ? (
        <EmptyState
          title="No saved views yet"
          description="Save a cost breakdown you check often so you don't have to rebuild it every time."
          actions={
            <button
              type="button"
              onClick={() => setDialogState("create")}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              Create saved view
            </button>
          }
        />
      ) : (
        <div className="border-border-soft overflow-hidden rounded-xl border">
          <div className="divide-border-soft divide-y">
            {views.map((view) => {
              const isOwner = view.created_by_user_id === currentUserId;
              return (
                <div
                  key={view.id}
                  className="flex flex-wrap items-start justify-between gap-4 p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="bg-accent/10 text-accent mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <Bookmark size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{view.name}</p>
                        <StatusBadge status="neutral">
                          {view.visibility === "organization" ? (
                            <>
                              <Globe2 size={11} /> Organization
                            </>
                          ) : (
                            <>
                              <Lock size={11} /> Private
                            </>
                          )}
                        </StatusBadge>
                        {isOwner ? (
                          <span className="text-muted-foreground text-[11px]">
                            Created by you
                          </span>
                        ) : null}
                      </div>
                      {view.description ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {view.description}
                        </p>
                      ) : null}
                      <p className="text-muted-foreground mt-1 text-xs">
                        {GRANULARITY_LABELS[view.granularity]}
                        {view.group_by.length
                          ? ` · grouped by ${view.group_by
                              .map((d) => SCOPE_DIMENSION_LABELS[d])
                              .join(", ")}`
                          : ""}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Scope: {summarizeScope(view.scope)}
                      </p>
                    </div>
                  </div>
                  {isOwner ? (
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDialogState(view)}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setError("");
                          setDeleteTarget(view);
                        }}
                        className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dialogState !== "closed" ? (
        <SavedViewDialog
          key={dialogState === "create" ? "create" : dialogState.id}
          view={dialogState === "create" ? null : dialogState}
          onClose={() => setDialogState("closed")}
          onSaved={(view) => {
            setViews((current) => {
              const exists = current.some((item) => item.id === view.id);
              return sortSavedViews(
                exists
                  ? current.map((item) => (item.id === view.id ? view : item))
                  : [...current, view],
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
          description="This permanently deletes the saved view. This cannot be undone."
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
