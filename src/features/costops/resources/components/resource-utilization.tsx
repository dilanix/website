"use client";

import { useRef, useState, useTransition } from "react";
import { AlertTriangle, Clock3, Inbox, LoaderCircle } from "lucide-react";
import { Section, StatusBadge } from "@/components/dashboard/primitives";
import { cn } from "@/lib/utils";
import {
  formatMetricRelativeTime,
  formatMetricTimestamp,
  formatMetricValue,
} from "../analytics/formatters";
import type {
  HealthSignal,
  LatestMetric as LatestMetricData,
  MetricAvailability,
  MetricGroupDefinition,
  MetricSeries,
  ResourceAnalytics,
  ResourceMetricDefinition,
  TimeRange,
} from "../analytics/types";
import { getResourceAnalyticsAction } from "@/app/dashboard/costops/actions";

const RANGES: { value: TimeRange; label: string; accessibleLabel: string }[] = [
  { value: "24h", label: "24h", accessibleLabel: "24 hours" },
  { value: "7d", label: "7d", accessibleLabel: "7 days" },
  { value: "30d", label: "30d", accessibleLabel: "30 days" },
];

export function ResourceUtilization({
  analytics: initialAnalytics,
  definition,
}: {
  analytics: ResourceAnalytics;
  definition: ResourceMetricDefinition;
}) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [range, setRange] = useState<TimeRange>("24h");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const requestSequence = useRef(0);
  const selected = analytics.ranges[range] ?? analytics.ranges["24h"];
  if (!selected) return null;

  const selectRange = (nextRange: TimeRange) => {
    const sequence = ++requestSequence.current;
    setError(null);
    if (analytics.ranges[nextRange]) {
      setRange(nextRange);
      return;
    }
    startTransition(async () => {
      const result = await getResourceAnalyticsAction(
        analytics.resourceId,
        nextRange,
      );
      if (sequence !== requestSequence.current) return;
      if (!result.data) {
        setError(result.error ?? "Unable to load monitoring data.");
        return;
      }
      setAnalytics((current) => ({
        ...result.data!,
        ranges: { ...current.ranges, ...result.data!.ranges },
      }));
      setRange(nextRange);
    });
  };

  return (
    <>
      <LatestMetrics analytics={analytics} definition={definition} />
      <Section
        title="Utilization & Performance"
        action={<TimeRangeSelector value={range} onChange={selectRange} />}
      >
        {isPending ? (
          <p className="text-muted-foreground mb-3 text-xs" role="status">
            Loading selected range…
          </p>
        ) : null}
        {error ? (
          <p className="mb-3 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {definition.groups.map((group) => (
            <MetricGroup
              key={group.id}
              definition={group}
              series={selected.series}
            />
          ))}
        </div>
        <HealthDetails signals={analytics.health.signals} />
      </Section>
      <CapacityAnalysis analytics={analytics} range={range} />
    </>
  );
}

function LatestMetrics({
  analytics,
  definition,
}: {
  analytics: ResourceAnalytics;
  definition: ResourceMetricDefinition;
}) {
  const observedAt = latestTimestamp(
    definition.latest.map(({ key }) => analytics.latest[key]),
  );
  return (
    <Section
      title="Latest Metrics"
      action={
        <span
          className="text-muted-foreground text-xs whitespace-nowrap"
          title={formatMetricTimestamp(observedAt)}
        >
          Updated {formatMetricRelativeTime(observedAt, analytics.generatedAt)}
        </span>
      }
    >
      <p className="text-muted-foreground -mt-2 mb-4 text-xs leading-5">
        Most recently received monitoring datapoints. These timestamps are
        independent of inventory discovery.
      </p>
      <dl className="border-foreground/10 grid overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-4">
        {definition.latest.map(({ key, shortLabel }) => (
          <LatestMetric
            key={key}
            label={shortLabel}
            metric={analytics.latest[key]}
            generatedAt={analytics.generatedAt}
          />
        ))}
        <LatestHealth
          health={analytics.health.overall}
          generatedAt={analytics.generatedAt}
        />
      </dl>
      <p className="text-muted-foreground mt-2 text-[11px]">
        Freshness warning threshold: {analytics.freshnessThresholdMinutes}{" "}
        minutes
      </p>
    </Section>
  );
}

