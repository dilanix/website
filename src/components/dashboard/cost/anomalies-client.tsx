"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { updateAnomalyStatusAction } from "@/app/dashboard/products/cost-actions";
import type { AnomalyStatus, CoreAnomaly } from "@/lib/core/api";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { summarizeScope } from "./scope-editor";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { id: AnomalyStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "acknowledged", label: "Acknowledged" },
  { id: "resolved", label: "Resolved" },
];

function severityTone(severity: CoreAnomaly["severity"]) {
  if (severity === "high") return "warning" as const;
  if (severity === "medium") return "neutral" as const;
  return "neutral" as const;
}

function statusTone(status: AnomalyStatus) {
  if (status === "resolved") return "success" as const;
  if (status === "open") return "warning" as const;
  return "neutral" as const;
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

export function AnomaliesClient({
  initialAnomalies,
}: {
  initialAnomalies: CoreAnomaly[];
}) {
  const [anomalies, setAnomalies] = useState(() =>
    sortAnomalies(initialAnomalies),
  );
  const [filter, setFilter] = useState<AnomalyStatus | "all">("all");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const visible = useMemo(
    () =>
      filter === "all"
        ? anomalies
        : anomalies.filter((anomaly) => anomaly.status === filter),
    [anomalies, filter],
  );

  function transition(anomaly: CoreAnomaly, status: "acknowledged" | "resolved") {
    setError("");
    startTransition(async () => {
      const result = await updateAnomalyStatusAction(anomaly.id, status);
      if (result.error) return setError(result.error);
      if (result.data) {
        setAnomalies((current) =>
          sortAnomalies(
            current.map((item) =>
              item.id === result.data!.id ? result.data! : item,
            ),
          ),
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground max-w-2xl text-sm leading-6">
        Detected hourly by comparing yesterday&apos;s whole-organization spend
        against a trailing 7-day average. Flags a deviation of 50% or more
        (and at least 1 currency unit).
      </p>

      <div
        role="tablist"
        aria-label="Filter anomalies by status"
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
            filter === "all" ? "No anomalies detected" : `No ${filter} anomalies`
          }
          description="When spend deviates sharply from the trailing 7-day average, it shows up here within the hour."
        />
      ) : (
        <div className="border-border-soft overflow-hidden rounded-xl border">
          <div className="divide-border-soft divide-y">
            {visible.map((anomaly) => (
              <div key={anomaly.id} className="flex flex-wrap items-start justify-between gap-4 p-4">
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        {Number(anomaly.actual_amount).toLocaleString("en-US")}{" "}
                        {anomaly.currency} vs.{" "}
                        {Number(anomaly.expected_amount).toLocaleString(
                          "en-US",
                        )}{" "}
                        expected
                      </p>
                      <StatusBadge status={severityTone(anomaly.severity)}>
                        {anomaly.severity}
                      </StatusBadge>
                      <StatusBadge status={statusTone(anomaly.status)}>
                        {anomaly.status}
                      </StatusBadge>
                    </div>
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
                {anomaly.status !== "resolved" ? (
                  <div className="flex shrink-0 items-center gap-3">
                    {anomaly.status === "open" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => transition(anomaly, "acknowledged")}
                        className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-50"
                      >
                        Acknowledge
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => transition(anomaly, "resolved")}
                      className="text-success inline-flex items-center gap-1 text-xs disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} /> Resolve
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
