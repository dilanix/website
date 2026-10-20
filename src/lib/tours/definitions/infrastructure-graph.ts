import { sharedTourAnchors } from "../anchors";
import type { TourDefinition } from "../types";

export const INFRASTRUCTURE_GRAPH_TOUR_KEY = "infrastructure.graph";

/** Anchors the Graph components set (`data-tour={infrastructureGraphAnchors.x}`). */
export const infrastructureGraphAnchors = {
  scope: "infrastructure-graph.scope",
  canvas: "infrastructure-graph.canvas",
  search: "infrastructure-graph.search",
  modes: "infrastructure-graph.modes",
  views: "infrastructure-graph.views",
  inspector: "infrastructure-graph.inspector",
  expandCollapse: "infrastructure-graph.expand-collapse",
  filters: "infrastructure-graph.filters",
  navigation: "infrastructure-graph.navigation",
} as const;

/** Actions the Graph page registers for this tour (`usePageTour`). */
export const infrastructureGraphActions = {
  openResourceDetails: "open-resource-details",
} as const;

const anchors = infrastructureGraphAnchors;

export const infrastructureGraphTour: TourDefinition = {
  key: INFRASTRUCTURE_GRAPH_TOUR_KEY,
  version: 1,
  title: "Infrastructure Graph",
  description: "Map, search and inspect your cloud resources.",
  product: "infrastructure",
  route: "/dashboard/products/infrastructure",
  steps: [
    {
      id: "welcome",
      title: "Welcome to the Infrastructure Graph",
      body: "A live map of the resources Dilanix collects from your cloud accounts and how they connect. This quick tour shows you around.",
    },
    {
      id: "sections",
      target: sharedTourAnchors.productTabs,
      placement: "bottom",
      title: "Graph and Resources",
      body: "Infrastructure has two sections: this Graph, and Resources — a searchable inventory of every collected resource.",
    },
    {
      id: "scope",
      target: anchors.scope,
      placement: "bottom",
      title: "Choose what to map",
      body: "Pick the connection, account and region to load. Large accounts are quickest to explore one region at a time.",
    },
    {
      id: "search",
      target: anchors.search,
      placement: "bottom",
      title: "Find any resource",
      body: "Search by name, type or region. Choosing a result zooms to it and opens its details.",
    },
    {
      id: "modes",
      target: anchors.modes,
      placement: "bottom",
      title: "Provisioned or Runtime",
      body: "Provisioned shows how resources are configured and connected. Runtime shows the service interactions Dilanix has observed, filtered by evidence.",
    },
    {
      id: "views",
      target: anchors.views,
      placement: "bottom",
      title: "Switch views",
      body: "Architecture, Network and Security each highlight a different set of relationships between the same resources.",
    },
    {
      id: "canvas",
      target: anchors.canvas,
      title: "Explore the map",
      body: "Drag to pan and scroll to zoom. Hover a resource to trace its connections; double-click to expand its hidden neighbors or collapse a group.",
    },
    {
      id: "details",
      target: anchors.inspector,
      prepare: infrastructureGraphActions.openResourceDetails,
      placement: "left",
      title: "Resource details",
      body: "Clicking a resource opens its details: configuration, relationships, external endpoints and observed traffic. Related resources are one click away.",
    },
    {
      id: "expand-collapse",
      target: anchors.expandCollapse,
      placement: "bottom",
      title: "Expand and collapse",
      body: "Expand everything to see every relationship at once, or collapse groups back into a compact overview.",
    },
    {
      id: "filters",
      target: anchors.filters,
      placement: "bottom",
      title: "Filter categories",
      body: "Hide the resource categories you don't need right now to focus the map.",
    },
    {
      id: "navigation",
      target: anchors.navigation,
      placement: "bottom",
      title: "Navigate the canvas",
      body: "Zoom, fit everything into view or reset the layout. The minimap in the corner shows where you are, and fullscreen gives the graph the whole screen.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Replay this tour anytime from Help & Support — the question-mark button at the top of the page.",
    },
  ],
};
