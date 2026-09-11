"use client";

import { useState, useTransition } from "react";
import { FileText, Info, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createReportAction,
  deleteReportAction,
  updateReportAction,
} from "@/app/dashboard/products/cost-actions";
import type { CoreReport, CoreScopeCondition, ReportFormat } from "@/lib/core/api";
import { DestructiveActionDialog } from "@/components/dashboard/destructive-action-dialog";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { ScopeEditor, summarizeScope } from "./scope-editor";

function sortReports(reports: CoreReport[]) {
  return [...reports].sort((left, right) => left.name.localeCompare(right.name));
}

function parseRecipients(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

interface ReportFormState {
  name: string;
  description: string;
  format: ReportFormat;
  recipients: string;
  scheduleCron: string;
}

function toFormState(report?: CoreReport): ReportFormState {
  return {
    name: report?.name ?? "",
    description: report?.description ?? "",
    format: report?.format ?? "csv",
    recipients: report?.recipients.join(", ") ?? "",
    scheduleCron: report?.schedule_cron ?? "",
  };
}

function ReportDialog({
  report,
  onClose,
  onSaved,
}: {
  report: CoreReport | null;
  onClose: () => void;
  onSaved: (report: CoreReport) => void;
}) {
  const [form, setForm] = useState<ReportFormState>(() =>
    toFormState(report ?? undefined),
  );
  const [scope, setScope] = useState<CoreScopeCondition[]>(
    () => report?.scope ?? [],
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(report);

  function submit() {
    setError("");
    const input = {
      name: form.name,
      description: form.description.trim() || null,
      format: form.format,
      recipients: parseRecipients(form.recipients),
      scheduleCron: form.scheduleCron.trim() || null,
      scope,
    };
    startTransition(async () => {
      const result = report
        ? await updateReportAction(report.id, input)
        : await createReportAction(input);
      if (result.error) return setError(result.error);
      if (result.data) onSaved(result.data);
    });
  }

  return (
    <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        className="bg-background border-foreground/15 my-8 w-full max-w-xl rounded-xl border p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="report-dialog-title" className="text-lg font-semibold">
            {isEditing ? "Edit report" : "Create report"}
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

        <div className="border-accent/20 bg-accent/5 text-accent mt-4 flex items-start gap-2 rounded-lg border p-3 text-xs leading-5">
          <Info size={14} className="mt-0.5 shrink-0" />
          Scheduling is coming soon. Report definitions save now, but nothing
          generates or sends automatically yet.
        </div>

        <form
          className="mt-4 space-y-4"
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
              <span className="mb-1.5 block font-medium">Format</span>
              <select
                value={form.format}
                onChange={(event) =>
                  setForm((f) => ({
                    ...f,
                    format: event.target.value as ReportFormat,
                  }))
                }
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">
                Schedule (cron, optional)
              </span>
              <input
                value={form.scheduleCron}
                onChange={(event) =>
                  setForm((f) => ({ ...f, scheduleCron: event.target.value }))
                }
                placeholder="0 8 1 * *"
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono text-xs outline-none"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">
              Recipients (comma or newline separated)
            </span>
            <textarea
              rows={2}
              value={form.recipients}
              onChange={(event) =>
                setForm((f) => ({ ...f, recipients: event.target.value }))
              }
              placeholder="finance@company.com"
              className="border-foreground/15 bg-background focus:border-accent w-full rounded-lg border px-3 py-2 font-mono text-xs outline-none"
            />
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
            {pending ? "Saving…" : isEditing ? "Save changes" : "Create report"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function ReportsClient({
  initialReports,
}: {
  initialReports: CoreReport[];
}) {
  const [reports, setReports] = useState(() => sortReports(initialReports));
  const [dialogState, setDialogState] = useState<
    "closed" | "create" | CoreReport
  >("closed");
  const [deleteTarget, setDeleteTarget] = useState<CoreReport | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleEnabled(report: CoreReport) {
    setError("");
    startTransition(async () => {
      const result = await updateReportAction(report.id, {
        enabled: !report.enabled,
      });
      if (result.error) return setError(result.error);
      if (result.data) {
        setReports((current) =>
          sortReports(
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
      const result = await deleteReportAction(target.id);
      if (result.error) return setError(result.error);
      setReports((current) => current.filter((item) => item.id !== target.id));
      setDeleteTarget(null);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="border-accent/20 bg-accent/5 text-accent flex items-start gap-2 rounded-lg border p-3 text-xs leading-5">
        <Info size={14} className="mt-0.5 shrink-0" />
        Scheduling is coming soon — report definitions save today, but
        generation and delivery aren&apos;t live yet.
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          Define exportable cost reports, ready to schedule once automatic
          delivery ships.
        </p>
        <button
          type="button"
          onClick={() => setDialogState("create")}
          className="bg-accent text-accent-foreground inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          <Plus size={15} /> Create report
        </button>
      </div>

      {error && dialogState === "closed" && !deleteTarget ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Define a report now so it's ready the moment scheduled delivery ships."
          actions={
            <button
              type="button"
              onClick={() => setDialogState("create")}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              Create report
            </button>
          }
        />
      ) : (
        <div className="border-border-soft overflow-hidden rounded-xl border">
          <div className="divide-border-soft divide-y">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-wrap items-start justify-between gap-4 p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="bg-accent/10 text-accent mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    <FileText size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{report.name}</p>
                      <StatusBadge status={report.enabled ? "success" : "neutral"}>
                        {report.enabled ? "Enabled" : "Disabled"}
                      </StatusBadge>
                      <span className="text-muted-foreground font-mono text-[11px] uppercase">
                        {report.format}
                      </span>
                    </div>
                    {report.description ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {report.description}
                      </p>
                    ) : null}
                    <p className="text-muted-foreground mt-1 text-xs">
                      {report.schedule_cron
                        ? `Schedule: ${report.schedule_cron} (not active yet)`
                        : "On-demand only"}{" "}
                      · {report.recipients.length} recipient
                      {report.recipients.length === 1 ? "" : "s"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Scope: {summarizeScope(report.scope)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggleEnabled(report)}
                    className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-50"
                  >
                    {report.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialogState(report)}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setError("");
                      setDeleteTarget(report);
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
        <ReportDialog
          key={dialogState === "create" ? "create" : dialogState.id}
          report={dialogState === "create" ? null : dialogState}
          onClose={() => setDialogState("closed")}
          onSaved={(report) => {
            setReports((current) => {
              const exists = current.some((item) => item.id === report.id);
              return sortReports(
                exists
                  ? current.map((item) =>
                      item.id === report.id ? report : item,
                    )
                  : [...current, report],
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
          description="This permanently deletes the report definition. This cannot be undone."
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
