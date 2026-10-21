import type { TourDefinition } from "../types";
import { syncPanelSteps } from "./sync-panel";

export const SYNC_TOUR_KEY = "manage.sync";

/** Anchors the Sync page sets (`data-tour={syncAnchors.x}`). Per-connection
 *  anchors sit on every row; the tour shows the first. */
export const syncAnchors = {
  howItWorks: "sync.how-it-works",
  connection: "sync.connection",
  synced: "sync.synced",
  datasets: "sync.datasets",
  state: "sync.state",
  actions: "sync.actions",
  footer: "sync.footer",
} as const;

/** Actions the Sync page registers for this tour (`usePageTour`). */
export const syncActions = {
  openRow: "open-first-connection",
  schedules: "open-first-schedules",
  syncNow: "open-first-sync-now",
  latestRun: "open-first-latest-run",
} as const;

const anchors = syncAnchors;

export const syncTour: TourDefinition = {
  key: SYNC_TOUR_KEY,
  version: 1,
  title: "Sync",
  description: "Health, schedules, Sync now and a run's jobs.",
  section: "manage",
  route: "/dashboard/sync",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Sync",
      body: "Sync is every connection's data refresh in one place: what's running, what's healthy and what needs attention — and where you sync or change schedules.",
    },
    {
      id: "how-it-works",
      target: anchors.howItWorks,
      placement: "left",
      title: "The video guide",
      body: "How it works plays a two-minute animated guide to datasets, runs, schedules, retries and health. Replay it anytime here or from Help & Support.",
    },
    {
      id: "connection",
      target: anchors.connection,
      placement: "bottom",
      title: "A connection",
      body: "Each row is a connection, with its provider and status.",
    },
    {
      id: "synced",
      target: anchors.synced,
      placement: "bottom",
      title: "Last synced",
      body: "When the connection last synced successfully.",
    },
    {
      id: "datasets",
      target: anchors.datasets,
      placement: "bottom",
      title: "Datasets healthy",
      body: "How many of the datasets it can sync are healthy.",
    },
    {
      id: "state",
      target: anchors.state,
      placement: "left",
      title: "Status",
      body: "Syncing — a run is going.\nFailing — a dataset fails for every account.\nNeeds attention — a dataset is delayed or fails for some accounts.\nNever synced — no sync yet.\nHealthy — every dataset is fine.\nNo datasets — nothing to sync yet: switch a capability on under Access.",
    },
    {
      id: "actions",
      target: anchors.actions,
      placement: "left",
      title: "Details",
      body: "Details opens the connection's sync panel right here; ⋮ → Open connection goes to its Sync & Activity tab.",
    },
    ...syncPanelSteps({
      panel: syncActions.openRow,
      schedules: syncActions.schedules,
      syncNow: syncActions.syncNow,
      latestRun: syncActions.latestRun,
    }),
    {
      id: "footer",
      target: anchors.footer,
      placement: "top",
      title: "Each on its own schedule",
      body: "Every connection, and every dataset in it, syncs on its own schedule. A spinner beside Sync in the menu means a sync is running; a red dot means one is failing, an amber dot that one needs attention.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Replay this tour or the How Sync works video anytime from Help & Support.",
    },
  ],
};