function LatestMetric({
  label,
  metric,
  generatedAt,
}: {
  label: string;
  metric?: LatestMetricData;
  generatedAt: string;
}) {
  const availability = metric?.value.availability ?? "no_data";
  const available = availability === "available" || availability === "stale";
  return (
    <div className="border-foreground/7 min-w-0 border-b px-4 py-3.5 lg:border-r lg:nth-[4n]:border-r-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1.5 min-h-6 font-mono text-lg font-medium tracking-tight">
        {available && metric
          ? formatMetricValue(metric.value.value, metric.value.unit)
          : availabilityLabel(availability)}
      </dd>
      <MetricAvailabilityDetail
        availability={availability}
        message={metric?.value.message}
      />
      {available && metric?.value.timestamp ? (
        <p
          className="text-muted-foreground mt-1.5 truncate text-[10px]"
          title={formatMetricTimestamp(metric.value.timestamp)}
        >
          {formatMetricTimestamp(metric.value.timestamp)} ·{" "}
          {formatMetricRelativeTime(metric.value.timestamp, generatedAt)}
        </p>
      ) : null}
    </div>
  );
}

function LatestHealth({
  health,
  generatedAt,
}: {
  health: HealthSignal;
  generatedAt: string;
}) {
  const tone =
    health.status === "healthy"
      ? "success"
      : health.status === "degraded"
        ? "warning"
        : "neutral";
  return (
    <div className="border-foreground/7 min-w-0 border-b px-4 py-3.5 lg:border-r lg:nth-[4n]:border-r-0">
      <dt className="text-muted-foreground text-xs">Health</dt>
      <dd className="mt-2">
        <StatusBadge status={tone}>{healthLabel(health.status)}</StatusBadge>
      </dd>
      {health.timestamp ? (
        <p
          className="text-muted-foreground mt-2 truncate text-[10px]"
          title={formatMetricTimestamp(health.timestamp)}
        >
          {formatMetricTimestamp(health.timestamp)} ·{" "}
          {formatMetricRelativeTime(health.timestamp, generatedAt)}
        </p>
      ) : null}
    </div>
  );
}

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange(value: TimeRange): void;
}) {
  return (
    <div
      className="border-foreground/15 flex shrink-0 rounded-lg border p-0.5"
      role="group"
      aria-label="Historical metric time range"
    >
      {RANGES.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.accessibleLabel}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "focus-visible:outline-accent rounded-md px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
            value === option.value
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MetricGroup({
  definition,
  series,
}: {
  definition: MetricGroupDefinition;
  series: Record<string, MetricSeries>;
}) {
  const metrics = definition.keys
    .map((key) => series[key])
    .filter((metric): metric is MetricSeries => Boolean(metric));
  const chartMetrics = metrics.filter(
    (metric) => metric.availability === "available" && metric.points.length > 0,
  );
  return (
    <article className="border-foreground/10 min-w-0 rounded-xl border p-4">
      <h3 className="text-sm font-medium">{definition.title}</h3>
      <p className="text-muted-foreground mt-0.5 text-xs">
        {definition.description}
      </p>
      {metrics.length === 0 ? (
        <MetricUnavailableState availability="no_data" />
      ) : (
        <>
          <dl
            className={cn(
              "mt-4 grid gap-x-4 gap-y-4",
              definition.presentation === "distribution"
                ? "grid-cols-3"
                : metrics.length > 3
                  ? "grid-cols-2 sm:grid-cols-3"
                  : "grid-cols-2",
            )}
          >
            {definition.presentation === "distribution" ? (
              metrics[0].availability === "available" ? (
                <DistributionSummary metric={metrics[0]} />
              ) : (
                <div className="col-span-3">
                  <MetricUnavailableState
                    availability={metrics[0].availability}
                    message={metrics[0].message}
                    label={metrics[0].label}
                  />
                </div>
              )
            ) : (
              metrics.map((metric) => (
                <SeriesStat
                  key={metric.key}
                  metric={metric}
                  useTotal={definition.presentation === "totals"}
                />
              ))
            )}
          </dl>
          {definition.chart !== "none" && chartMetrics.length ? (
            <MetricChart metrics={chartMetrics} />
          ) : null}
        </>
      )}
    </article>
  );
}

function DistributionSummary({ metric }: { metric: MetricSeries }) {
  return (
    <>
      {(["average", "p95", "maximum"] as const).map((stat) => (
        <CompactStat
          key={stat}
          label={
            stat === "p95" ? "P95" : `${stat[0].toUpperCase()}${stat.slice(1)}`
          }
          value={formatMetricValue(metric.summary?.[stat], metric.unit)}
        />
      ))}
    </>
  );
}

function SeriesStat({
  metric,
  useTotal,
}: {
  metric: MetricSeries;
  useTotal: boolean;
}) {
  if (metric.availability !== "available")
    return (
      <div>
        <dt className="text-muted-foreground text-[11px]">{metric.label}</dt>
        <dd className="mt-1 text-xs">
          {availabilityLabel(metric.availability)}
        </dd>
      </div>
    );
  const value = useTotal ? metric.summary?.total : metric.points.at(-1)?.value;
  const unit = useTotal ? (metric.totalUnit ?? metric.unit) : metric.unit;
  return (
    <CompactStat
      label={useTotal ? `Total ${metric.label.toLowerCase()}` : metric.label}
      value={formatMetricValue(value, unit)}
    />
  );
}

function MetricChart({ metrics }: { metrics: MetricSeries[] }) {
  const width = 640,
    height = 112,
    padding = 8;
  const maximum = Math.max(
    ...metrics.flatMap((metric) => metric.points.map(({ value }) => value)),
    1,
  );
  return (
    <figure className="mt-4 min-w-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-28 w-full"
        role="img"
        aria-label={`${metrics.map(({ label }) => label).join(" and ")} historical time series`}
      >
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={padding + line * 32}
            y2={padding + line * 32}
            className="stroke-foreground/7"
          />
        ))}
        {metrics.map((metric, metricIndex) => (
          <polyline
            key={metric.key}
            points={chartPoints(metric, maximum, width, height, padding)}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            className={
              metricIndex === 0 ? "text-accent" : "text-muted-foreground"
            }
          />
        ))}
      </svg>
      <figcaption className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {metrics.map((metric, index) => (
          <span key={metric.key} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                "h-0.5 w-3",
                index === 0 ? "bg-accent" : "bg-muted-foreground",
              )}
            />
            {metric.label}
          </span>
        ))}
      </figcaption>
      <div className="text-muted-foreground mt-2 flex justify-between text-[10px]">
        <time dateTime={metrics[0].points[0]?.timestamp}>
          {formatMetricTimestamp(metrics[0].points[0]?.timestamp ?? null)}
        </time>
        <time dateTime={metrics[0].points.at(-1)?.timestamp}>
          {formatMetricTimestamp(metrics[0].points.at(-1)?.timestamp ?? null)}
        </time>
      </div>
    </figure>
  );
}

