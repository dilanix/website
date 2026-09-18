"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Clock, FileText, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import {
  createReportAction,
  deleteReportAction,
  generateReportAction,
  updateReportAction,
} from "@/app/dashboard/products/cost-actions";
import type {
  CoreNotificationChannel,
  CoreNotificationDestination,
  CoreReport,
  CoreScopeCondition,
  ReportFormat,
  ReportPeriodPreset,
} from "@/lib/core/api";
import { DestructiveActionDialog } from "@/components/dashboard/destructive-action-dialog";
import { ModalOverlay } from "@/components/dashboard/modal-overlay";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { GeneratedReportsDialog } from "./generated-reports-dialog";
import {
  cronToSchedule,
  DEFAULT_SCHEDULE,
  describeSchedule,
  PERIOD_PRESET_LABELS,
  scheduleToCron,
  WEEKDAY_LABELS,
  type FriendlySchedule,
  type ScheduleMode,
} from "./report-schedule";
import { ScopeEditor, summarizeScope } from "./scope-editor";

function sortReports(reports: CoreReport[]) {
  return [...reports].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

interface ReportFormState {
  name: string;
  description: string;
  format: ReportFormat;
  periodPreset: ReportPeriodPreset;
  schedule: FriendlySchedule;
  destinationIds: string[];
}

function toFormState(report?: CoreReport): ReportFormState {
  return {
    name: report?.name ?? "",
    description: report?.description ?? "",
    format: report?.format ?? "csv",
    periodPreset: report?.period_preset ?? "last_month",
    schedule: cronToSchedule(report?.schedule_cron ?? null),
    destinationIds: report?.destination_ids ?? [],
  };
}

const SCHEDULE_MODE_OPTIONS: { value: ScheduleMode; label: string }[] = [
  { value: "none", label: "On-demand only" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
  { value: "custom", label: "Custom (cron)" },
];

function timeToMinutes(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function timeInputValue(schedule: FriendlySchedule): string {
  return `${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")}`;
}

function providerLabel(channel: CoreNotificationChannel | undefined) {
  if (!channel) return "Unknown channel";
  return `${channel.provider.charAt(0).toUpperCase()}${channel.provider.slice(1)} · ${channel.name}`;
}

function ReportDialog({
  report,
  onClose,
  onSaved,
  channels,
  destinations,
}: {
  report: CoreReport | null;
  onClose: () => void;
  onSaved: (report: CoreReport) => void;
  channels: CoreNotificationChannel[];
  destinations: CoreNotificationDestination[];
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
  const channelById = new Map(channels.map((channel) => [channel.id, channel]));

  function submit() {
    setError("");
    if (form.destinationIds.length === 0) {
      setError("Select at least one notification destination.");
      return;
    }
    const input = {
      name: form.name,
      description: form.description.trim() || null,
      format: form.format,
      // Preserve the legacy field for API compatibility. Delivery now uses
      // the shared Notification module destinations below.
      recipients: report?.recipients ?? [],
      destinationIds: form.destinationIds,
      periodPreset: form.periodPreset,
      scheduleCron: scheduleToCron(form.schedule),
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
    <ModalOverlay onClose={onClose}>
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
              <span className="mb-1.5 block font-medium">Cost period</span>
              <select
                value={form.periodPreset}
                onChange={(event) =>
                  setForm((f) => ({
                    ...f,
                    periodPreset: event.target.value as ReportPeriodPreset,
                  }))
                }
                className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
              >
                {Object.entries(PERIOD_PRESET_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="border-foreground/15 rounded-lg border p-3 text-sm">
            <legend className="px-1 font-medium">Schedule</legend>
            <select
              value={form.schedule.mode}
              onChange={(event) =>
                setForm((f) => ({
                  ...f,
                  schedule: {
                    ...(f.schedule.mode === "none"
                      ? DEFAULT_SCHEDULE
                      : f.schedule),
                    mode: event.target.value as ScheduleMode,
                  },
                }))
              }
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
            >
              {SCHEDULE_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {form.schedule.mode !== "none" &&
            form.schedule.mode !== "custom" ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-muted-foreground mb-1.5 block text-xs">
                    Time (UTC)
                  </span>
                  <input
                    type="time"
                    value={timeInputValue(form.schedule)}
                    onChange={(event) => {
                      const parsed = timeToMinutes(event.target.value);
                      if (!parsed) return;
                      setForm((f) => ({
                        ...f,
                        schedule: { ...f.schedule, ...parsed },
                      }));
                    }}
                    className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                  />
                </label>
                {form.schedule.mode === "weekly" ? (
                  <label className="block">
                    <span className="text-muted-foreground mb-1.5 block text-xs">
                      Day of week
                    </span>
                    <select
                      value={form.schedule.dayOfWeek}
                      onChange={(event) =>
                        setForm((f) => ({
                          ...f,
                          schedule: {
                            ...f.schedule,
                            dayOfWeek: Number(event.target.value),
                          },
                        }))
                      }
                      className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                    >
                      {WEEKDAY_LABELS.map((label, index) => (
                        <option key={label} value={index}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {form.schedule.mode === "monthly" ? (
                  <label className="block">
                    <span className="text-muted-foreground mb-1.5 block text-xs">
                      Day of month
                    </span>
                    <select
                      value={form.schedule.dayOfMonth}
                      onChange={(event) =>
                        setForm((f) => ({
                          ...f,
                          schedule: {
                            ...f.schedule,
                            dayOfMonth: Number(event.target.value),
                          },
                        }))
                      }
                      className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                    >
                      {Array.from({ length: 28 }, (_, index) => index + 1).map(
                        (day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                ) : null}
              </div>
            ) : null}

            {form.schedule.mode === "custom" ? (
              <label className="mt-3 block">
                <span className="text-muted-foreground mb-1.5 block text-xs">
                  Cron expression (UTC)
                </span>
                <input
                  value={form.schedule.cron}
                  onChange={(event) =>
                    setForm((f) => ({
                      ...f,
                      schedule: { ...f.schedule, cron: event.target.value },
                    }))
                  }
                  placeholder="0 8 1 * *"
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono text-xs outline-none"
                />
              </label>
            ) : null}

            <p className="text-muted-foreground mt-2 text-xs">
              {describeSchedule(scheduleToCron(form.schedule))}
            </p>
          </fieldset>

          <fieldset className="text-sm">
            <legend className="mb-1.5 font-medium">
              Notification destinations
            </legend>
            {destinations.length === 0 ? (
              <div className="border-foreground/15 text-muted-foreground rounded-lg border border-dashed p-3 text-xs leading-5">
                No destinations are configured. Add an Email, Slack, Telegram,
                or Webhook destination in{" "}
                <Link
                  href="/dashboard/notifications"
                  className="text-accent font-medium hover:underline"
                >
                  Notifications
                </Link>
                .
              </div>
            ) : (
              <div className="border-foreground/15 divide-foreground/10 max-h-48 divide-y overflow-y-auto rounded-lg border">
                {destinations.map((destination) => {
                  const channel = channelById.get(destination.channel_id);
                  const selected = form.destinationIds.includes(destination.id);
                  const available = Boolean(
                    destination.is_enabled &&
                    channel?.is_enabled &&
                    channel.status === "active",
                  );
                  return (
                    <label
                      key={destination.id}
                      className="flex cursor-pointer items-start gap-3 px-3 py-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!available && !selected}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            destinationIds: event.target.checked
                              ? [...current.destinationIds, destination.id]
                              : current.destinationIds.filter(
                                  (id) => id !== destination.id,
                                ),
                          }))
                        }
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium">
                          {destination.name}
                        </span>
                        <span className="text-muted-foreground block text-xs">
                          {providerLabel(channel)}
                          {!available ? " · disabled" : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>

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
    </ModalOverlay>
  );
}

export function ReportsClient({
  initialReports,
  channels,
  destinations,
}: {
  initialReports: CoreReport[];
  channels: CoreNotificationChannel[];
  destinations: CoreNotificationDestination[];
}) {
  const [reports, setReports] = useState(() => sortReports(initialReports));
  const [dialogState, setDialogState] = useState<
    "closed" | "create" | CoreReport
  >("closed");
  const [deleteTarget, setDeleteTarget] = useState<CoreReport | null>(null);
  const [historyTarget, setHistoryTarget] = useState<CoreReport | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(
    null,
  );
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

  function generate(report: CoreReport) {
    setError("");
    setNotice("");
    setGeneratingReportId(report.id);
    startTransition(async () => {
      const result = await generateReportAction(report.id);
      setGeneratingReportId(null);
      if (result.error) return setError(result.error);
      setNotice(
        `${report.name} was generated and queued for notification delivery.`,
      );
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          Define cost reports, choose their notification destinations, and send
          them on demand or on a schedule.
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
      {notice && dialogState === "closed" && !deleteTarget ? (
        <p
          role="status"
          className="border-accent/20 bg-accent/5 text-accent rounded-lg border px-3 py-2 text-sm"
        >
          {notice}
        </p>
      ) : null}

      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Create a report and choose where Notifications should deliver it."
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
                      <StatusBadge
                        status={report.enabled ? "success" : "neutral"}
                      >
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
                      {describeSchedule(report.schedule_cron)}
                      {report.next_run_at
                        ? ` · Next run ${new Date(report.next_run_at).toLocaleString()}`
                        : ""}{" "}
                      · {PERIOD_PRESET_LABELS[report.period_preset]} ·{" "}
                      {report.destination_ids.length} destination
                      {report.destination_ids.length === 1 ? "" : "s"}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Scope: {summarizeScope(report.scope)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    disabled={pending || report.destination_ids.length === 0}
                    onClick={() => generate(report)}
                    title={
                      report.destination_ids.length === 0
                        ? "Edit the report and select a notification destination first"
                        : undefined
                    }
                    className="text-accent inline-flex items-center gap-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send size={13} />
                    {generatingReportId === report.id
                      ? "Sending…"
                      : "Generate & send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTarget(report)}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                  >
                    <Clock size={13} /> History
                  </button>
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
          channels={channels}
          destinations={destinations}
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

      {historyTarget ? (
        <GeneratedReportsDialog
          key={historyTarget.id}
          report={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      ) : null}
    </div>
  );
}
