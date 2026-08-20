import type { MetricUnit } from "./types";

export interface MetricEvidence {
  unit: MetricUnit;
  bucket_count: number;
  sample_count: number;
  average: number;
  p95: number;
  minimum: number;
  maximum: number;
  total: number;
  trend_percent: number | null;
  first_bucket_at: string;
  last_bucket_at: string;
}

export interface AnalysisSignal {
  key: string;
  severity: "info" | "warning";
  metric_keys: string[];
}

export interface ResourceEvidence {
  id: string;
  analysisType: string;
  schemaVersion: string;
  windowStart: string;
  windowEnd: string;
  updatedAt: string;
  resourceType: string;
  metrics: Record<string, MetricEvidence>;
  signals: AnalysisSignal[];
  quality: {
    status: "good" | "partial" | "insufficient";
    score: number;
    metric_coverage_percent: number;
    temporal_coverage_percent: number;
    expected_metric_keys: string[];
    missing_metric_keys: string[];
    latest_bucket_at: string | null;
  };
}
