export type MetricKey = string;
export type MetricUnit =
  | "percent"
  | "bytes"
  | "bytes_per_second"
  | "iops"
  | "count"
  | "seconds"
  | "milliseconds";
export type MetricAvailability =
  "available" | "unavailable" | "no_data" | "loading" | "stale" | "error";
export type TimeRange = "24h" | "7d" | "30d";

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface MetricValue {
  value: number | null;
  unit: MetricUnit;
  timestamp: string | null;
  availability: MetricAvailability;
  message?: string;
}

export interface MetricSummary {
  average?: number;
  p95?: number;
  maximum?: number;
  minimum?: number;
  total?: number;
}

export interface MetricSeries {
  key: MetricKey;
  label: string;
  unit: MetricUnit;
  totalUnit?: MetricUnit;
  points: MetricPoint[];
  summary?: MetricSummary;
  availability: MetricAvailability;
  message?: string;
}

export interface LatestMetric {
  key: MetricKey;
  label: string;
  value: MetricValue;
}

export interface HealthSignal {
  key: string;
  label: string;
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  timestamp: string | null;
  message?: string;
}

export interface ResourceCapacity {
  resourceClass: string;
  attributes: { label: string; value: string }[];
}

export interface CapacityAnalysis {
  classification: "Low" | "Moderate" | "High";
  observedMetricKeys: MetricKey[];
}

export interface ResourceAnalyticsRange {
  range: TimeRange;
  startAt: string;
  endAt: string;
  series: Record<MetricKey, MetricSeries>;
  capacityAnalysis: CapacityAnalysis;
}

export interface ResourceAnalytics {
  resourceId: string;
  generatedAt: string;
  freshnessThresholdMinutes: number;
  latest: Record<MetricKey, LatestMetric>;
  health: { overall: HealthSignal; signals: HealthSignal[] };
  capacity: ResourceCapacity;
  ranges: Partial<Record<TimeRange, ResourceAnalyticsRange>>;
}

export interface LatestMetricDefinition {
  key: MetricKey;
  shortLabel: string;
}

export interface MetricGroupDefinition {
  id: string;
  title: string;
  description: string;
  keys: MetricKey[];
  chart: "single" | "multi" | "none";
  presentation: "distribution" | "totals" | "latest";
}

export interface ResourceMetricDefinition {
  latest: LatestMetricDefinition[];
  groups: MetricGroupDefinition[];
}
