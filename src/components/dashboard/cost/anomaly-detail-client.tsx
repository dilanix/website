"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import type {
  CoreAnomaly,
  CoreAnomalyBreakdown,
  CoreAnomalyDailyAmount,
  CoreAnomalyDriverGroup,
} from "@/lib/core/api";
import { StatusBadge } from "@/components/dashboard/primitives";
import { cn } from "@/lib/utils";
import { formatAmount } from "./format";
import {
  AnomalyStatusActions,
  severityTone,
  statusTone,
  useAnomalyStatusUpdate,
} from "./anomaly-status-actions";

const DIMENSION_LABELS: Record<CoreAnomalyDriverGroup["dimension"], string> = {
  service_name: "Service",
  sub_account_id: "Account",
  region_id: "Region",
};

const SOURCE_LABELS: Record<CoreAnomalyBreakdown["source"], string> = {
  cost_usage: "FOCUS cost & usage data (effective cost)",
  cost_summary:
    "AWS Cost Explorer (net unblended cost) — account and region breakdowns need FOCUS data",
};

/** Anomaly days are UTC charge days, so label them in UTC. */
function formatDay(value: string, withYear = false) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border-soft rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function DailyChart({
  daily,
  expected,
  currency,
  severity,
}: {
  daily: CoreAnomalyDailyAmount[];
  expected: number;
  currency: string;
  severity: CoreAnomaly["severity"];
}) {
  const max = Math.max(expected, ...daily.map((day) => Number(day.amount)), 0);
  if (daily.length === 0 || max <= 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No daily spend is available for this period.
      </p>
    );
  }
  const expectedTop = 100 - (expected / max) * 100;

  return (
    <div>
      <div className="relative flex h-44 items-end gap-1.5">
        <div
          aria-hidden="true"
          className="border-foreground/40 pointer-events-none absolute inset-x-0 border-t border-dashed"
          style={{ top: `${expectedTop}%` }}
        />
        {daily.map((day) => {
          const amount = Number(day.amount);
          return (
            <div
              key={day.day}
              title={`${formatDay(day.day)}: ${formatAmount(amount, currency)}`}
              className={cn(
                "min-h-px flex-1 rounded-t",
                day.kind === "anomaly"
                  ? severity === "high"
                    ? "bg-red-500"
                    : "bg-amber-500"
                  : day.kind === "after"
                    ? "bg-foreground/10"
                    : "bg-foreground/25",
              )}
              style={{ height: `${(amount / max) * 100}%` }}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {daily.map((day) => (
          <span
            key={day.day}
            className={cn(
              "text-muted-foreground flex-1 truncate text-center text-[10px]",
              day.kind === "anomaly" && "text-foreground font-semibold",
            )}
          >
            {formatDay(day.day)}
          </span>
        ))}
      </div>
      <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-foreground/25 h-2.5 w-2.5 rounded-sm" />
          Baseline days
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-sm",
              severity === "high" ? "bg-red-500" : "bg-amber-500",
            )}
          />
          Anomaly day
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-foreground/10 h-2.5 w-2.5 rounded-sm" />
          After
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="border-foreground/40 w-4 border-t border-dashed" />
          Expected {formatAmount(expected, currency)}/day
        </span>
      </div>
    </div>
  );
}

function DriverGroup({
  group,
  currency,
}: {
  group: CoreAnomalyDriverGroup;
  currency: string;
}) {
  const maxDelta = Math.max(
    ...group.increases.map((driver) => Number(driver.delta)),
    0,
  );
  return (
    <div className="border-border-soft rounded-xl border p-4">
      <h3 className="text-sm font-semibold">
        By {DIMENSION_LABELS[group.dimension].toLowerCase()}
      </h3>
      {group.increases.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-xs">
          No {DIMENSION_LABELS[group.dimension].toLowerCase()} grew above its
          average.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {group.increases.map((driver) => {
            const delta = Number(driver.delta);
            return (
              <li key={driver.value ?? "__none__"} className="text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">
                    {driver.value ?? "Not set"}
                  </span>
                  <span className="shrink-0 font-semibold text-red-500 tabular-nums">
                    +{formatAmount(delta, currency)}
                  </span>
                </div>
                <div className="bg-foreground/5 mt-1 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-red-500/70"
                    style={{
                      width: `${maxDelta > 0 ? (delta / maxDelta) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                  {formatAmount(Number(driver.actual_amount), currency)} vs.{" "}
                  {formatAmount(Number(driver.expected_amount), currency)}/day
                  expected
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function AnomalyDetailClient({
  initialAnomaly,
  breakdown,
  breakdownError,
}: {
  initialAnomaly: CoreAnomaly;
  breakdown: CoreAnomalyBreakdown | null;
  breakdownError: string;
}) {
  const [anomaly, setAnomaly] = useState(initialAnomaly);
  const { error, pending, update } = useAnomalyStatusUpdate(setAnomaly);
  const actual = Number(anomaly.actual_amount);
  const expected = Number(anomaly.expected_amount);
  const currency = anomaly.currency;
  const deviation = Number(anomaly.deviation_percent).toFixed(0);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/dashboard/products/cost/anomalies"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft size={14} /> All anomalies
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              anomaly.severity === "high"
                ? "bg-red-500/10 text-red-500"
                : anomaly.severity === "medium"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                  : "bg-foreground/5 text-muted-foreground",
            )}
          >
            <TriangleAlert size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                {formatAmount(actual, currency)} vs.{" "}
                {formatAmount(expected, currency)} expected
              </h2>
              <StatusBadge status={severityTone(anomaly.severity)}>
                {anomaly.severity}
              </StatusBadge>
              <StatusBadge status={statusTone(anomaly.status)}>
                {anomaly.status}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Spend on {formatDay(anomaly.period_start, true)} (UTC) · whole
              organization
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <AnomalyStatusActions
            anomaly={anomaly}
            pending={pending}
            onChange={(status) => update(anomaly, status)}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Actual spend" value={formatAmount(actual, currency)} />
        <Stat
          label="Expected (7-day average)"
          value={formatAmount(expected, currency)}
        />
        <Stat
          label="Increase"
          value={`+${formatAmount(actual - expected, currency)}`}
        />
        <Stat label="Deviation" value={`+${deviation}%`} />
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <span>Detected {formatDateTime(anomaly.detected_at)}</span>
        <span>Acknowledged {formatDateTime(anomaly.acknowledged_at)}</span>
        <span>Resolved {formatDateTime(anomaly.resolved_at)}</span>
      </div>

      {breakdown ? (
        <>
          <section className="border-border-soft rounded-xl border p-4">
            <h3 className="mb-4 text-sm font-semibold">Daily spend</h3>
            <DailyChart
              daily={breakdown.daily}
              expected={expected}
              currency={currency}
              severity={anomaly.severity}
            />
          </section>

          <section>
            <h3 className="text-sm font-semibold">What grew</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Spend on the anomaly day against each one&apos;s own average over
              the {breakdown.baseline_days} days before.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {breakdown.drivers.map((group) => (
                <DriverGroup
                  key={group.dimension}
                  group={group}
                  currency={currency}
                />
              ))}
            </div>
          </section>

          <p className="text-muted-foreground text-xs">
            Source: {SOURCE_LABELS[breakdown.source]}.
          </p>
        </>
      ) : (
        <p className="border-foreground/15 text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
          The spend breakdown for this anomaly is unavailable right now
          {breakdownError ? `: ${breakdownError}` : "."}
        </p>
      )}
    </div>
  );
}
