"use client";

import { Activity, RefreshCw } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { listMetricDatapointsAction } from "@/app/dashboard/integrations/actions";
import type {
  CoreMetricDatapoint,
  CoreMetricDatapointListResponse,
} from "@/lib/core/api";
import { EmptyState, Metric } from "./primitives";

interface MetricDefinition {
  key: string;
  namespace: string;
  metricName: string;
  statistic: string;
  unit: string | null;
}

function definitionKey(point: CoreMetricDatapoint) {
  return `${point.namespace}\u0000${point.metric_name}\u0000${point.statistic}`;
}

function metricLabel(value: string) {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ");
}

function formatValue(value: number, unit: string | null) {
  if (unit?.toLowerCase() === "bytes") {
    const units = ["B", "KiB", "MiB", "GiB", "TiB"];
    const exponent =
      value === 0
        ? 0
        : Math.min(
            units.length - 1,
            Math.max(0, Math.floor(Math.log(Math.abs(value)) / Math.log(1024))),
          );
    const scaled = value / 1024 ** exponent;
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(scaled)} ${units[exponent]}`;
  }
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
  if (!unit || unit.toLowerCase() === "none") return formatted;
  if (unit.toLowerCase() === "percent") return `${formatted}%`;
  return `${formatted} ${unit}`;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function definitionsFrom(points: CoreMetricDatapoint[]): MetricDefinition[] {
  const definitions = new Map<string, MetricDefinition>();
  points.forEach((point) => {
    const key = definitionKey(point);
    if (!definitions.has(key)) {
      definitions.set(key, {
        key,
        namespace: point.namespace,
        metricName: point.metric_name,
        statistic: point.statistic,
        unit: point.unit,
      });
    }
  });
  return [...definitions.values()].sort((left, right) =>
    `${left.namespace}/${left.metricName}/${left.statistic}`.localeCompare(
      `${right.namespace}/${right.metricName}/${right.statistic}`,
    ),
  );
}

function MetricChart({
  points,
  unit,
  label,
}: {
  points: CoreMetricDatapoint[];
  unit: string | null;
  label: string;
}) {
  const ordered = [...points].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
  const width = 760;
  const height = 230;
  const padding = { top: 18, right: 18, bottom: 34, left: 58 };
  const values = ordered.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.1, 1);
  const min = rawMin - spread * 0.08;
  const max = rawMax + spread * 0.08;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const coordinates = ordered.map((point, index) => {
    const x =
      padding.left +
      (ordered.length === 1
        ? plotWidth / 2
        : (index / (ordered.length - 1)) * plotWidth);
    const y = padding.top + ((max - point.value) / (max - min)) * plotHeight;
    return { x, y, point };
  });
  const polyline = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <div className="border-border-soft bg-surface/25 overflow-hidden rounded-xl border p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label} utilization over time`}
        className="h-auto w-full"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + ratio * plotHeight;
          const value = max - ratio * (max - min);
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--border-soft)"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fill="var(--muted-foreground)"
                fontSize="10"
              >
                {formatValue(value, unit)}
              </text>
            </g>
          );
        })}
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coordinates.map(({ x, y, point }) => (
          <circle
            key={point.id}
            cx={x}
            cy={y}
            r="3"
            fill="var(--background)"
            stroke="var(--accent)"
            strokeWidth="2"
          >
            <title>
              {formatTimestamp(point.timestamp)}:{" "}
              {formatValue(point.value, point.unit)}
            </title>
          </circle>
        ))}
        {ordered.length > 0 ? (
          <>
            <text
              x={padding.left}
              y={height - 8}
              fill="var(--muted-foreground)"
              fontSize="10"
            >
              {formatTimestamp(ordered[0].timestamp)}
            </text>
            <text
              x={width - padding.right}
              y={height - 8}
              textAnchor="end"
              fill="var(--muted-foreground)"
              fontSize="10"
            >
              {formatTimestamp(ordered[ordered.length - 1].timestamp)}
            </text>
          </>
        ) : null}
      </svg>
    </div>
  );
}

