import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { GraphModel } from "./graph-model";

export const RESOURCE_NODE_SIZE = { width: 212, height: 62 } as const;
export const INTERNET_NODE_SIZE = { width: 132, height: 92 } as const;
export const COLLAPSED_GROUP_SIZE = { width: 236, height: 66 } as const;

export interface GraphLayout {
  /** Top-left position, relative to the parent container when there is one. */
  positions: Map<string, { x: number; y: number }>;
  /** Computed size of every expanded container. */
  groupSizes: Map<string, { width: number; height: number }>;
}

const elk = new ELK();

const ROOT_OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.hierarchyHandling": "INCLUDE_CHILDREN",
  "elk.layered.spacing.nodeNodeBetweenLayers": "72",
  "elk.spacing.nodeNode": "36",
  "elk.spacing.componentComponent": "56",
  "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
  "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
};

const GROUP_OPTIONS = {
  "elk.padding": "[top=52,left=24,bottom=24,right=24]",
  "elk.spacing.nodeNode": "28",
  "elk.layered.spacing.nodeNodeBetweenLayers": "56",
};

/**
 * Hierarchical layered layout (top-down traffic flow) with nested
 * containers. Pure positioning — the view model decides what is drawn.
 */
export async function layoutGraph(model: GraphModel): Promise<GraphLayout> {
  const children = new Map<string | null, ElkNode[]>();
  const elkNodes = new Map<string, ElkNode>();
  for (const node of model.nodes) {
    const expandedGroup = node.kind === "group" && !node.collapsed;
    const size =
      node.kind === "internet"
        ? INTERNET_NODE_SIZE
        : node.kind === "group"
          ? COLLAPSED_GROUP_SIZE
          : RESOURCE_NODE_SIZE;
    const elkNode: ElkNode = expandedGroup
      ? { id: node.id, layoutOptions: GROUP_OPTIONS, children: [] }
      : { id: node.id, width: size.width, height: size.height };
    elkNodes.set(node.id, elkNode);
    const siblings = children.get(node.parentId) ?? [];
    siblings.push(elkNode);
    children.set(node.parentId, siblings);
  }
  for (const [parentId, nodes] of children) {
    if (parentId === null) continue;
    const parent = elkNodes.get(parentId);
    if (parent) parent.children = nodes;
  }
  // An expanded container with nothing inside still needs a size.
  for (const node of model.nodes) {
    const elkNode = elkNodes.get(node.id)!;
    if (elkNode.children && elkNode.children.length === 0) {
      delete elkNode.children;
      elkNode.width = COLLAPSED_GROUP_SIZE.width;
      elkNode.height = COLLAPSED_GROUP_SIZE.height;
    }
  }

  const result = await elk.layout({
    id: "root",
    layoutOptions: ROOT_OPTIONS,
    children: children.get(null) ?? [],
    edges: model.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  });

  const positions = new Map<string, { x: number; y: number }>();
  const groupSizes = new Map<string, { width: number; height: number }>();
  const visit = (nodes: ElkNode[] | undefined) => {
    for (const node of nodes ?? []) {
      positions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
      if (node.children) {
        groupSizes.set(node.id, {
          width: node.width ?? 0,
          height: node.height ?? 0,
        });
        visit(node.children);
      }
    }
  };
  visit(result.children);
  return { positions, groupSizes };
}
