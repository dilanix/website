import { describe, expect, it } from "vitest";
import type { GraphModel, ModelEdge, ModelNode } from "./graph-model";
import {
  layoutGraph,
  layoutKey,
  orthogonal,
  type GraphLayout,
} from "./graph-layout";

function node(
  id: string,
  kind: ModelNode["kind"],
  parentId: string | null = null,
): ModelNode {
  return {
    id,
    kind,
    resource: null,
    parentId,
    layer: null,
    hiddenNeighbors: 0,
    expanded: false,
    memberCount: 0,
    collapsed: false,
    matches: true,
  };
}

function edge(source: string, target: string, type = "connects_to"): ModelEdge {
  return {
    id: `${source}->${target}:${type}`,
    source,
    target,
    relationshipType: type,
    kinds: ["configured"],
    ports: [],
    relationshipIds: [`${source}-${target}-${type}`],
    via: [],
    lastObservedAt: null,
  };
}

const model: GraphModel = {
  matchCount: 0,
  nodes: [
    node("internet", "internet"),
    node("vpc", "group"),
    node("alb", "resource", "vpc"),
    node("api", "resource", "vpc"),
    node("db", "resource", "vpc"),
  ],
  edges: [
    edge("internet", "alb", "exposes"),
    edge("alb", "api", "routes_to"),
    edge("api", "db"),
    // A parallel relationship between the same pair must get its own lane.
    edge("api", "db", "reads_from"),
  ],
};

function absolute(layout: GraphLayout, id: string) {
  const parents: Record<string, string | undefined> = {
    alb: "vpc",
    api: "vpc",
    db: "vpc",
  };
  const own = layout.positions.get(id)!;
  const parent = parents[id];
  const offset = parent ? layout.positions.get(parent)! : { x: 0, y: 0 };
  const size = layout.sizes.get(id)!;
  return { x: own.x + offset.x, y: own.y + offset.y, ...size };
}

describe("layoutGraph", () => {
  it("routes every edge from the source's bottom to the target's top, in absolute coordinates", async () => {
    const layout = await layoutGraph(model);

    for (const item of model.edges) {
      const route = layout.routes.get(item.id);
      expect(route, item.id).toBeDefined();
      const source = absolute(layout, item.source);
      const target = absolute(layout, item.target);
      const start = route![0];
      const end = route![route!.length - 1];
      expect(Math.abs(start.y - (source.y + source.height))).toBeLessThan(3);
      expect(start.x).toBeGreaterThanOrEqual(source.x - 1);
      expect(start.x).toBeLessThanOrEqual(source.x + source.width + 1);
      expect(Math.abs(end.y - target.y)).toBeLessThan(3);
      expect(end.x).toBeGreaterThanOrEqual(target.x - 1);
      expect(end.x).toBeLessThanOrEqual(target.x + target.width + 1);
    }
  });

  it("separates parallel edges instead of stacking them", async () => {
    const layout = await layoutGraph(model);
    const a = layout.routes.get("api->db:connects_to")!;
    const b = layout.routes.get("api->db:reads_from")!;

    expect(a[0].x).not.toBe(b[0].x);
  });

  it("flows top-down from the Internet through the VPC", async () => {
    const layout = await layoutGraph(model);

    expect(absolute(layout, "internet").y).toBeLessThan(
      absolute(layout, "alb").y,
    );
    expect(absolute(layout, "alb").y).toBeLessThan(absolute(layout, "api").y);
    expect(absolute(layout, "api").y).toBeLessThan(absolute(layout, "db").y);
  });

  it("keys layouts by structure only", () => {
    expect(layoutKey({ ...model, matchCount: 3 })).toBe(layoutKey(model));
    expect(layoutKey({ ...model, edges: model.edges.slice(0, 2) })).not.toBe(
      layoutKey(model),
    );
  });

  it("replaces diagonal segments with orthogonal steps", () => {
    expect(
      orthogonal([
        { x: 0, y: 0 },
        { x: 40, y: 100 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 50 },
      { x: 40, y: 50 },
      { x: 40, y: 100 },
    ]);
  });

  it("packs unconnected top-level resources into a grid under the topology", async () => {
    const lonely = Array.from({ length: 12 }, (_, index) =>
      node(`bucket-${index}`, "resource"),
    );
    const layout = await layoutGraph({
      ...model,
      nodes: [...model.nodes, ...lonely],
    });
    const vpcBottom =
      layout.positions.get("vpc")!.y + layout.sizes.get("vpc")!.height;
    const rows = new Set(
      lonely.map((item) => layout.positions.get(item.id)!.y),
    );

    expect(rows.size).toBeGreaterThan(1);
    for (const item of lonely)
      expect(layout.positions.get(item.id)!.y).toBeGreaterThan(vpcBottom);
  });
});
