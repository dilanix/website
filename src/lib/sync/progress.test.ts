import { describe, expect, it } from "vitest";
import type { CoreSyncJob } from "@/lib/core/api";
import { stageProgress } from "./progress";

function job(overrides: Partial<CoreSyncJob>): CoreSyncJob {
  return {
    id: "job-1",
    target_id: "target-1",
    dataset: "inventory.resources",
    strategy: "snapshot",
    status: "running",
    attempt: 1,
    records_read: 0,
    records_created: 0,
    records_updated: 0,
    records_deleted: 0,
    total_stages: null,
    completed_stages: 0,
    current_stage: null,
    error_code: null,
    error_message: null,
    started_at: null,
    heartbeat_at: null,
    finished_at: null,
    cancel_requested_at: null,
    ...overrides,
  };
}

describe("stageProgress", () => {
  it("returns null when total_stages is unknown", () => {
    expect(stageProgress(job({ total_stages: null }))).toBeNull();
  });

  it("returns null when total_stages is zero", () => {
    expect(
      stageProgress(job({ total_stages: 0, completed_stages: 0 })),
    ).toBeNull();
  });

  it("computes a rounded percentage and a fraction label", () => {
    expect(
      stageProgress(job({ total_stages: 3, completed_stages: 1 })),
    ).toEqual({
      percent: 33,
      label: "1 / 3",
    });
  });

  it("reaches 100% once every stage completes", () => {
    expect(
      stageProgress(job({ total_stages: 20, completed_stages: 20 })),
    ).toEqual({ percent: 100, label: "20 / 20" });
  });

  it("clamps a completed count above total defensively", () => {
    expect(
      stageProgress(job({ total_stages: 5, completed_stages: 7 })),
    ).toEqual({ percent: 100, label: "5 / 5" });
  });
});
