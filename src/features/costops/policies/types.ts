export interface QualityPolicy {
  metric_weight: number;
  temporal_weight: number;
  good_min_score: number;
  partial_min_score: number;
}

export interface SignalPolicy {
  key: string;
  severity: "info" | "warning";
  metric_keys: string[];
  field: "average" | "p95" | "minimum" | "maximum" | "total" | "trend_percent";
  aggregation: "minimum" | "maximum" | "any";
  operator: "lt" | "le" | "gt" | "ge" | "eq";
  threshold: number;
}

export interface AnalysisPolicyDefinition {
  window_days: number;
  expected_metric_keys: string[];
  quality: QualityPolicy;
  signals: SignalPolicy[];
}

export interface AnalysisPolicy {
  id: string;
  analysisType: string;
  resourceType: string;
  version: string;
  definition: AnalysisPolicyDefinition;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