export function ResourceMetricsPanel({
  connectionId,
  resourceId,
  initialMetrics,
}: {
  connectionId: string;
  resourceId: string;
  initialMetrics: CoreMetricDatapointListResponse;
}) {
  const definitions = useMemo(
    () => definitionsFrom(initialMetrics.items),
    [initialMetrics.items],
  );
  const [selectedKey, setSelectedKey] = useState(definitions[0]?.key ?? "");
  const [points, setPoints] = useState(() =>
    initialMetrics.items.filter(
      (point) => definitionKey(point) === definitions[0]?.key,
    ),
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const selected = definitions.find((item) => item.key === selectedKey);
  const ordered = [...points].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );
  const values = ordered.map((point) => point.value);
  const latest = ordered[0];
  const minimum = values.length ? Math.min(...values) : null;
  const maximum = values.length ? Math.max(...values) : null;
  const average = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

  function selectMetric(key: string) {
    setSelectedKey(key);
    const definition = definitions.find((item) => item.key === key);
    if (!definition) return;
    setError("");
    startTransition(async () => {
      const result = await listMetricDatapointsAction(connectionId, {
        resourceId,
        limit: 100,
        offset: 0,
        namespace: definition.namespace,
        metricName: definition.metricName,
      });
      if (result.error) return setError(result.error);
      if (result.data) {
        setPoints(
          result.data.items.filter(
            (point) => point.statistic === definition.statistic,
          ),
        );
      }
    });
  }

  if (definitions.length === 0) {
    return (
      <EmptyState
        title="No utilization metrics yet"
        description="Run a metrics.utilization sync for this connection to collect provider metrics for this resource."
      />
    );
  }

  const label = selected
    ? `${metricLabel(selected.metricName)} · ${selected.statistic}`
    : "Metric";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block min-w-0 flex-1 text-sm sm:max-w-md">
          <span className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wide uppercase">
            Metric series
          </span>
          <select
            value={selectedKey}
            disabled={pending}
            onChange={(event) => selectMetric(event.target.value)}
            className="border-foreground/15 bg-background h-10 w-full rounded-lg border px-3 text-sm disabled:opacity-60"
          >
            {definitions.map((definition) => (
              <option key={definition.key} value={definition.key}>
                {metricLabel(definition.metricName)} · {definition.statistic} ·{" "}
                {definition.namespace}
              </option>
            ))}
          </select>
        </label>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
          {pending ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <Activity size={12} />
          )}
          {points.length} points
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      {latest && minimum !== null && maximum !== null && average !== null ? (
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Latest"
            value={formatValue(latest.value, selected?.unit ?? latest.unit)}
            detail={formatTimestamp(latest.timestamp)}
          />
          <Metric
            label="Average"
            value={formatValue(average, selected?.unit ?? null)}
          />
          <Metric
            label="Minimum"
            value={formatValue(minimum, selected?.unit ?? null)}
          />
          <Metric
            label="Maximum"
            value={formatValue(maximum, selected?.unit ?? null)}
          />
        </dl>
      ) : null}

      {ordered.length > 0 ? (
        <>
          <MetricChart
            points={ordered}
            unit={selected?.unit ?? null}
            label={label}
          />
          <div className="border-border-soft overflow-hidden rounded-xl border">
            <div className="border-border-soft bg-foreground/[0.025] grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b px-4 py-3 text-[11px] font-semibold tracking-wide uppercase">
              <span>Timestamp</span>
              <span>Period</span>
              <span className="text-right">Value</span>
            </div>
            <div className="divide-border-soft divide-y">
              {ordered.slice(0, 10).map((point) => (
                <div
                  key={point.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 px-4 py-3 text-xs"
                >
                  <time dateTime={point.timestamp} className="truncate">
                    {formatTimestamp(point.timestamp)}
                  </time>
                  <span className="text-muted-foreground">
                    {point.period_seconds}s
                  </span>
                  <span className="text-right font-mono font-medium">
                    {formatValue(point.value, point.unit)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="No datapoints in this series"
          description="The selected metric exists, but no values were returned for the current resource."
        />
      )}
    </div>
  );
}
