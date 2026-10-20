import type { GuideDefinition } from "../types";

export const SYNC_GUIDE_KEY = "guide.sync";

export const syncGuide: GuideDefinition = {
  key: SYNC_GUIDE_KEY,
  version: 1,
  title: "How Sync works",
  description: "Datasets, runs, schedules and health, from the first sync on.",
  section: "manage",
  tours: ["manage.sync", "manage.connection"],
  scenes: [
    {
      id: "intro",
      title: "Sync keeps Dilanix fresh",
      caption:
        "Dilanix reads your cloud into a few datasets, and every product works from them. Sync is how each dataset refreshes — on a schedule, or whenever you ask.",
      durationMs: 9000,
    },
    {
      id: "datasets",
      title: "Datasets and what they need",
      caption:
        "Inventory Read brings resources and runtime interactions, Billing Read the Cost Explorer summary and the line-by-line FOCUS bill (which also needs the stack's export), Metrics Read CloudWatch utilization. A dataset syncs only when its capability is on.",
      durationMs: 12000,
    },
    {
      id: "first-sync",
      title: "Run the first sync",
      caption:
        "Nothing is read until the first sync. On the connection's Sync & Activity tab — or in Sync — click Sync now. Automatic picks every dataset you have access to; Select manually runs only the ones you tick.",
      durationMs: 12000,
    },
    {
      id: "run-jobs",
      title: "A run, split into jobs",
      caption:
        "Every sync is a run, split into jobs — one per account, dataset and region or billing period. Jobs run side by side, and an open run updates live with the records read, created and updated.",
      durationMs: 12000,
    },
    {
      id: "schedules",
      title: "Automatic sync",
      caption:
        "Turn on a schedule per dataset and pick how often — from every hour to every 24 hours. Inventory can refresh hourly while the bill refreshes daily. When a schedule is due, Dilanix starts the run itself.",
      durationMs: 12000,
    },
    {
      id: "retries",
      title: "When something fails",
      caption:
        "Temporary problems, like AWS throttling, are retried automatically. A missing permission or a wrong setting stops that job until it's fixed — its attempt history shows the error. Other jobs carry on.",
      durationMs: 12000,
    },
    {
      id: "safety",
      title: "Nothing goes missing by accident",
      caption:
        "A resource counts as gone only after a complete sync of its account, region and type no longer finds it. A sync that fails or is cancelled part-way never marks anything missing.",
      durationMs: 11000,
    },
    {
      id: "health",
      title: "Health per dataset",
      caption:
        "Healthy — the latest syncs succeeded on time. Degraded — failed for some accounts. Failing — failed for all. Delayed — no success for twice its schedule. A connection can be verified while one dataset fails.",
      durationMs: 12000,
    },
    {
      id: "watch",
      title: "Keep an eye on it",
      caption:
        "Sync in the menu lists every connection with its last sync, healthy datasets and status. A spinner beside Sync means a sync is running; a red dot means one is failing, an amber dot that one needs attention.",
      durationMs: 11000,
    },
    {
      id: "outcome",
      title: "Fresh data everywhere",
      caption:
        "New data flows straight into Resources, the infrastructure graph, Cost and Recommendations — and a connection's first successful sync starts a recommendation scan right away.",
      durationMs: 9000,
    },
  ],
};
