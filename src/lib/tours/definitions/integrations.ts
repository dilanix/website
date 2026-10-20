import type { TourDefinition } from "../types";

export const INTEGRATIONS_TOUR_KEY = "manage.integrations";

/** Anchors the Integrations page sets (`data-tour={integrationsAnchors.x}`).
 *  Per-provider and per-connection anchors sit on every card and row; the
 *  tour shows the first. */
export const integrationsAnchors = {
  howItWorks: "integrations.how-it-works",
  stats: "integrations.stats",
  provider: "integrations.provider",
  connect: "integrations.connect",
  counts: "integrations.counts",
  connection: "integrations.connection",
  connectName: "integrations.connect-name",
  connectSubmit: "integrations.connect-submit",
} as const;

/** Actions the Integrations page registers for this tour (`usePageTour`). */
export const integrationsActions = {
  openConnect: "open-connect-dialog",
} as const;

const anchors = integrationsAnchors;

export const integrationsTour: TourDefinition = {
  key: INTEGRATIONS_TOUR_KEY,
  version: 1,
  title: "Integrations",
  description: "Providers, connections and adding one, step by step.",
  section: "manage",
  route: "/dashboard/integrations",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Integrations",
      body: "Integrations is where Dilanix connects to your cloud. Each connection reads one provider — today AWS — through a read-only role in your accounts. This tour shows the page and how to add a connection.",
    },
    {
      id: "how-it-works",
      target: anchors.howItWorks,
      placement: "left",
      title: "The video guide",
      body: "How it works plays a two-minute animated guide: connecting AWS, the read-only role, accounts, access and scopes. Replay it anytime here or from Help & Support.",
    },
    {
      id: "stats",
      target: anchors.stats,
      placement: "bottom",
      title: "At a glance",
      body: "Providers you can see, your connections, and how many need attention — a connection whose last verification failed.",
    },
    {
      id: "provider",
      target: anchors.provider,
      placement: "right",
      title: "A provider",
      body: "Providers are grouped by kind: Cloud, Platform, AI, Developer Tools. Coming soon marks one Dilanix can't connect to yet.",
    },
    {
      id: "connect",
      target: anchors.connect,
      placement: "bottom",
      title: "Add connection",
      body: "Starts a new connection to this provider. Not enabled means your organization's plan doesn't include the provider yet — contact Dilanix.",
    },
    {
      id: "counts",
      target: anchors.counts,
      placement: "right",
      title: "Connected and needing attention",
      body: "How many of this provider's connections are connected, and how many need attention.",
    },
    {
      id: "connection",
      target: anchors.connection,
      placement: "bottom",
      title: "A connection",
      body: "Its name, when it last synced, and its status:\nDraft — created, no account verified yet.\nConnected — an account is verified; it can sync.\nError — the last verification failed; open it and Re-verify.\nDisabled — paused; data kept.\nManage opens it — its own tour covers every tab.",
    },
    {
      id: "connect-name",
      target: anchors.connectName,
      prepare: integrationsActions.openConnect,
      placement: "bottom",
      title: "Name the connection",
      body: "Name it after what it covers, e.g. AWS Production. You can rename it later.",
    },
    {
      id: "connect-submit",
      target: anchors.connectSubmit,
      prepare: integrationsActions.openConnect,
      placement: "top",
      title: "Connect, then AWS setup",
      body: "Connect creates the connection as a draft and opens AWS setup:\n1. Launch in AWS CloudFormation, signed in to the account to connect — paste the External ID shown, and create the stack.\n2. Verify — enter its 12-digit account ID; Dilanix assumes the role and confirms the account.\nThe tour closes this without creating anything.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Once connected, open the connection: switch on what Dilanix reads under Access, then run the first sync. Replay this tour or the video anytime from Help & Support.",
    },
  ],
};
