"use client";

import type { Route } from "next";
import Link from "next/link";
import { Archive, Boxes, Plus, RotateCcw, X } from "lucide-react";
import { useState, useTransition } from "react";
import {
  createApplicationAction,
  updateApplicationAction,
} from "@/app/dashboard/applications/actions";
import type { CoreApplication } from "@/lib/core/api";
import { EmptyState, StatusBadge } from "./primitives";

function sortApplications(applications: CoreApplication[]) {
  return [...applications].sort((left, right) => {
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

export function ApplicationsClient({
  initialApplications,
}: {
  initialApplications: CoreApplication[];
}) {
  const [applications, setApplications] = useState(() =>
    sortApplications(initialApplications),
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function closeCreate() {
    setCreateOpen(false);
    setName("");
    setSlug("");
    setSlugEdited(false);
    setError("");
  }

  function toggleStatus(application: CoreApplication) {
    setError("");
    startTransition(async () => {
      const result = await updateApplicationAction(application.id, {
        status: application.status === "active" ? "archived" : "active",
      });
      if (result.error) return setError(result.error);
      if (result.data) {
        setApplications((current) =>
          sortApplications(
            current.map((item) =>
              item.id === result.data!.id ? result.data! : item,
            ),
          ),
        );
      }
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          <Plus size={15} /> Create application
        </button>
      </div>

      {error && !createOpen ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {applications.length === 0 ? (
        <EmptyState
          title="No applications"
          description="Create a logical application, then add its runtime environments and telemetry sources."
          actions={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              Create application
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {applications.map((application) => (
            <article
              key={application.id}
              className="border-border-soft bg-card-strong/68 rounded-2xl border p-5 shadow-[0_16px_40px_var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="bg-accent/10 text-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Boxes size={18} />
                </span>
                <StatusBadge
                  status={
                    application.status === "active" ? "success" : "neutral"
                  }
                >
                  {application.status}
                </StatusBadge>
              </div>
              <Link
                href={`/dashboard/applications/${application.id}` as Route}
                className="mt-4 block text-lg font-semibold hover:underline"
              >
                {application.name}
              </Link>
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                {application.slug}
              </p>
              <p className="text-muted-foreground mt-3 min-h-10 text-sm leading-5">
                {application.description ?? "No description."}
              </p>
              <div className="border-border-soft mt-5 flex items-center justify-between border-t pt-4">
                <Link
                  href={`/dashboard/applications/${application.id}` as Route}
                  className="text-accent text-sm font-medium hover:underline"
                >
                  Open application
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => toggleStatus(application)}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  {application.status === "active" ? (
                    <Archive size={13} />
                  ) : (
                    <RotateCcw size={13} />
                  )}
                  {application.status === "active" ? "Archive" : "Restore"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {createOpen ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-application-title"
            className="bg-background border-foreground/15 w-full max-w-lg rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="create-application-title"
                  className="text-lg font-semibold"
                >
                  Create application
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  The slug is permanent and unique within your organization.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreate}
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
                  const result = await createApplicationAction({
                    name,
                    slug,
                    description:
                      String(data.get("description") ?? "").trim() || null,
                  });
                  if (result.error) return setError(result.error);
                  if (result.data) {
                    setApplications((current) =>
                      sortApplications([...current, result.data!]),
                    );
                    closeCreate();
                  }
                });
              }}
            >
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Name</span>
                <input
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (!slugEdited) setSlug(slugify(event.target.value));
                  }}
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Slug</span>
                <input
                  required
                  value={slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setSlug(slugify(event.target.value));
                  }}
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Description</span>
                <textarea
                  name="description"
                  rows={4}
                  className="border-foreground/15 bg-background focus:border-accent w-full rounded-lg border px-3 py-2 outline-none"
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
                {pending ? "Creating…" : "Create application"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
