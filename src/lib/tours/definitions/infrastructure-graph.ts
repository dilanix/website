import { sharedTourAnchors } from "../anchors";
import type { TourDefinition } from "../types";

export const INFRASTRUCTURE_GRAPH_TOUR_KEY = "infrastructure.graph";

/** Anchors the Graph components set (`data-tour={infrastructureGraphAnchors.x}`). */
export const infrastructureGraphAnchors = {
  scopeConnection: "infrastructure-graph.scope-connection",
  scopeAccount: "infrastructure-graph.scope-account",
  scopeRegion: "infrastructure-graph.scope-region",
  resolved: "infrastructure-graph.resolved",
  canvas: "infrastructure-graph.canvas",
  search: "infrastructure-graph.search",
  modes: "infrastructure-graph.modes",
  evidence: "infrastructure-graph.evidence",
  sources: "infrastructure-graph.sources",
  views: "infrastructure-graph.views",
  legend: "infrastructure-graph.legend",
  inspector: "infrastructure-graph.inspector",
  inspectorTabs: "infrastructure-graph.inspector-tabs",
  connection: "infrastructure-graph.connection",
  connectionStatus: "infrastructure-graph.connection-status",
  expandCollapse: "infrastructure-graph.expand-collapse",
  filters: "infrastructure-graph.filters",
  navigation: "infrastructure-graph.navigation",
  fullscreen: "infrastructure-graph.fullscreen",
} as const;

/** Actions the Graph page registers for this tour (`usePageTour`). */
export const infrastructureGraphActions = {
  /** Switches to Runtime; its cleanup switches back to Provisioned. */
  showRuntime: "show-runtime",
  /** Opens the most connected drawn resource; its cleanup closes it. */
  openResourceDetails: "open-resource-details",
  /** Opens one of that resource's connections; its cleanup closes it. */
  openConnectionDetails: "open-connection-details",
} as const;

const anchors = infrastructureGraphAnchors;
const actions = infrastructureGraphActions;

