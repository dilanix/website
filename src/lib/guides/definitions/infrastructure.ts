import type { GuideDefinition } from "../types";

export const INFRASTRUCTURE_GUIDE_KEY = "guide.infrastructure";

export const infrastructureGuide: GuideDefinition = {
  key: INFRASTRUCTURE_GUIDE_KEY,
  version: 1,
  title: "How Infrastructure works",
  description:
    "The graph, its evidence and sources, and the resource inventory.",
  product: "infrastructure",
  tours: ["infrastructure.graph", "infrastructure.resources"],
  scenes: [
    {
      id: "intro",
      title: "Your cloud, mapped",
      caption:
        "Infrastructure has two sections: the Graph, a live map of your resources and how they connect, and Resources, a searchable inventory of every collected resource with its full details.",
      durationMs: 10000,
    },
    {
      id: "data",
      title: "What feeds it",
      caption:
        "With Inventory Read, two datasets sync: Inventory Resources — every resource and its configuration — and Runtime Interactions — how they work together, from service configuration, IAM, X-Ray, VPC flow logs, DNS query logs, load balancer access logs and AI inference. Relationships follow minutes after each inventory sync.",
      durationMs: 14000,
    },
    {
      id: "scope",
      title: "Choose what to map",
      caption:
        "Pick a connection, one account at a time, and all regions or one. Large accounts are quickest region by region — when a scope is too big to draw in full, a notice says how many resources are shown.",
      durationMs: 11000,
    },
    {
      id: "map",
      title: "Reading the map",
      caption:
        "Boxes are VPCs — and subnets in the Network view — with resources inside, and lines are relationships. Drag to pan, scroll to zoom; zoomed out, the map simplifies. Double-click a box to collapse or expand it.",
      durationMs: 12000,
    },
    {
      id: "trace",
      title: "Trace and search",
      caption:
        "Hover a resource to trace everything it connects to. A number on it counts hidden neighbors — click to draw them. Search by name, ID, type or region: the map zooms to the match and opens its details.",
      durationMs: 12000,
    },
    {
      id: "provisioned",
      title: "Provisioned: how it's built",
      caption:
        "Three views of the same resources. Architecture — your services, grouped by VPC. Network — adds subnets, gateways and routing. Security — adds security groups and other access controls, and what they apply to.",
      durationMs: 13000,
    },
    {
      id: "runtime",
      title: "Runtime: how it works together",
      caption:
        "Runtime drops the boxes and shows a flat data flow — which resources call each other, the traffic between them, what they're allowed to access, and the external hosts they reach.",
      durationMs: 11000,
    },
    {
      id: "evidence",
      title: "The evidence behind a line",
      caption:
        "Configured — declared in configuration. Permitted — rules or routes allow it; not proof it's used. Observed — traffic actually seen. Inferred — suggested by analysis, with a confidence. Confirmed — asserted by someone in your organization. A line shows its strongest evidence.",
      durationMs: 14000,
    },
    {
      id: "sources",
      title: "Interaction sources",
      caption:
        "Each source reads one kind of evidence: Collected, Nothing found, Partial, Not enabled, No permission or Failed. Turn on the ones you're missing — flow logs, Resolver query logging, ALB access logs, X-Ray — for a fuller picture.",
      durationMs: 13000,
    },
    {
      id: "coverage",
      title: "Not visible isn't unused",
      caption:
        "A resource's Traffic tab says whether its traffic could be seen: Visible, Partly visible, Not visible or Cannot be observed. When nothing covers it, a missing connection never means it's unused — the tab says what to turn on.",
      durationMs: 13000,
    },
    {
      id: "resource-details",
      title: "Resource details",
      caption:
        "Click a resource for its name, type and status, and Open in Resources. Overview has its identifiers and capacity; Network and Security its rules; Relationships everything it connects to; External the hosts it reaches; then Traffic, Tags and the raw configuration.",
      durationMs: 14000,
    },
    {
      id: "connection-details",
      title: "Why two resources connect",
      caption:
        "Click a line: both ends, its evidence and the path. Configured — does configuration declare it? Reachability — do security rules and routes let traffic through? Observed — was traffic seen? Internet path — can it be reached from the internet?",
      durationMs: 13000,
    },
    {
      id: "controls",
      title: "Focus the map",
      caption:
        "Expand all draws every hidden neighbor; Collapse all folds every VPC. Hide categories you don't need, zoom, fit everything into view or reset, move around with the minimap, and go fullscreen.",
      durationMs: 11000,
    },
    {
      id: "resources-list",
      title: "Resources: the inventory",
      caption:
        "Every resource of a connection — or one account — with its provider, type, region, status and when a sync last saw it. Search, filter by category, type and region, sort any column; 20 load at a time.",
      durationMs: 12000,
    },
    {
      id: "lifecycle",
      title: "Lifecycle and status",
      caption:
        "Active — found by the latest complete sync. Missing — a complete sync no longer found it. Out of scope — its region was excluded. Records are never deleted, and a sync that fails part-way marks nothing missing. Status is the provider's own, like running or stopped.",
      durationMs: 14000,
    },
    {
      id: "resource-page",
      title: "A resource's page",
      caption:
        "Open one for its utilization metrics from CloudWatch — with Metrics Read — its technical configuration, provider details, identity, its inventory record and its tags.",
      durationMs: 10000,
    },
    {
      id: "powers",
      title: "What the map powers",
      caption:
        "Recommendations read it before advising a change: a resource that something depends on is never stopped on a guess, and environments are grouped from how resources work together.",
      durationMs: 10000,
    },
    {
      id: "outro",
      title: "Tours for both",
      caption:
        "The Graph and Resources each have a step-by-step tour of their real controls — start one from the end of this video, or anytime from Help & Support.",
      durationMs: 9000,
    },
  ],
};
