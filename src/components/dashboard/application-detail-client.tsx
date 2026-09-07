"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Boxes,
  Pencil,
  Plus,
  RotateCcw,
  Server,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import {
  createEnvironmentAction,
  deleteApplicationAction,
  deleteEnvironmentAction,
  updateApplicationAction,
  updateEnvironmentAction,
} from "@/app/dashboard/applications/actions";
import type {
  CoreApplication,
  CoreApplicationEnvironment,
} from "@/lib/core/api";
import { DestructiveActionDialog } from "./destructive-action-dialog";
import { EmptyState, StatusBadge } from "./primitives";

function sortEnvironments(environments: CoreApplicationEnvironment[]) {
  return [...environments].sort((left, right) => {
    if (left.status !== right.status) return left.status === "active" ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ApplicationDetailClient({
  initialApplication,
  initialEnvironments,
}: {
  initialApplication: CoreApplication;
  initialEnvironments: CoreApplicationEnvironment[];
}) {
  const router = useRouter();
  const [application, setApplication] = useState(initialApplication);
  const [environments, setEnvironments] = useState(() =>
    sortEnvironments(initialEnvironments),
  );
  const [dialog, setDialog] = useState<"edit" | "environment" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "application" }
    | { kind: "environment"; environment: CoreApplicationEnvironment }
    | null
  >(null);
  const [environmentName, setEnvironmentName] = useState("");
  const [environmentSlug, setEnvironmentSlug] = useState("");
  const [environmentSlugEdited, setEnvironmentSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function closeDialog() {
    setDialog(null);
    setEnvironmentName("");
    setEnvironmentSlug("");
    setEnvironmentSlugEdited(false);
    setError("");
  }

  function toggleApplicationStatus() {
    setError("");
    startTransition(async () => {
      const result = await updateApplicationAction(application.id, {
        status: application.status === "active" ? "archived" : "active",
      });
      if (result.error) return setError(result.error);
      if (result.data) setApplication(result.data);
    });
  }

  function toggleEnvironmentStatus(environment: CoreApplicationEnvironment) {
    setError("");
    startTransition(async () => {
      const result = await updateEnvironmentAction(
        application.id,
        environment.id,
        {
          status: environment.status === "active" ? "archived" : "active",
        },
      );
      if (result.error) return setError(result.error);
      if (result.data) {
        setEnvironments((current) =>
          sortEnvironments(
            current.map((item) =>
              item.id === result.data!.id ? result.data! : item,
            ),
          ),
        );
      }
    });
  }

  function deleteSelectedTarget(confirmName: string) {
    if (!deleteTarget) return;
    setError("");
    startTransition(async () => {
      if (deleteTarget.kind === "application") {
        const result = await deleteApplicationAction(
          application.id,
          confirmName,
        );
        if (result.error) return setError(result.error);
        router.push("/dashboard/applications");
        router.refresh();
        return;
      }

      const result = await deleteEnvironmentAction(
        application.id,
        deleteTarget.environment.id,
        confirmName,
      );
      if (result.error) return setError(result.error);
      setEnvironments((current) =>
        current.filter((item) => item.id !== deleteTarget.environment.id),
      );
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <section className="border-border-soft bg-card-strong/70 rounded-2xl border p-5 shadow-[0_16px_40px_var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <span className="bg-accent/10 text-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
              <Boxes size={21} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{application.name}</h2>
                <StatusBadge
                  status={
                    application.status === "active" ? "success" : "neutral"
                  }
                >
                  {application.status}
                </StatusBadge>
              </div>
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                {application.slug}
              </p>
              <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
                {application.description || "No description."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDialog("edit")}
              className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium"
            >
              <Pencil size={13} /> Edit
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={toggleApplicationStatus}
              className="border-foreground/15 hover:bg-foreground/5 text-muted-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"
            >
              {application.status === "active" ? (
                <Archive size={13} />
              ) : (
                <RotateCcw size={13} />
              )}
              {application.status === "active" ? "Archive" : "Restore"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError("");
                setDeleteTarget({ kind: "application" });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/5 disabled:opacity-50"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </section>

      {error && !dialog && !deleteTarget ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Environments</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Production, staging, development, or any other runtime boundary.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDialog("environment")}
            className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
          >
            <Plus size={14} /> Add environment
          </button>
        </div>

        {environments.length === 0 ? (
          <EmptyState
            title="No environments"
            description="Add a runtime environment before configuring telemetry sources."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {environments.map((environment) => (
              <article
                key={environment.id}
                className="border-border-soft bg-card-strong/55 rounded-2xl border p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="bg-accent-secondary/10 text-accent-secondary flex h-9 w-9 items-center justify-center rounded-lg">
                    <Server size={16} />
                  </span>
                  <StatusBadge
                    status={
                      environment.status === "active" ? "success" : "neutral"
                    }
                  >
                    {environment.status}
                  </StatusBadge>
                </div>
                <Link
                  href={
                    `/dashboard/applications/${application.id}/environments/${environment.id}` as Route
                  }
                  className="mt-4 block font-semibold hover:underline"
                >
                  {environment.name}
                </Link>
                <p className="text-muted-foreground mt-1 font-mono text-xs">
                  {environment.slug}
                </p>
                <div className="border-border-soft mt-5 flex items-center justify-between gap-3 border-t pt-4">
                  <Link
                    href={
                      `/dashboard/applications/${application.id}/environments/${environment.id}` as Route
                    }
                    className="text-accent text-sm font-medium hover:underline"
                  >
                    Manage telemetry
                  </Link>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggleEnvironmentStatus(environment)}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
                    >
                      {environment.status === "active" ? (
                        <Archive size={13} />
                      ) : (
                        <RotateCcw size={13} />
                      )}
                      {environment.status === "active" ? "Archive" : "Restore"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setError("");
                        setDeleteTarget({ kind: "environment", environment });
                      }}
                      aria-label={`Delete ${environment.name} permanently`}
                      className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {dialog ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-dialog-title"
            className="bg-background border-foreground/15 w-full max-w-lg rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="application-dialog-title"
                  className="text-lg font-semibold"
                >
                  {dialog === "edit" ? "Edit application" : "Add environment"}
                </h2>
                {dialog === "environment" ? (
                  <p className="text-muted-foreground mt-1 text-sm">
                    The environment slug cannot be changed later.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                setError("");
                startTransition(async () => {
                  if (dialog === "edit") {
                    const result = await updateApplicationAction(
                      application.id,
                      {
                        name: String(data.get("name") ?? ""),
                        description: String(data.get("description") ?? ""),
                      },
                    );
                    if (result.error) return setError(result.error);
                    if (result.data) setApplication(result.data);
                  } else {
                    const result = await createEnvironmentAction(
                      application.id,
                      {
                        name: environmentName,
                        slug: environmentSlug,
                      },
                    );
                    if (result.error) return setError(result.error);
                    if (result.data) {
                      setEnvironments((current) =>
                        sortEnvironments([...current, result.data!]),
                      );
                    }
                  }
                  closeDialog();
                });
              }}
            >
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Name</span>
                {dialog === "edit" ? (
                  <input
                    name="name"
                    required
                    defaultValue={application.name}
                    className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                  />
                ) : (
                  <input
                    name="name"
                    required
                    value={environmentName}
                    onChange={(event) => {
                      setEnvironmentName(event.target.value);
                      if (!environmentSlugEdited) {
                        setEnvironmentSlug(slugify(event.target.value));
                      }
                    }}
                    className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                  />
                )}
              </label>
              {dialog === "edit" ? (
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">Description</span>
                  <textarea
                    name="description"
                    rows={4}
                    defaultValue={application.description ?? ""}
                    className="border-foreground/15 bg-background focus:border-accent w-full rounded-lg border px-3 py-2 outline-none"
                  />
                </label>
              ) : (
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">Slug</span>
                  <input
                    required
                    value={environmentSlug}
                    onChange={(event) => {
                      setEnvironmentSlugEdited(true);
                      setEnvironmentSlug(slugify(event.target.value));
                    }}
                    className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono outline-none"
                  />
                </label>
              )}
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
                  : dialog === "edit"
                    ? "Save changes"
                    : "Add environment"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <DestructiveActionDialog
          key={
            deleteTarget.kind === "application"
              ? application.id
              : deleteTarget.environment.id
          }
          title={
            deleteTarget.kind === "application"
              ? `Permanently delete ${application.name}?`
              : `Permanently delete ${deleteTarget.environment.name}?`
          }
          description={
            deleteTarget.kind === "application"
              ? "This irreversibly deletes the application, every environment, telemetry source, ingestion token, and all telemetry data they own. This cannot be undone."
              : "This irreversibly deletes the environment, its telemetry sources, ingestion tokens, and all telemetry data it owns. This cannot be undone."
          }
          confirmationName={
            deleteTarget.kind === "application"
              ? application.name
              : deleteTarget.environment.name
          }
          pending={pending}
          error={error}
          onCancel={() => {
            setDeleteTarget(null);
            setError("");
          }}
          onConfirm={(confirmationName) =>
            deleteSelectedTarget(confirmationName ?? "")
          }
        />
      ) : null}
    </>
  );
}
