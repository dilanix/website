import type { TourStep } from "../types";

/** Anchors the sync panel sets (`data-tour={syncPanelAnchors.x}`). It shows on
 *  the Sync page and on a connection's Sync & Activity tab, so both tours walk
 *  it with these steps; per-run anchors sit on the newest run. */
export const syncPanelAnchors = {
  health: "sync-panel.health",
  automatic: "sync-panel.automatic",
  schedule: "sync-panel.schedule",
  syncNow: "sync-panel.sync-now",
  planning: "sync-panel.planning",
  start: "sync-panel.start",
  run: "sync-panel.run",
  totals: "sync-panel.totals",
  job: "sync-panel.job",
} as const;

/** What a tour asks the panel to show; it closes it again when the tour
 *  moves on. */
export type SyncPanelTourRequest = "schedules" | "sync-now" | "latest-run";

const anchors = syncPanelAnchors;

/** The panel's steps, with the page's own `prepare` actions: `panel` shows
 *  the panel, the others also open the schedules dialog, the Sync now dialog,
 *  or the newest run. */
export function syncPanelSteps(prepare: {
  panel: string;
  schedules: string;
  syncNow: string;
  latestRun: string;
}): TourStep[] {
  return [
    {
      id: "sync-health",
      target: anchors.health,
      prepare: prepare.panel,
      placement: "bottom",
      title: "Dataset sync health",
      body: "Freshness of each dataset this connection can sync, separate from its verification:\nHealthy — the latest syncs succeeded, on time.\nDegraded — the latest sync failed for some accounts.\nFailing — it failed for every account.\nDelayed — no success for over twice its schedule.\nNever synced — not synced yet.",
    },
    {
      id: "sync-automatic",
      target: anchors.automatic,
      prepare: prepare.panel,
      placement: "bottom",
      title: "Automatic sync",
      body: "How many datasets refresh on a schedule, and when the next run is. Nothing syncs on its own until you turn a schedule on — Configure opens them.",
    },
    {
      id: "sync-schedule",
      target: anchors.schedule,
      prepare: prepare.schedules,
      placement: "bottom",
      title: "A dataset's schedule",
      body: "Tick a dataset to keep it fresh and pick how often it runs — every hour up to every 24 hours. Each dataset has its own schedule, so the bill needn't refresh as often as inventory. Changes save as you make them; the tour only looks.",
    },
    {
      id: "sync-now",
      target: anchors.syncNow,
      prepare: prepare.panel,
      placement: "left",
      title: "Sync now",
      body: "Pulls the latest data right away, for every verified account of the connection.",
    },
    {
      id: "sync-planning",
      target: anchors.planning,
      prepare: prepare.syncNow,
      placement: "bottom",
      title: "Which datasets",
      body: "Automatic — Dilanix picks every dataset your organization's access and this connection's capabilities allow.\nSelect manually — run only the ones you tick.\nA dataset already syncing for an account can't start again until it finishes.",
    },
    {
      id: "sync-start",
      target: anchors.start,
      prepare: prepare.syncNow,
      placement: "top",
      title: "Start sync",
      body: "Queues the run, and it shows at the top of the history. The tour closes this without starting one.",
    },
    {
      id: "sync-run",
      target: anchors.run,
      prepare: prepare.panel,
      placement: "bottom",
      title: "A sync run",
      body: "Each sync is a run: queued, running, succeeded, partially succeeded (some jobs failed), failed or cancelled — what started it (manual or scheduled), how long it took and when. Cancel stops a queued or running sync; running jobs stop at a safe point.",
    },
    {
      id: "sync-totals",
      target: anchors.totals,
      prepare: prepare.latestRun,
      placement: "bottom",
      title: "What it brought",
      body: "Records read, created, updated and deleted, per dataset, across every account and scope of the run. An open running run updates live.",
    },
    {
      id: "sync-job",
      target: anchors.job,
      prepare: prepare.latestRun,
      placement: "top",
      title: "Its jobs",
      body: "One job per account, dataset and region (or billing period). Click a job for its records, strategy and attempts. Temporary errors, like AWS throttling, are retried automatically; a permission or setting error stops it until fixed — Show attempt history has each try's error.",
    },
  ];
}
