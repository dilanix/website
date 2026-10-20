import type { TourDefinition } from "../types";
import { syncPanelSteps } from "./sync-panel";

export const CONNECTION_TOUR_KEY = "manage.connection";

/** Anchors a connection's page sets (`data-tour={connectionAnchors.x}`).
 *  Per-account anchors sit on every target; the tour shows the first. */
export const connectionAnchors = {
  header: "connection.header",
  tabs: "connection.tabs",
  details: "connection.details",
  cloudData: "connection.cloud-data",
  capabilities: "connection.capabilities",
  scopes: "connection.scopes",
  scopeType: "connection.scope-type",
  scopeKey: "connection.scope-key",
  identity: "connection.identity",
  target: "connection.target",
  targetActions: "connection.target-actions",
  addTarget: "connection.add-target",
  modify: "connection.modify",
  lifecycle: "connection.lifecycle",
  purge: "connection.purge",
} as const;

/** Actions a connection's page registers for this tour (`usePageTour`). */
export const connectionActions = {
  overview: "show-overview-tab",
  access: "show-access-tab",
  scopeForm: "open-scope-form",
  activity: "show-activity-tab",
  schedules: "open-sync-schedules",
  syncNow: "open-sync-now",
  latestRun: "open-latest-sync-run",
  settings: "show-settings-tab",
} as const;

const anchors = connectionAnchors;
const actions = connectionActions;

export const connectionTour: TourDefinition = {
  key: CONNECTION_TOUR_KEY,
  version: 1,
  title: "A connection",
  description: "Every tab: access, scopes, accounts, sync and settings.",
  section: "manage",
  // One connection's page: offered there only.
  route: null,
  steps: [
    {
      id: "welcome",
      title: "Your connection",
      body: "Everything about one connection lives on this page, in four tabs. This tour goes through each: what Dilanix reads and where, the accounts it reads, its sync, and its settings.",
    },
    {
      id: "header",
      target: anchors.header,
      prepare: actions.overview,
      placement: "bottom",
      title: "Status",
      body: "The provider, the connection's status and when it was last verified:\nDraft — no account verified yet.\nConnected — an account is verified; it can sync.\nError — the last verification failed, e.g. the role was deleted. Re-verify on Settings fixes it.\nDisabled — paused; its data is kept.",
    },
    {
      id: "tabs",
      target: anchors.tabs,
      prepare: actions.overview,
      placement: "bottom",
      title: "Four tabs",
      body: "Overview, Access — its count is the capabilities switched on plus scopes — Sync & Activity, and Settings.",
    },
    {
      id: "details",
      target: anchors.details,
      prepare: actions.overview,
      placement: "right",
      title: "Connection details",
      body: "The provider, the account it resolved to, when it was last verified, and its last successful sync.",
    },
    {
      id: "cloud-data",
      target: anchors.cloudData,
      prepare: actions.overview,
      placement: "left",
      title: "Its data",
      body: "Shortcuts to this connection's Resources and Costs — shown once Inventory Read or Billing Read is switched on.",
    },
    {
      id: "capabilities",
      target: anchors.capabilities,
      prepare: actions.access,
      placement: "bottom",
      title: "Capabilities: what Dilanix reads",
      body: "Only what your organization's plan grants is listed. Tick and Save changes:\nInventory Read — resources, the infrastructure graph and runtime interactions.\nBilling Read — the Cost Explorer summary and the line-by-line FOCUS bill.\nMetrics Read — CloudWatch utilization.\nThe stack's matching permission must be on too.",
    },
    {
      id: "scopes",
      target: anchors.scopes,
      prepare: actions.access,
      placement: "bottom",
      title: "Scopes: where Dilanix looks",
      body: "Add each AWS region you use — inventory and metrics are read only there; with no region scope, a single default region is read. Remove a region and its resources turn Out of scope, kept as history.",
    },
    {
      id: "scope-type",
      target: anchors.scopeType,
      prepare: actions.scopeForm,
      placement: "bottom",
      title: "Scope type",
      body: "region. Accounts aren't scopes — they're the connection's targets, added by verifying them.",
    },
    {
      id: "scope-key",
      target: anchors.scopeKey,
      prepare: actions.scopeForm,
      placement: "bottom",
      title: "Scope key",
      body: "The region's code, e.g. eu-central-1. Add scope saves it — the tour closes this unsaved.",
    },
    {
      id: "identity",
      target: anchors.identity,
      prepare: actions.access,
      placement: "top",
      title: "Provider identity",
      body: "The accounts this connection reads — its targets. Each was verified: Dilanix assumed its role and AWS confirmed the account.",
    },
    {
      id: "target",
      target: anchors.target,
      prepare: actions.access,
      placement: "top",
      title: "An account",
      body: "Its label, account ID and status: verified, invalid (its last check failed) or disabled.",
    },
    {
      id: "target-actions",
      target: anchors.targetActions,
      prepare: actions.access,
      placement: "left",
      title: "Rename, replace, disable",
      body: "Rename gives it a label like Prod or Dev. Replace swaps it for another account in one step. Disable stops reading it — the other accounts carry on.",
    },
    {
      id: "add-target",
      target: anchors.addTarget,
      prepare: actions.access,
      placement: "left",
      title: "Add another account",
      body: "Create the same stack in that account, with this connection's External ID, then verify its ID here. It's added alongside the others.",
    },
    ...syncPanelSteps({
      panel: actions.activity,
      schedules: actions.schedules,
      syncNow: actions.syncNow,
      latestRun: actions.latestRun,
    }),
    {
      id: "modify",
      target: anchors.modify,
      prepare: actions.settings,
      placement: "bottom",
      title: "Modify and re-verify",
      body: "Modify renames the connection and shows its CloudFormation setup again. Re-verify checks an account again — e.g. after you update the stack.",
    },
    {
      id: "lifecycle",
      target: anchors.lifecycle,
      prepare: actions.settings,
      placement: "top",
      title: "Disable, enable, remove",
      body: "Disable pauses syncing and keeps the data; Enable asks for a fresh verification. Remove deletes a draft or disabled connection that has no history yet.",
    },
    {
      id: "purge",
      target: anchors.purge,
      prepare: actions.settings,
      placement: "top",
      title: "Delete permanently",
      body: "Erases the connection with every sync run, resource and cost row it owns. Disable it first; you confirm by typing its name.",
    },
    {
      id: "finish",
      target: anchors.tabs,
      prepare: actions.overview,
      placement: "bottom",
      title: "You're all set",
      body: "Replay this tour, or the How Integrations work and How Sync work videos, anytime from Help & Support.",
    },
  ],
};
