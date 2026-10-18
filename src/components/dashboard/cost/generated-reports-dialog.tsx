"use client";

import { useEffect, useState, useTransition } from "react";
import { Download, Eye, FileText, Trash2, X } from "lucide-react";
import {
  deleteGeneratedReportAction,
  getGeneratedReportDownloadUrlAction,
  listGeneratedReportsAction,
} from "@/app/dashboard/products/cost-actions";
import type { CoreNotification, CoreReport } from "@/lib/core/api";
import { DestructiveActionDialog } from "@/components/dashboard/destructive-action-dialog";
import { ModalOverlay } from "@/components/dashboard/modal-overlay";
import { EmptyState } from "@/components/dashboard/primitives";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatPeriod(data: Record<string, unknown>) {
  const start =
    typeof data.period_start === "string" ? data.period_start : null;
  const end = typeof data.period_end === "string" ? data.period_end : null;
  if (!start || !end) return null;
  const format = (value: string) =>
    new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  return `${format(start)} – ${format(end)}`;
}

function formatTotal(data: Record<string, unknown>) {
  const amount =
    typeof data.total_amount === "string" ? data.total_amount : null;
  const currency = typeof data.currency === "string" ? data.currency : null;
  if (amount === null) return null;
  return currency ? `${amount} ${currency}` : amount;
}

function extensionOf(filename: string) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : null;
}

export function GeneratedReportsDialog({
  report,
  onClose,
}: {
  report: CoreReport;
  onClose: () => void;
}) {
  const [generations, setGenerations] = useState<CoreNotification[] | null>(
    null,
  );
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CoreNotification | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      const result = await listGeneratedReportsAction(report.id);
      if (cancelled) return;
      if (result.error) return setError(result.error);
      setGenerations(result.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [report.id]);

  async function openAttachment(
    notification: CoreNotification,
    mode: "view" | "download",
  ) {
    const attachment = notification.attachments[0];
    if (!attachment) return;
    setError("");
    setBusyId(notification.id);
    const result = await getGeneratedReportDownloadUrlAction(
      notification.id,
      attachment.id,
    );
    setBusyId(null);
    if (result.error || !result.data) {
      setError(result.error ?? "Unable to resolve the download link.");
      return;
    }
    if (mode === "view") {
      window.open(result.data.url, "_blank", "noopener,noreferrer");
      return;
    }
    const link = document.createElement("a");
    link.href = result.data.url;
    link.download = attachment.filename;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function remove() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setError("");
    startTransition(async () => {
      const result = await deleteGeneratedReportAction(target.id);
      if (result.error) return setError(result.error);
      setGenerations(
        (current) => current?.filter((item) => item.id !== target.id) ?? null,
      );
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <ModalOverlay onClose={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="generated-reports-title"
          className="bg-background border-foreground/15 my-8 w-full max-w-2xl rounded-xl border p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="generated-reports-title"
                className="text-lg font-semibold"
              >
                Generated reports
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {report.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="text-muted-foreground p-1"
            >
              <X size={18} />
            </button>
          </div>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-red-500">
              {error}
            </p>
          ) : null}

          <div className="mt-4">
            {generations === null ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Loading…
              </p>
            ) : generations.length === 0 ? (
              <EmptyState
                title="No generations yet"
                description="Generate this report on demand or wait for its schedule — every generation will appear here with view, download, and delete actions."
              />
            ) : (
              <div className="border-border-soft divide-border-soft divide-y overflow-hidden rounded-xl border">
                {generations.map((notification) => {
                  const attachment = notification.attachments[0];
                  const period = formatPeriod(notification.data);
                  const total = formatTotal(notification.data);
                  const busy = busyId === notification.id;
                  return (
                    <div
                      key={notification.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="bg-accent/10 text-accent mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                          <FileText size={14} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {formatDateTime(notification.created_at)}
                            {attachment ? (
                              <span className="text-muted-foreground ml-2 font-mono text-[11px] uppercase">
                                {extensionOf(attachment.filename)}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {[period, total].filter(Boolean).join(" · ") ||
                              notification.body}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          disabled={!attachment || busy}
                          title="View"
                          aria-label="View report"
                          onClick={() => openAttachment(notification, "view")}
                          className="text-muted-foreground hover:text-foreground rounded-md p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={!attachment || busy}
                          title="Download"
                          aria-label="Download report"
                          onClick={() =>
                            openAttachment(notification, "download")
                          }
                          className="text-muted-foreground hover:text-foreground rounded-md p-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          title="Delete"
                          aria-label="Delete generated report"
                          onClick={() => {
                            setError("");
                            setDeleteTarget(notification);
                          }}
                          className="text-muted-foreground rounded-md p-1.5 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ModalOverlay>

      {deleteTarget ? (
        <DestructiveActionDialog
          title="Delete this generated report?"
          description="This permanently removes it from the history. This cannot be undone."
          pending={pending}
          error={error}
          onCancel={() => {
            setDeleteTarget(null);
            setError("");
          }}
          onConfirm={() => remove()}
        />
      ) : null}
    </>
  );
}
