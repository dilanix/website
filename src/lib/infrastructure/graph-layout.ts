import type {
  ElkEdgeSection,
  ElkExtendedEdge,
  ElkNode,
  ElkPort,
  LayoutOptions,
} from "elkjs/lib/elk-api";
import type { GraphModel, ModelNode } from "./graph-model";

export const RESOURCE_NODE_SIZE = { width: 248, height: 68 } as const;
export const INTERNET_NODE_SIZE = { width: 148, height: 84 } as const;
export const COLLAPSED_GROUP_SIZE = { width: 264, height: 68 } as const;

export interface Point {
  x: number;
  y: number;
}

export interface GraphLayout {
  /** Top-left position, relative to the parent container when there is one. */
  positions: Map<string, Point>;
  /** Size of every laid-out node (containers sized to their content). */
  sizes: Map<string, { width: number; height: number }>;
  /** Orthogonal route of every edge, in absolute flow coordinates. */
  routes: Map<string, Point[]>;
}

/**
 * Hierarchical, top-down layered layout: traffic enters at the top (Internet,
 * gateways, load balancers) and flows down to workloads and data stores,
 * nested inside their VPC/subnet containers.
 *
 * Edges are routed by ELK, not by the renderer: every edge end gets its own
 * port on a fixed side (targets on top, sources at the bottom), so parallel
 * edges leave and enter a node at distinct points and run in separate lanes
 * instead of stacking on the same pixels, and orthogonal routes go around
 * unrelated nodes.
 */
const ROOT_OPTIONS: LayoutOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.hierarchyHandling": "INCLUDE_CHILDREN",
  "elk.edgeRouting": "ORTHOGONAL",
  // Edge sections in absolute coordinates, whatever container ELK moves them to.
  "org.eclipse.elk.json.edgeCoords": "ROOT",
  "elk.layered.spacing.nodeNodeBetweenLayers": "64",
  "elk.spacing.nodeNode": "32",
  "elk.spacing.edgeEdge": "12",
  "elk.spacing.edgeNode": "20",
  "elk.layered.spacing.edgeEdgeBetweenLayers": "12",
  "elk.layered.spacing.edgeNodeBetweenLayers": "20",
  "elk.spacing.componentComponent": "48",
  "elk.padding": "[top=24,left=24,bottom=24,right=24]",
  // Balanced alignment: straight vertical runs where possible. (NETWORK_SIMPLEX
  // placement fails on hierarchical graphs with ports in ELK.)
  "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
  "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
  // Edges sharing a port are routed as one bundle.
  "elk.layered.mergeEdges": "true",
  // Disconnected resources are packed, not strung out in one long row.
  "elk.separateConnectedComponents": "true",
  "elk.aspectRatio": "1.6",
};

const GROUP_OPTIONS: LayoutOptions = {
  "elk.padding": "[top=48,left=20,bottom=20,right=20]",
  "elk.portConstraints": "FIXED_SIDE",
};

const LEAF_OPTIONS: LayoutOptions = {
  "elk.portConstraints": "FIXED_SIDE",
};

function nodeSize(node: ModelNode) {
  if (node.kind === "internet") return INTERNET_NODE_SIZE;
  if (node.kind === "group") return COLLAPSED_GROUP_SIZE;
  return RESOURCE_NODE_SIZE;
}

function port(id: string, side: "NORTH" | "SOUTH"): ElkPort {
  return {
    id,
    width: 1,
    height: 1,
    layoutOptions: { "elk.port.side": side },
  };
}