function HealthDetails({ signals }: { signals: HealthSignal[] }) {
  return (
    <div className="border-foreground/10 mt-4 rounded-xl border p-4">
      <h3 className="text-sm font-medium">Resource health</h3>
      <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {signals.map((signal) => (
          <div
            key={signal.key}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span className="text-muted-foreground">{signal.label}</span>
            <span
              className={cn(
                "font-medium",
                signal.status === "healthy"
                  ? "text-success"
                  : "text-amber-600 dark:text-amber-300",
              )}
            >
              {healthLabel(signal.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CapacityAnalysis({
  analytics,
  range,
}: {
  analytics: ResourceAnalytics;
  range: TimeRange;
}) {
  const selected = analytics.ranges[range];
  if (!selected) return null;
  const observed = selected.capacityAnalysis.observedMetricKeys
    .map((key) => selected.series[key])
    .filter((metric): metric is MetricSeries => Boolean(metric));
  return (
    <Section title="Capacity Analysis">
      <div className="border-foreground/10 rounded-xl border p-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
          <div>
            <p className="text-muted-foreground text-xs">
              Current configuration
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-4">
              <CompactStat
                label="Resource class"
                value={analytics.capacity.resourceClass}
              />
              {analytics.capacity.attributes.map((attribute) => (
                <CompactStat
                  key={attribute.label}
                  label={attribute.label}
                  value={attribute.value}
                />
              ))}
            </dl>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              Observed utilization ·{" "}
              {RANGES.find(({ value }) => value === range)?.accessibleLabel}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {observed.flatMap((metric) =>
                metric.availability === "available"
                  ? [
                      <CompactStat
                        key={`${metric.key}-average`}
                        label={`${shortMetricLabel(metric.label)} Average`}
                        value={formatMetricValue(
                          metric.summary?.average,
                          metric.unit,
                        )}
                      />,
                      <CompactStat
                        key={`${metric.key}-p95`}
                        label={`${shortMetricLabel(metric.label)} P95`}
                        value={formatMetricValue(
                          metric.summary?.p95,
                          metric.unit,
                        )}
                      />,
                    ]
                  : [
                      <CompactStat
                        key={metric.key}
                        label={shortMetricLabel(metric.label)}
                        value="Unavailable"
                      />,
                    ],
              )}
            </dl>
          </div>
          <div className="lg:text-right">
            <p className="text-muted-foreground text-xs">Overall utilization</p>
            <div className="mt-3">
              <StatusBadge
                status={
                  selected.capacityAnalysis.classification === "High"
                    ? "warning"
                    : "neutral"
                }
              >
                {selected.capacityAnalysis.classification}
              </StatusBadge>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function MetricAvailabilityDetail({
  availability,
  message,
}: {
  availability: MetricAvailability;
  message?: string;
}) {
  if (availability === "available") return null;
  return (
    <p
      className={cn(
        "mt-1 text-[10px] leading-4",
        availability === "stale"
          ? "text-amber-600 dark:text-amber-300"
          : "text-muted-foreground",
      )}
    >
      <span className="font-medium">{availabilityLabel(availability)}</span>
      {message ? ` · ${message}` : ""}
    </p>
  );
}

function MetricUnavailableState({
  availability,
  message,
  label,
}: {
  availability: MetricAvailability;
  message?: string;
  label?: string;
}) {
  const icon =
    availability === "loading" ? (
      <LoaderCircle className="animate-spin" size={16} />
    ) : availability === "error" ? (
      <AlertTriangle size={16} />
    ) : availability === "stale" ? (
      <Clock3 size={16} />
    ) : (
      <Inbox size={16} />
    );
  return (
    <div
      className="text-muted-foreground border-foreground/10 flex min-h-24 items-center justify-center rounded-lg border border-dashed px-4 text-center"
      role={availability === "error" ? "alert" : "status"}
    >
      <div>
        <span className="mb-2 flex justify-center" aria-hidden="true">
          {icon}
        </span>
        <p className="text-foreground text-sm font-medium">
          {label && availability === "unavailable"
            ? `${shortMetricLabel(label)} metrics unavailable`
            : availabilityLabel(availability)}
        </p>
        <p className="mt-1 text-xs">
          {message ?? defaultAvailabilityMessage(availability)}
        </p>
      </div>
    </div>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-[11px]">{label}</dt>
      <dd
        className="mt-1 font-mono text-sm font-medium break-words"
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function chartPoints(
  metric: MetricSeries,
  maximum: number,
  width: number,
  height: number,
  padding: number,
) {
  return metric.points
    .map(
      ({ value }, index) =>
        `${metric.points.length === 1 ? width / 2 : (index / (metric.points.length - 1)) * width},${height - padding - (value / maximum) * (height - padding * 2)}`,
    )
    .join(" ");
}

function latestTimestamp(metrics: (LatestMetricData | undefined)[]) {
  const timestamps = metrics.flatMap((metric) =>
    metric?.value.timestamp ? [metric.value.timestamp] : [],
  );
  return timestamps.sort().at(-1) ?? null;
}

function availabilityLabel(availability: MetricAvailability) {
  return {
    available: "Available",
    unavailable: "Unavailable",
    no_data: "No data",
    loading: "Loading…",
    stale: "Stale",
    error: "Error",
  }[availability];
}

function defaultAvailabilityMessage(availability: MetricAvailability) {
  return {
    available: "",
    unavailable: "This metric is not collected for this resource.",
    no_data: "No datapoints were returned for this period.",
    loading: "Metric data is being loaded.",
    stale: "The latest datapoint may no longer represent current utilization.",
    error: "Metric data could not be loaded.",
  }[availability];
}

function healthLabel(status: HealthSignal["status"]) {
  return {
    healthy: "Healthy",
    degraded: "Degraded",
    unhealthy: "Unhealthy",
    unknown: "Unknown",
  }[status];
}

function shortMetricLabel(label: string) {
  return label.replace(" utilization", "");
}
