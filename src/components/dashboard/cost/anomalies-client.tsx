"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, ChevronRight, TriangleAlert } from "lucide-react";
import type {
  AnomalyStatus,
  CoreAnomaly,
  CoreAnomalyNotificationSettings,
  CoreNotificationChannel,
  CoreNotificationDestination,
} from "@/lib/core/api";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { summarizeScope } from "./scope-editor";
import { cn } from "@/lib/utils";
import { useDashboardFilterState } from "@/lib/dashboard/filter-storage";
import { usePageTour } from "@/components/tours/tour-provider";
import {
  COST_ANOMALIES_TOUR_KEY,
  costAnomaliesAnchors as tourAnchors,
} from "@/lib/tours/definitions/cost-anomalies";
import {
  AnomalyStatusActions,
  severityTone,
  statusTone,
  useAnomalyStatusUpdate,
} from "./anomaly-status-actions";
import { AnomalyNotificationSettingsDialog } from "./anomaly-notification-settings-dialog";

const STATUS_FILTERS: { id: AnomalyStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "acknowledged", label: "Acknowledged" },
  { id: "resolved", label: "Resolved" },
];

function isAnomalyFilter(value: unknown): value is AnomalyStatus | "all" {
  return STATUS_FILTERS.some((filter) => filter.id === value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sortAnomalies(anomalies: CoreAnomaly[]) {
  return [...anomalies].sort(
    (left, right) =>
      new Date(right.detected_at).getTime() -
      new Date(left.detected_at).getTime(),
  );
}

export function anomalyHref(anomalyId: string) {
  return `/dashboard/products/cost/anomalies/${anomalyId}`;
}

export function AnomaliesClient({
  initialAnomalies,
  notificationSettings,
  channels,
  destinations,
}: {
  initialAnomalies: CoreAnomaly[];
  notificationSettings: CoreAnomalyNotificationSettings;
  channels: CoreNotificationChannel[];
  destinations: CoreNotificationDestination[];
}) {
  const [anomalies, setAnomalies] = useState(() =>
    sortAnomalies(initialAnomalies),
  );
  const [settings, setSettings] = useState(notificationSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filter, setFilter] = useDashboardFilterState<AnomalyStatus | "all">(
    "cost.anomalies.status",
    "all",
    isAnomalyFilter,
  );
  const { error, pending, update } = useAnomalyStatusUpdate((updated) =>
    setAnomalies((current) =>
      sortAnomalies(
        current.map((item) => (item.id === updated.id ? updated : item)),
      ),
    ),
  );

  // The product tour needs no anomalies: how detection works, notifications
  // and the status filters are always there; per-anomaly steps show the first row.
  usePageTour(COST_ANOMALIES_TOUR_KEY, { ready: true });

  const visible = useMemo(
    () =>
      filter === "all"
        ? anomalies
        : anomalies.filter((anomaly) => anomaly.status === filter),
    [anomalies, filter],
  );

  const notifying = settings.destination_ids.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p
          data-tour={tourAnchors.detection}
          className="text-muted-foreground max-w-2xl text-sm leading-6"
        >
          Detected hourly by comparing yesterday&apos;s whole-organization spend
          against a trailing 7-day average. Flags a deviation of 50% or more
          (and at least 1 currency unit).
        </p>
        <button
          type="button"
          data-tour={tourAnchors.notifications}
          onClick={() => setSettingsOpen(true)}
          className="border-foreground/15 hover:border-foreground/30 inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
        >
          {notifying ? (
            <Bell size={15} className="text-accent" />
          ) : (
            <BellOff size={15} className="text-muted-foreground" />
          )}
          {notifying
            ? `Notifying ${notifying} destination${notifying === 1 ? "" : "s"}`
            : "Notifications off"}
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Filter anomalies by status"
        data-tour={tourAnchors.filters}
        className="border-foreground/10 flex gap-1 border-b"
      >
        {STATUS_FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(item.id)}
              className={cn(
                "relative px-3 py-2.5 text-sm transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
              {active ? (
                <span
                  aria-hidden="true"
                  className="bg-accent absolute -bottom-px left-0 h-px w-full"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          title={
            filter === "all"
              ? "No anomalies detected"
              : `No ${filter} anomalies`
          }
          description="When spend deviates sharply from the trailing 7-day average, it shows up here within the hour."
        />
      ) : (
        <div className="border-border-soft overflow-hidden rounded-xl border">
          <div className="divide-border-soft divide-y">
            {visible.map((anomaly) => (
              <div
                key={anomaly.id}
                className="flex flex-wrap items-start justify-between gap-4 p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      anomaly.severity === "high"
                        ? "bg-red-500/10 text-red-500"
                        : anomaly.severity === "medium"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                          : "bg-foreground/5 text-muted-foreground",
                    )}
                  >
                    <TriangleAlert size={16} />
                  </span>
                  <div className="min-w-0">
                    <div
                      data-tour={tourAnchors.summary}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <Link
                        href={anomalyHref(anomaly.id)}
                        className="hover:text-accent text-sm font-semibold transition-colors"
                      >
                        {Number(anomaly.actual_amount).toLocaleString("en-US")}{" "}
                        {anomaly.currency} vs.{" "}
                        {Number(anomaly.expected_amount).toLocaleString(
                          "en-US",
                        )}{" "}
                        expected
                      </Link>
                      <StatusBadge status={severityTone(anomaly.severity)}>
                        {anomaly.severity}
                      </StatusBadge>
                      <StatusBadge status={statusTone(anomaly.status)}>
                        {anomaly.status}
                      </StatusBadge>
                    </div>
                    <div data-tour={tourAnchors.details}>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDate(anomaly.period_start)} · deviation{" "}
                        {Number(anomaly.deviation_percent).toFixed(0)}% ·
                        detected {formatDate(anomaly.detected_at)}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Scope: {summarizeScope(anomaly.scope)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div
                    data-tour={tourAnchors.actions}
                    className="flex items-center gap-3"
                  >
                    <AnomalyStatusActions
                      anomaly={anomaly}
                      pending={pending}
                      onChange={(status) => update(anomaly, status)}
                    />
                  </div>
                  <Link
                    href={anomalyHref(anomaly.id)}
                    data-tour={tourAnchors.open}
                    className="text-accent inline-flex items-center gap-0.5 text-xs font-medium hover:underline"
                  >
                    Details <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {settingsOpen ? (
        <AnomalyNotificationSettingsDialog
          settings={settings}
          channels={channels}
          destinations={destinations}
          onClose={() => setSettingsOpen(false)}
          onSaved={(saved) => {
            setSettings(saved);
            setSettingsOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