/** ELK input for a model; exported for tests. */
export function toElkGraph(model: GraphModel): ElkNode {
  const ports = new Map<string, ElkPort[]>();
  const addPort = (nodeId: string, item: ElkPort) => {
    const list = ports.get(nodeId);
    if (list) list.push(item);
    else ports.set(nodeId, [item]);
  };
  // One shared port per node side: a node's edges leave/enter at one point
  // and ELK bundles them into a trunk that fans out, instead of a comb of
  // parallel lanes. Only parallel duplicates (same pair, another
  // relationship type) get their own port so they never stack.
  const seenPorts = new Set<string>();
  const pairIndex = new Map<string, number>();
  const edges: ElkExtendedEdge[] = model.edges.map((edge) => {
    const pair = `${edge.source}->${edge.target}`;
    const lane = pairIndex.get(pair) ?? 0;
    pairIndex.set(pair, lane + 1);
    const sourcePort = `${edge.source}::out::${lane}`;
    const targetPort = `${edge.target}::in::${lane}`;
    if (!seenPorts.has(sourcePort)) {
      seenPorts.add(sourcePort);
      addPort(edge.source, port(sourcePort, "SOUTH"));
    }
    if (!seenPorts.has(targetPort)) {
      seenPorts.add(targetPort);
      addPort(edge.target, port(targetPort, "NORTH"));
    }
    return { id: edge.id, sources: [sourcePort], targets: [targetPort] };
  });

  const children = new Map<string | null, ElkNode[]>();
  const elkNodes = new Map<string, ElkNode>();
  for (const node of model.nodes) {
    const expandedGroup = node.kind === "group" && !node.collapsed;
    const size = nodeSize(node);
    const elkNode: ElkNode = expandedGroup
      ? { id: node.id, layoutOptions: GROUP_OPTIONS, children: [] }
      : {
          id: node.id,
          width: size.width,
          height: size.height,
          layoutOptions:
            node.kind === "internet"
              ? {
                  ...LEAF_OPTIONS,
                  "elk.layered.layering.layerConstraint": "FIRST",
                }
              : LEAF_OPTIONS,
        };
    const nodePorts = ports.get(node.id);
    if (nodePorts) elkNode.ports = nodePorts;
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
  for (const elkNode of elkNodes.values()) {
    if (elkNode.children && elkNode.children.length === 0) {
      delete elkNode.children;
      elkNode.width = COLLAPSED_GROUP_SIZE.width;
      elkNode.height = COLLAPSED_GROUP_SIZE.height;
    }
  }

  return {
    id: "root",
    layoutOptions: ROOT_OPTIONS,
    children: children.get(null) ?? [],
    edges,
  };
}

/**
 * An edge crossing a container boundary comes back as several sections whose
 * array order is not path order; follow the incoming/outgoing links instead
 * (joining them in array order draws diagonal jumps between sections).
 */
function orderedSections(sections: ElkEdgeSection[]): ElkEdgeSection[] {
  if (sections.length <= 1) return sections;
  const byId = new Map(sections.map((section) => [section.id, section]));
  const ordered: ElkEdgeSection[] = [];
  const seen = new Set<string>();
  let current: ElkEdgeSection | undefined =
    sections.find((section) => !section.incomingSections?.length) ??
    sections[0];
  while (current && !seen.has(current.id)) {
    ordered.push(current);
    seen.add(current.id);
    const next: string | undefined = current.outgoingSections?.[0];
    current = next ? byId.get(next) : undefined;
  }
  return ordered.length === sections.length ? ordered : sections;
}

/**
 * ELK joins hierarchy-crossing edge pieces with straight (diagonal) segments;
 * replace each diagonal with a vertical–horizontal–vertical step so every
 * route stays orthogonal.
 */
export function orthogonal(points: Point[]): Point[] {
  const result: Point[] = [points[0]];
  for (let index = 1; index < points.length; index += 1) {
    const from = result[result.length - 1];
    const to = points[index];
    if (Math.abs(from.x - to.x) > 0.5 && Math.abs(from.y - to.y) > 0.5) {
      const middle = (from.y + to.y) / 2;
      result.push({ x: from.x, y: middle }, { x: to.x, y: middle });
    }
    result.push(to);
  }
  return result;
}

/** Positions, sizes and routes from ELK's output; exported for tests. */
export function fromElkGraph(result: ElkNode): GraphLayout {
  const positions = new Map<string, Point>();
  const sizes = new Map<string, { width: number; height: number }>();
  const routes = new Map<string, Point[]>();
  const visit = (node: ElkNode) => {
    for (const edge of node.edges ?? []) {
      const points: Point[] = [];
      for (const section of orderedSections(edge.sections ?? [])) {
        points.push(
          section.startPoint,
          ...(section.bendPoints ?? []),
          section.endPoint,
        );
      }
      if (points.length >= 2) routes.set(edge.id, orthogonal(points));
    }
    for (const child of node.children ?? []) {
      positions.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
      sizes.set(child.id, {
        width: child.width ?? 0,
        height: child.height ?? 0,
      });
      visit(child);
    }
  };
  visit(result);
  return { positions, sizes, routes };
}

interface LayoutEngine {
  layout(graph: ElkNode): Promise<ElkNode>;
}

let mainThread: Promise<LayoutEngine> | null = null;
function mainThreadEngine(): Promise<LayoutEngine> {
  mainThread ??= import("elkjs/lib/elk.bundled.js").then(
    ({ default: ELK }) => new ELK(),
  );
  return mainThread;
}

// Literal `new Worker(new URL(…), { type: "module" })` so the bundler emits
// the worker as its own entry.
function createLayoutWorker() {
  return new Worker(new URL("./elk.worker.ts", import.meta.url), {
    type: "module",
  });
}

/** ELK in a Web Worker; `null` where workers are unavailable. */
async function workerEngine(): Promise<LayoutEngine | null> {
  if (typeof window === "undefined" || typeof Worker === "undefined")
    return null;
  let fail: (reason: unknown) => void = () => {};
  const failed = new Promise<never>((_, reject) => {
    fail = reject;
  });
  failed.catch(() => {});
  let elk: { terminateWorker(): void } | null = null;
  try {
    const { default: ELK } = await import("elkjs/lib/elk-api.js");
    const api = new ELK({
      workerFactory: () => {
        const worker = createLayoutWorker();
        worker.addEventListener("error", (event) => fail(event));
        return worker;
      },
    });
    elk = api;
    // A worker that loads but never answers must not stall the graph.
    let timer: number | undefined;
    const silent = new Promise<never>((_, reject) => {
      timer = window.setTimeout(
        () => reject(new Error("Layout worker did not respond.")),
        5000,
      );
    });
    await Promise.race([api.knownLayoutAlgorithms(), failed, silent]).finally(
      () => window.clearTimeout(timer),
    );
    return { layout: (graph) => Promise.race([api.layout(graph), failed]) };
  } catch {
    elk?.terminateWorker();
    return null;
  }
}

let engine: Promise<LayoutEngine | null> | null = null;

async function runLayout(graph: ElkNode): Promise<ElkNode> {
  engine ??= workerEngine();
  const worker = await engine;
  if (worker) {
    try {
      return await worker.layout(graph);
    } catch {
      // Worker unavailable (bundling, CSP…): lay out on the main thread.
      engine = Promise.resolve(null);
    }
  }
  return (await mainThreadEngine()).layout(graph);
}

/** Structure only: search/selection/highlight never change the layout. */
export function layoutKey(model: GraphModel) {
  return [
    model.nodes
      .map(
        (node) =>
          `${node.id}|${node.kind}|${node.parentId ?? ""}|${node.collapsed ? 1 : 0}`,
      )
      .join(","),
    model.edges.map((edge) => edge.id).join(","),
  ].join("#");
}

/**
 * Top-level resources with no drawn relationship (buckets, registries, …).
 * A layered layout puts every one of them in the first layer — one row
 * thousands of pixels wide that shrinks the whole graph — so they are packed
 * into a grid under the topology instead.
 */
function splitIsolated(model: GraphModel) {
  const linked = new Set<string>();
  for (const edge of model.edges) {
    linked.add(edge.source);
    linked.add(edge.target);
  }
  const isolated = model.nodes.filter(
    (node) =>
      node.parentId === null &&
      node.kind !== "internet" &&
      !(node.kind === "group" && !node.collapsed) &&
      !linked.has(node.id),
  );
  const ids = new Set(isolated.map((node) => node.id));
  return {
    isolated,
    connected: {
      ...model,
      nodes: model.nodes.filter((node) => !ids.has(node.id)),
    },
  };
}

const GRID_GAP_X = 32;
const GRID_GAP_Y = 28;
const MARGIN = 24;

function packIsolated(layout: GraphLayout, isolated: ModelNode[]) {
  if (!isolated.length) return layout;
  let right = 0;
  let bottom = 0;
  for (const [id, position] of layout.positions) {
    const size = layout.sizes.get(id);
    if (!size) continue;
    right = Math.max(right, position.x + size.width);
    bottom = Math.max(bottom, position.y + size.height);
  }
  // Nested positions are parent-relative, so they never exceed their
  // top-level container's extent: the maximum is still the true bound.
  const cellWidth = COLLAPSED_GROUP_SIZE.width + GRID_GAP_X;
  const cellHeight = COLLAPSED_GROUP_SIZE.height + GRID_GAP_Y;
  const columns = right
    ? Math.max(3, Math.floor((right - MARGIN + GRID_GAP_X) / cellWidth))
    : Math.max(3, Math.ceil(Math.sqrt(isolated.length * 2.2)));
  const top = bottom ? bottom + 56 : MARGIN;
  isolated.forEach((node, index) => {
    const size = nodeSize(node);
    layout.positions.set(node.id, {
      x: MARGIN + (index % columns) * cellWidth,
      y: top + Math.floor(index / columns) * cellHeight,
    });
    layout.sizes.set(node.id, { width: size.width, height: size.height });
  });
  return layout;
}

const CACHE_LIMIT = 16;
const cache = new Map<string, Promise<GraphLayout>>();

/**
 * Laid-out positions and edge routes for a model, memoized by structure so
 * switching back to a view or undoing an expand is instant.
 */
export function layoutGraph(model: GraphModel): Promise<GraphLayout> {
  const key = layoutKey(model);
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }
  const { connected, isolated } = splitIsolated(model);
  const pending = (
    connected.nodes.length
      ? runLayout(toElkGraph(connected)).then(fromElkGraph)
      : Promise.resolve<GraphLayout>({
          positions: new Map(),
          sizes: new Map(),
          routes: new Map(),
        })
  ).then((layout) => packIsolated(layout, isolated));
  pending.catch(() => cache.delete(key));
  cache.set(key, pending);
  while (cache.size > CACHE_LIMIT) {
    cache.delete(cache.keys().next().value!);
  }
  return pending;
}
