import type {
  CoreEvidenceKind,
  CoreGraphEdgeSummary,
  CoreGraphLayer,
  CoreGraphNode,
  CoreScopeGraph,
} from "@/lib/core/api";

/**
 * Provider-neutral view model for Infrastructure → Graph. Everything here is
 * derived from Core's normalized resource types, layers, relationship types
 * and evidence kinds — never from provider-specific resource types — so a
 * second provider renders without changes.
 */

export type GraphView = "architecture" | "network" | "security";

export const GRAPH_VIEWS: { id: GraphView; label: string }[] = [
  { id: "architecture", label: "Architecture" },
  { id: "network", label: "Network" },
  { id: "security", label: "Security" },
];

export const INTERNET_NODE_ID = "internet";

const VPC_TYPE = "network.vpc";
const SUBNET_TYPE = "network.subnet";
const INTERNET_GATEWAY_TYPE = "network.internet_gateway";
const SECURITY_GROUP_TYPE = "network.security_group";

/** Relationship types traffic flows along; hidden nodes on such a chain are collapsed. */
const FLOW_TYPES = new Set(["routes_to", "targets", "exposes"]);

const VIEW_LAYERS: Record<GraphView, ReadonlySet<CoreGraphLayer>> = {
  architecture: new Set(["service"]),
  network: new Set(["service", "network"]),
  security: new Set(["service", "security"]),
};

export interface ModelNode {
  id: string;
  kind: "resource" | "internet" | "group";
  resource: CoreGraphNode | null;
  /** Container this node is drawn inside (a VPC or, in Network view, a subnet). */
  parentId: string | null;
  layer: CoreGraphLayer | null;
  /** Hidden neighbors an expand would reveal (containers excluded). */
  hiddenNeighbors: number;
  expanded: boolean;
  /** For a collapsed group: how many resources it hides. */
  memberCount: number;
  collapsed: boolean;
  /** `false` when a search is active and this node does not match it. */
  matches: boolean;
}

export interface ModelEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  kinds: CoreEvidenceKind[];
  ports: CoreGraphEdgeSummary["ports"];
  /** Core relationships this drawn edge stands for (several when collapsed). */
  relationshipIds: string[];
  /** Resources hidden along a collapsed chain, in order. */
  via: string[];
}

export interface GraphModel {
  nodes: ModelNode[];
  edges: ModelEdge[];
  matchCount: number;
}

export interface GraphModelOptions {
  view: GraphView;
  expanded: ReadonlySet<string>;
  collapsedGroups: ReadonlySet<string>;
  hiddenCategories: ReadonlySet<string>;
  query: string;
}

export function nodeMatches(node: CoreGraphNode, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    node.name,
    node.external_id,
    node.resource_type,
    node.provider_resource_type,
    node.category,
    node.region,
  ].some((value) => value?.toLowerCase().includes(needle));
}

function isContainerType(resourceType: string, view: GraphView) {
  return (
    resourceType === VPC_TYPE ||
    (view === "network" && resourceType === SUBNET_TYPE)
  );
}

