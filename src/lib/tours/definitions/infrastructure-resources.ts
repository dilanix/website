import type { TourDefinition } from "../types";

export const INFRASTRUCTURE_RESOURCES_TOUR_KEY = "infrastructure.resources";

/** Anchors the Resources page sets (`data-tour={infrastructureResourcesAnchors.x}`).
 *  Per-resource anchors sit on every row; the tour shows the first. */
export const infrastructureResourcesAnchors = {
  connection: "infrastructure-resources.connection",
  connectionSelect: "infrastructure-resources.connection-select",
  target: "infrastructure-resources.target",
  views: "infrastructure-resources.views",
  search: "infrastructure-resources.search",
  refresh: "infrastructure-resources.refresh",
  category: "infrastructure-resources.category",
  type: "infrastructure-resources.type",
  region: "infrastructure-resources.region",
  lifecycle: "infrastructure-resources.lifecycle",
  sort: "infrastructure-resources.sort",
  resource: "infrastructure-resources.resource",
  status: "infrastructure-resources.status",
  loadMore: "infrastructure-resources.load-more",
} as const;

const anchors = infrastructureResourcesAnchors;

export const infrastructureResourcesTour: TourDefinition = {
  key: INFRASTRUCTURE_RESOURCES_TOUR_KEY,
  version: 1,
  title: "Infrastructure Resources",
  description: "Scope, filter and read your cloud inventory.",
  product: "infrastructure",
  route: "/dashboard/products/infrastructure/resources",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Resources",
      body: "Resources is the inventory of everything Dilanix has discovered in your connected cloud accounts — instances, databases, volumes, load balancers, networks and more. This tour shows how to scope it, filter it and read it.",
    },
    {
      id: "connection",
      target: anchors.connection,
      placement: "bottom",
      title: "Whose resources",
      body: "The provider, the connection and — when you picked one — the account you're viewing. The badge is the connection's status. A connection that isn't connected keeps showing the last data collected, but no new data syncs until it's fixed.",
    },
    {
      id: "connection-select",
      target: anchors.connectionSelect,
      placement: "bottom",
      title: "Pick a connection",
      body: "Switch between your connections, grouped by provider. Only connections whose provider your organization can read inventory from are listed. Your choice is remembered in this browser.",
    },
    {
      id: "target",
      target: anchors.target,
      placement: "bottom",
      title: "Pick an account",
      body: "When a connection holds several accounts, view all of them or just one. An account marked historical is no longer in use; the resources collected from it stay visible.",
    },
    {
      id: "views",
      target: anchors.views,
      placement: "bottom",
      title: "Resources and Cost",
      body: "Jump to Cost for the same connection and account. Cost is offered when your organization can read this provider's billing.",
    },
    {
      id: "search",
      target: anchors.search,
      placement: "bottom",
      title: "Search",
      body: "Matches name, ID, provider, type, region, SKU and tag keys or values — among the resources loaded on this page.",
    },
    {
      id: "refresh",
      target: anchors.refresh,
      placement: "bottom",
      title: "Count and refresh",
      body: "How many resources are loaded, out of all that match your filters. Refresh reloads the list from Dilanix — it doesn't contact your cloud. New data arrives with each inventory sync, scheduled on the Sync page.",
    },
    {
      id: "category",
      target: anchors.category,
      placement: "bottom",
      title: "Category",
      body: "Narrow to one family — compute, database, storage, network… Only categories this connection actually has are offered.",
    },
    {
      id: "type",
      target: anchors.type,
      placement: "bottom",
      title: "Type",
      body: "Narrow further to one type, e.g. instance or NAT gateway. With a category picked, only its types are listed.",
    },
    {
      id: "region",
      target: anchors.region,
      placement: "bottom",
      title: "Region",
      body: "Only regions where this connection has resources are offered.",
    },
    {
      id: "lifecycle",
      target: anchors.lifecycle,
      placement: "bottom",
      title: "Lifecycle",
      body: "Active — found by the latest complete inventory sync.\nMissing — a complete sync of the same account, region and resource type no longer found it: most likely deleted.\nOut of scope — its region was excluded from the connection, so Dilanix stopped watching it; it may still exist.\nDilanix never deletes a resource's record, and a sync that fails part-way marks nothing missing.",
    },
    {
      id: "sort",
      target: anchors.sort,
      placement: "bottom",
      title: "Sort",
      body: "Click a column to sort the loaded resources by it; click it again to reverse the order.",
    },
    {
      id: "resource",
      target: anchors.resource,
      placement: "bottom",
      title: "A resource",
      body: "Its name and provider ID, provider and type, region, account (when the connection has several), status and when a sync last saw it. Click it for details: utilization metrics, technical configuration, provider details, identity, its inventory record and tags.",
    },
    {
      id: "status",
      target: anchors.status,
      placement: "left",
      title: "Status",
      body: "The provider's own status, e.g. running or stopped. It's separate from Lifecycle: a terminated instance AWS still reports stays Active until a sync no longer finds it.",
    },
    {
      id: "load-more",
      target: anchors.loadMore,
      placement: "top",
      title: "Load more",
      body: "Resources load 20 at a time; Load more fetches the next 20.",
    },
    {
      id: "finish",
      title: "You're all set",
      body: "Filters, search and sort are remembered for each connection in this browser and kept in the link, so you can share a view. Replay this tour anytime from Help & Support.",
    },
  ],
};
