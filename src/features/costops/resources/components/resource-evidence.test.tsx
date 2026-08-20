import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ResourceEvidence } from "../analytics/evidence-types";
import { ResourceEvidencePanel } from "./resource-evidence";

afterEach(cleanup);

const evidence: ResourceEvidence = {
  id: "snapshot-1",
  analysisType: "resource_utilization",
  schemaVersion: "1.0",
  windowStart: "2026-07-20T12:00:00Z",
  windowEnd: "2026-08-20T12:00:00Z",
  updatedAt: "2026-08-20T12:00:00Z",
  resourceType: "compute_instance",
  metrics: {
    "cpu.utilization": {
      unit: "percent",
      bucket_count: 30,
      sample_count: 720,
      average: 12.5,
      p95: 25,
      minimum: 1,
      maximum: 40,
      total: 9000,
      trend_percent: -5,
      first_bucket_at: "2026-07-20T00:00:00Z",
      last_bucket_at: "2026-08-19T00:00:00Z",
    },
  },
  signals: [
    {
      key: "low_utilization",
      severity: "info",
      metric_keys: ["cpu.utilization"],
    },
  ],
  quality: {
    status: "partial",
    score: 65,
    metric_coverage_percent: 75,
    temporal_coverage_percent: 50,
    expected_metric_keys: ["cpu.utilization", "memory.utilization"],
    missing_metric_keys: ["memory.utilization"],
    latest_bucket_at: "2026-08-19T00:00:00Z",
  },
};

describe("ResourceEvidencePanel", () => {
  it("renders quality, normalized facts, signals, and missing metrics", () => {
    render(<ResourceEvidencePanel evidence={evidence} />);
    expect(screen.getByText("Analysis Evidence")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(screen.getByText("Avg 12.5%")).toBeInTheDocument();
    expect(screen.getByText("Low Utilization")).toBeInTheDocument();
    expect(screen.getByText("memory.utilization")).toBeInTheDocument();
  });

  it("shows the pre-analysis state without inventing facts", () => {
    render(<ResourceEvidencePanel evidence={null} />);
    expect(
      screen.getByText(/No evidence snapshot is available yet/),
    ).toBeInTheDocument();
  });
});