export function buildGraphModel(
  graph: CoreScopeGraph,
  options: GraphModelOptions,
): GraphModel {
  const { view, expanded, collapsedGroups, hiddenCategories, query } = options;
  const resources = new Map(graph.nodes.map((item) => [item.node.id, item]));

  // Placement: resource -> subnet/VPC it belongs to.
  const placement = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (edge.relationship_type !== "belongs_to") continue;
    const target = resources.get(edge.target_resource_id)?.node;
    if (
      target?.resource_type !== VPC_TYPE &&
      target?.resource_type !== SUBNET_TYPE
    )
      continue;
    placement.set(edge.source_resource_id, [
      ...(placement.get(edge.source_resource_id) ?? []),
      edge.target_resource_id,
    ]);
  }
  const vpcOf = (id: string): string | null => {
    for (const parent of placement.get(id) ?? []) {
      const parentNode = resources.get(parent)?.node;
      if (parentNode?.resource_type === VPC_TYPE) return parent;
      if (parentNode?.resource_type === SUBNET_TYPE) {
        const vpc = vpcOf(parent);
        if (vpc) return vpc;
      }
    }
    return null;
  };
  const containerOf = (id: string): string | null => {
    const resourceType = resources.get(id)?.node.resource_type;
    if (resourceType === VPC_TYPE || resourceType === INTERNET_GATEWAY_TYPE)
      return null;
    if (view === "network") {
      const subnets = (placement.get(id) ?? []).filter(
        (parent) => resources.get(parent)?.node.resource_type === SUBNET_TYPE,
      );
      // Multi-subnet resources (load balancers, services) sit in their VPC.
      if (subnets.length === 1 && resourceType !== SUBNET_TYPE)
        return subnets[0];
    }
    return vpcOf(id);
  };

  // Which resources are drawn.
  const neighbors = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    for (const [a, b] of [
      [edge.source_resource_id, edge.target_resource_id],
      [edge.target_resource_id, edge.source_resource_id],
    ]) {
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      neighbors.get(a)!.add(b);
    }
  }
  const baseVisible = (id: string) => {
    const item = resources.get(id);
    if (!item || hiddenCategories.has(item.node.category)) return false;
    return VIEW_LAYERS[view].has(item.layer);
  };
  const visible = new Set<string>();
  for (const item of graph.nodes) {
    if (baseVisible(item.node.id)) visible.add(item.node.id);
  }
  for (const id of expanded) {
    if (!visible.has(id)) continue;
    for (const neighbor of neighbors.get(id) ?? []) {
      const item = resources.get(neighbor);
      if (item && !hiddenCategories.has(item.node.category))
        visible.add(neighbor);
    }
  }

  // Containers: drawn as groups when they hold at least one visible resource.
  const groupIds = new Set<string>();
  const members: string[] = [];
  for (const id of visible) {
    if (isContainerType(resources.get(id)!.node.resource_type, view)) continue;
    members.push(id);
    for (
      let current = containerOf(id);
      current;
      current = containerOf(current)
    ) {
      groupIds.add(current);
    }
  }
  /** Outermost collapsed container strictly above `id`, if any. */
  const collapsedAncestor = (id: string): string | null => {
    let result: string | null = null;
    for (
      let current = containerOf(id);
      current;
      current = containerOf(current)
    ) {
      if (collapsedGroups.has(current) && groupIds.has(current))
        result = current;
    }
    return result;
  };

  const drawnGroups = [...groupIds].filter((id) => !collapsedAncestor(id));
  const drawnResources = members.filter((id) => !collapsedAncestor(id));
  const drawn = new Set([...drawnGroups, ...drawnResources]);
  const memberCounts = new Map<string, number>();
  for (const id of members) {
    const ancestor = collapsedAncestor(id);
    if (ancestor)
      memberCounts.set(ancestor, (memberCounts.get(ancestor) ?? 0) + 1);
  }
  /** Where an edge touching `id` is drawn: itself, or the collapsed group hiding it. */
  const drawnId = (id: string): string | null => {
    if (!visible.has(id) && !groupIds.has(id)) return null;
    const ancestor = collapsedAncestor(id);
    if (ancestor) return ancestor;
    return drawn.has(id) ? id : null;
  };

  const nodes: ModelNode[] = [];
  let matchCount = 0;
  const depth = (id: string) => {
    let value = 0;
    for (let current = containerOf(id); current; current = containerOf(current))
      value += 1;
    return value;
  };
  const pushNode = (id: string, kind: "group" | "resource") => {
    const item = resources.get(id)!;
    const matches = nodeMatches(item.node, query);
    if (query.trim() && matches) matchCount += 1;
    const parent = containerOf(id);
    nodes.push({
      id,
      kind,
      resource: item.node,
      parentId:
        parent && drawn.has(parent) && !collapsedGroups.has(parent)
          ? parent
          : null,
      layer: item.layer,
      hiddenNeighbors:
        kind === "group"
          ? 0
          : [...(neighbors.get(id) ?? [])].filter((neighbor) => {
              const neighborType =
                resources.get(neighbor)?.node.resource_type ?? "";
              return (
                !visible.has(neighbor) &&
                neighborType !== VPC_TYPE &&
                neighborType !== SUBNET_TYPE &&
                !hiddenCategories.has(
                  resources.get(neighbor)?.node.category ?? "",
                )
              );
            }).length,
      expanded: expanded.has(id),
      memberCount: memberCounts.get(id) ?? 0,
      collapsed: collapsedGroups.has(id),
      matches,
    });
  };
  // Containers precede their children (outer before inner) for the renderer.
  for (const id of drawnGroups.sort((a, b) => depth(a) - depth(b)))
    pushNode(id, "group");
  for (const id of drawnResources) pushNode(id, "resource");

  // Edges between drawn nodes; containment is shown by nesting, not lines.
  const edges = new Map<string, ModelEdge>();
  const addEdge = (edge: Omit<ModelEdge, "id">) => {
    if (edge.source === edge.target) return;
    const key = `${edge.source}->${edge.target}:${edge.relationshipType}`;
    const existing = edges.get(key);
    if (existing) {
      existing.kinds = [...new Set([...existing.kinds, ...edge.kinds])].sort();
      existing.relationshipIds = [
        ...new Set([...existing.relationshipIds, ...edge.relationshipIds]),
      ];
      existing.ports = [...existing.ports, ...edge.ports];
      return;
    }
    edges.set(key, { id: key, ...edge });
  };
  const isWorkloadToWorkloadConnects = (edge: CoreGraphEdgeSummary) =>
    edge.relationship_type === "connects_to" &&
    resources.get(edge.source_resource_id)?.node.resource_type !==
      SECURITY_GROUP_TYPE;

  for (const edge of graph.edges) {
    if (edge.relationship_type === "belongs_to") continue;
    if (view === "security" && isWorkloadToWorkloadConnects(edge)) continue;
    const source = drawnId(edge.source_resource_id);
    const target = drawnId(edge.target_resource_id);
    if (!source || !target) continue;
    addEdge({
      source,
      target,
      relationshipType: edge.relationship_type,
      kinds: [...edge.evidence_kinds].sort(),
      ports: edge.ports,
      relationshipIds: [edge.id],
      via: [],
    });
  }

  // Collapse hidden hops on traffic-flow chains (A -> hidden -> B).
  const outgoing = new Map<string, CoreGraphEdgeSummary[]>();
  for (const edge of graph.edges) {
    if (!FLOW_TYPES.has(edge.relationship_type)) continue;
    outgoing.set(edge.source_resource_id, [
      ...(outgoing.get(edge.source_resource_id) ?? []),
      edge,
    ]);
  }
  for (const first of graph.edges) {
    if (!FLOW_TYPES.has(first.relationship_type)) continue;
    const source = drawnId(first.source_resource_id);
    const hidden = first.target_resource_id;
    if (
      !source ||
      drawnId(hidden) ||
      !resources.has(hidden) ||
      groupIds.has(hidden)
    )
      continue;
    if (resources.get(hidden)!.node.resource_type === INTERNET_GATEWAY_TYPE)
      continue;
    for (const second of outgoing.get(hidden) ?? []) {
      const target = drawnId(second.target_resource_id);
      if (!target) continue;
      addEdge({
        source,
        target,
        relationshipType: second.relationship_type,
        kinds: [
          ...new Set([...first.evidence_kinds, ...second.evidence_kinds]),
        ].sort(),
        ports: [...first.ports, ...second.ports],
        relationshipIds: [first.id, second.id],
        via: [hidden],
      });
    }
  }

  // The Internet: derived from normalized internet-gateway resources and
  // their `exposes` relationships — never drawn without such evidence.
  let internetUsed = false;
  for (const edge of graph.edges) {
    const sourceType = resources.get(edge.source_resource_id)?.node
      .resource_type;
    if (sourceType !== INTERNET_GATEWAY_TYPE) continue;
    const gateway = drawnId(edge.source_resource_id);
    if (gateway) {
      internetUsed = true;
      addEdge({
        source: INTERNET_NODE_ID,
        target: gateway,
        relationshipType: "connects_to",
        kinds: [],
        ports: [],
        relationshipIds: [],
        via: [],
      });
      continue;
    }
    if (edge.relationship_type !== "exposes") continue;
    const target = drawnId(edge.target_resource_id);
    if (!target) continue;
    internetUsed = true;
    addEdge({
      source: INTERNET_NODE_ID,
      target,
      relationshipType: "exposes",
      kinds: [...edge.evidence_kinds].sort(),
      ports: edge.ports,
      relationshipIds: [edge.id],
      via: [edge.source_resource_id],
    });
  }
  if (internetUsed) {
    nodes.unshift({
      id: INTERNET_NODE_ID,
      kind: "internet",
      resource: null,
      parentId: null,
      layer: null,
      hiddenNeighbors: 0,
      expanded: false,
      memberCount: 0,
      collapsed: false,
      matches: !query.trim(),
    });
  }

  return { nodes, edges: [...edges.values()], matchCount };
}

/** Resources every view can offer as expansion/search targets. */
export function searchResources(
  graph: CoreScopeGraph,
  query: string,
  limit = 8,
) {
  if (!query.trim()) return [];
  return graph.nodes
    .map((item) => item.node)
    .filter((node) => nodeMatches(node, query))
    .slice(0, limit);
}

export function formatPorts(ports: CoreGraphEdgeSummary["ports"]) {
  const labels = new Set<string>();
  for (const port of ports) {
    const protocol =
      port.protocol === "-1" ? "All" : (port.protocol ?? "").toUpperCase();
    if (port.protocol === "-1") {
      labels.add("All traffic");
    } else if (port.from_port === null || port.from_port === undefined) {
      labels.add(protocol);
    } else if (port.from_port === port.to_port) {
      labels.add(`${protocol} ${port.from_port}`);
    } else {
      labels.add(`${protocol} ${port.from_port}-${port.to_port}`);
    }
  }
  return [...labels].join(", ");
}