export const infrastructureGraphTour: TourDefinition = {
  key: INFRASTRUCTURE_GRAPH_TOUR_KEY,
  version: 2,
  title: "Infrastructure Graph",
  description: "Every control of the graph, step by step.",
  product: "infrastructure",
  route: "/dashboard/products/infrastructure",
  steps: [
    {
      id: "welcome",
      title: "Welcome to the Infrastructure Graph",
      body: "A live map of the cloud resources Dilanix collects and how they connect. This tour goes through every control: choosing what to map, searching, modes and views, reading boxes and lines, resource and connection details, and moving around the map.",
    },
    {
      id: "sections",
      target: sharedTourAnchors.productTabs,
      placement: "bottom",
      title: "Graph and Resources",
      body: "Infrastructure has two sections: this Graph, and Resources — a searchable, filterable inventory of every collected resource with its full details.",
    },
    {
      id: "scope-connection",
      target: anchors.scopeConnection,
      placement: "bottom",
      title: "Connection",
      body: "The cloud connection to map, e.g. AWS · Production. Only connections whose resource inventory your organization can access are listed.",
    },
    {
      id: "scope-account",
      target: anchors.scopeAccount,
      placement: "bottom",
      title: "Account",
      body: "The account to map. The graph shows one account at a time; switch here to see another.",
    },
    {
      id: "scope-region",
      target: anchors.scopeRegion,
      placement: "bottom",
      title: "Region",
      body: "All regions, or just one. Large accounts are quickest to explore region by region — when a scope is too big to draw in full, a notice says how many resources are shown and suggests picking a region.",
    },
    {
      id: "resolved",
      target: anchors.resolved,
      placement: "bottom",
      title: "Relationships resolved",
      body: "When Dilanix last worked out how these resources connect, from the latest inventory. After an inventory sync, new relationships appear within a few minutes.",
    },
    {
      id: "search",
      target: anchors.search,
      placement: "bottom",
      title: "Search",
      body: "Find a resource by name, ID, type or region — e.g. “orders-db” or “eu-west-1”. Pick a result or press Enter: the map zooms to it and opens its details. A counter at the bottom left shows how many resources match in this view.",
    },
    {
      id: "modes",
      target: anchors.modes,
      placement: "bottom",
      title: "Provisioned or Runtime",
      body: "Provisioned shows how your infrastructure is built: placement in VPCs and subnets, routing and security groups.\nRuntime shows how services work together — dependencies, traffic and access — as a flat data flow. Let's switch to Runtime for a moment.",
    },
    {
      id: "evidence",
      target: anchors.evidence,
      prepare: actions.showRuntime,
      placement: "bottom",
      title: "Runtime evidence",
      body: "Choose which evidence to draw:\nConfigured — declared in the provider's configuration.\nPermitted — security rules or routes allow it; not proof it's used.\nObserved — traffic actually seen in flow logs or traces.\nInferred — suggested by analysis, with a confidence.\nConfirmed — asserted by someone in your organization.",
    },
    {
      id: "sources",
      target: anchors.sources,
      prepare: actions.showRuntime,
      placement: "bottom",
      title: "Interaction sources",
      body: "Where runtime evidence comes from — e.g. service configuration, IAM policies, VPC Flow Logs, X-Ray or load balancer access logs. The count shows how many are being collected; open it to see each one's state and how to turn on the rest for a fuller picture.",
    },
    {
      id: "views",
      target: anchors.views,
      placement: "bottom",
      title: "Architecture, Network, Security",
      body: "Back in Provisioned, three views of the same resources:\nArchitecture — your services, grouped by VPC.\nNetwork — adds subnets, gateways and routing, with each resource inside its subnet.\nSecurity — adds security groups and other access controls, and the resources they apply to.",
    },
    {
      id: "canvas",
      target: anchors.canvas,
      title: "The map",
      body: "Drag to pan and scroll to zoom; zoomed out, the map simplifies to stay readable. Boxes are VPCs (and subnets in the Network view) — double-click a box to collapse or expand it. Drag a resource to move it.",
    },
    {
      id: "trace",
      target: anchors.canvas,
      title: "Trace connections",
      body: "Hover a resource to trace everything it connects to; the rest dims. A number on a resource is how many related resources are hidden — click it, or double-click the resource, to draw them. Esc clears the selection.",
    },
    {
      id: "legend",
      target: anchors.legend,
      placement: "top",
      title: "Reading the lines",
      body: "A line's color and style show the evidence behind the relationship: solid purple Configured, dashed amber Permitted, green Observed, dotted blue Inferred, cyan Confirmed. Click any line to see its details.",
    },
    {
      id: "details",
      target: anchors.inspector,
      prepare: actions.openResourceDetails,
      placement: "left",
      title: "Resource details",
      body: "Clicking a resource opens its details — here, the most connected one. The header shows its name, type and provider type, then its current status and Open in Resources for its full inventory page.",
    },
    {
      id: "details-tabs",
      target: anchors.inspectorTabs,
      prepare: actions.openResourceDetails,
      placement: "left",
      title: "What each tab shows",
      body: "Overview — identifiers, region, zone, first and last seen, capacity.\nNetwork and Security — its network and security relationships, with inbound and outbound rules for security groups.\nRelationships — everything it connects to; click one to jump there.\nExternal — outside endpoints it reaches.\nTraffic — whether its traffic was visible over the last 7 days.\nTags and Raw — its tags and the full collected configuration.",
    },
    {
      id: "connection",
      target: anchors.connection,
      prepare: actions.openConnectionDetails,
      placement: "left",
      title: "Connection details",
      body: "Clicking a line explains why two resources are connected — here, one of this resource's connections. It shows both ends (click either to jump to it), and its Overview, Path, Evidence and Raw data tabs.",
    },
    {
      id: "connection-status",
      target: anchors.connectionStatus,
      prepare: actions.openConnectionDetails,
      placement: "left",
      title: "Configured, reachable, observed?",
      body: "Configured — whether configuration declares the connection.\nReachability — whether security rules and routes let traffic through (the Path tab shows each check).\nObserved — whether traffic was actually seen.\nInternet path — whether it can be reached from the internet.",
    },
    {
      id: "expand-collapse",
      target: anchors.expandCollapse,
      placement: "bottom",
      title: "Expand and collapse all",
      body: "Expand all draws every resource's hidden neighbors at once; Collapse all folds every VPC into a compact overview.",
    },
    {
      id: "filters",
      target: anchors.filters,
      placement: "bottom",
      title: "Filter categories",
      body: "Hide the resource categories you don't need — e.g. Storage or Messaging — to focus the map on the rest.",
    },
    {
      id: "navigation",
      target: anchors.navigation,
      placement: "bottom",
      title: "Zoom, fit and reset",
      body: "Zoom out and in (the percentage is the current zoom), Fit to view to see everything, and Reset view to undo expansions, filters and search. The minimap at the bottom right shows where you are — drag it to move around.",
    },
    {
      id: "fullscreen",
      target: anchors.fullscreen,
      placement: "bottom",
      title: "Fullscreen",
      body: "Gives the graph the whole screen; press Esc to come back.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Replay this tour anytime from Help & Support — the question-mark button at the top of the page.",
    },
  ],
};
