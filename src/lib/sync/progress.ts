import type { CoreSyncJob } from "@/lib/core/api";

export interface StageProgress {
  /** 0-100, rounded. */
  percent: number;
  /** e.g. "12 / 20". */
  label: string;
}

/**
 * `total_stages` is `null` whenever a collector never reports a bounded unit
 * count upfront (`SyncJobProgressReporter.set_total_stages`) — "unknown", not
 * zero, so no progress bar should render rather than dividing by it
 * (`SYNC_INGESTION_ARCHITECTURE.md`: "percentages require a meaningful
 * denominator"). `completed_stages` is clamped to `total_stages` purely as a
 * defensive display guard against a theoretical off-by-one upstream, never
 * expected in practice.
 */
export function stageProgress(job: CoreSyncJob): StageProgress | null {
  if (job.total_stages === null || job.total_stages <= 0) return null;
  const completed = Math.min(job.completed_stages, job.total_stages);
  return {
    percent: Math.round((completed / job.total_stages) * 100),
    label: `${completed} / ${job.total_stages}`,
  };
}
