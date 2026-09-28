import { describe, expect, it } from "vitest";
import type {
  CoreGraphEdgeSummary,
  CoreGraphLayer,
  CoreScopeGraph,
} from "@/lib/core/api";
import {
  INTERNET_NODE_ID,
  buildGraphModel,
  formatPorts,
  type GraphModelOptions,
  type GraphView,
} from "./graph-model";

function node(id: string, resourceType: string, layer: CoreGraphLayer) {
  return {
    layer,
    node: {
      id,
      target_id: "t",
      provider: "aws",
      provider_resource_type: `x.${id}`,
      resource_type: resourceType,
      category: resourceType.split(".")[0],
      external_id: id,
      name: id,
      region: "eu-west-1",
      status: "active",
      lifecycle_status: "active",
    },
  };
}

function edge(
  source: string,
  type: string,
  target: string,
  kinds: CoreGraphEdgeSummary["evidence_kinds"] = ["configured"],
  ports: CoreGraphEdgeSummary["ports"] = [],
): CoreGraphEdgeSummary {
  return {
    id: `${source}-${type}-${target}`,
    source_resource_id: source,
    target_resource_id: target,
    relationship_type: type,
    evidence_kinds: kinds,
    ports,
    last_seen_at: "2026-09-28T00:00:00Z",
  };
}

const tcp5432 = [{ protocol: "tcp", from_port: 5432, to_port: 5432 }];

const graph: CoreScopeGraph = {
  total_nodes: 9,
  truncated: false,
  resolution: null,
  nodes: [
    node("vpc", "network.vpc", "network"),
    node("subnet", "network.subnet", "network"),
    node("igw", "network.internet_gateway", "network"),
    node("tg", "network.target_group", "network"),
    node("sg-api", "network.security_group", "security"),
    node("sg-db", "network.security_group", "security"),
    node("alb", "network.load_balancer", "service"),
    node("api", "container.service", "service"),
    node("db", "database.instance", "service"),
  ],
  edges: [
    edge("subnet", "belongs_to", "vpc"),
    edge("api", "belongs_to", "subnet"),
    edge("alb", "belongs_to", "vpc"),
    edge("db", "belongs_to", "vpc"),
    edge("sg-api", "belongs_to", "vpc"),
    edge("sg-db", "belongs_to", "vpc"),
    edge("igw", "attached_to", "vpc"),
    edge("igw", "exposes", "alb", ["configured", "permitted"]),
    edge("alb", "routes_to", "tg"),
    edge("tg", "targets", "api"),
    edge("api", "protected_by", "sg-api"),
    edge("db", "protected_by", "sg-db"),
    edge("api", "connects_to", "db", ["permitted"], tcp5432),
    edge("sg-api", "connects_to", "sg-db", ["permitted"], tcp5432),
  ],
};

function options(
  view: GraphView,
  overrides: Partial<GraphModelOptions> = {},
): GraphModelOptions {
  return {
    view,
    expanded: new Set(),
    collapsedGroups: new Set(),
    hiddenCategories: new Set(),
    query: "",
    ...overrides,
  };
}

const ids = (model: ReturnType<typeof buildGraphModel>) =>
  model.nodes.map((item) => item.id).sort();
const edgeKeys = (model: ReturnType<typeof buildGraphModel>) =>
  model.edges.map((item) => `${item.source}>${item.target}`).sort();

describe("buildGraphModel", () => {
  it("keeps the Architecture view to services inside their VPC, collapsing hidden hops", () => {
    const model = buildGraphModel(graph, options("architecture"));

    expect(ids(model)).toEqual(["alb", "api", "db", INTERNET_NODE_ID, "vpc"]);
    expect(model.nodes.find((item) => item.id === "api")?.parentId).toBe("vpc");
    expect(edgeKeys(model)).toEqual([
      "alb>api",
      "api>db",
      `${INTERNET_NODE_ID}>alb`,
    ]);
    const collapsed = model.edges.find((item) => item.source === "alb");
    expect(collapsed?.via).toEqual(["tg"]);
    expect(collapsed?.relationshipIds).toEqual([
      "alb-routes_to-tg",
      "tg-targets-api",
    ]);
  });

  it("shows subnets as containers and gateways as nodes in the Network view", () => {
    const model = buildGraphModel(graph, options("network"));

    expect(model.nodes.find((item) => item.id === "subnet")?.kind).toBe(
      "group",
    );
    expect(model.nodes.find((item) => item.id === "api")?.parentId).toBe(
      "subnet",
    );
    expect(model.nodes.find((item) => item.id === "subnet")?.parentId).toBe(
      "vpc",
    );
    expect(edgeKeys(model)).toContain(`${INTERNET_NODE_ID}>igw`);
    expect(edgeKeys(model)).toContain("igw>alb");
    expect(edgeKeys(model)).toContain("alb>tg");
  });

  it("explains traffic through security groups in the Security view", () => {
    const model = buildGraphModel(graph, options("security"));

    expect(edgeKeys(model)).toEqual(
      expect.arrayContaining(["api>sg-api", "db>sg-db", "sg-api>sg-db"]),
    );
    expect(edgeKeys(model)).not.toContain("api>db");
  });

  it("reveals detail neighbors only when a node is expanded", () => {
    const before = buildGraphModel(graph, options("architecture"));
    const after = buildGraphModel(
      graph,
      options("architecture", { expanded: new Set(["api"]) }),
    );

    expect(
      before.nodes.find((item) => item.id === "api")?.hiddenNeighbors,
    ).toBe(2);
    expect(ids(after)).toEqual(expect.arrayContaining(["sg-api", "tg"]));
  });

  it("folds a collapsed VPC into one node that carries its edges", () => {
    const model = buildGraphModel(
      graph,
      options("architecture", { collapsedGroups: new Set(["vpc"]) }),
    );

    expect(ids(model)).toEqual([INTERNET_NODE_ID, "vpc"]);
    expect(model.nodes.find((item) => item.id === "vpc")?.memberCount).toBe(3);
    expect(edgeKeys(model)).toEqual([`${INTERNET_NODE_ID}>vpc`]);
  });

  it("never invents the Internet without an internet-gateway relationship", () => {
    const model = buildGraphModel(
      {
        ...graph,
        edges: graph.edges.filter((item) => item.source_resource_id !== "igw"),
      },
      options("architecture"),
    );

    expect(ids(model)).not.toContain(INTERNET_NODE_ID);
  });

  it("marks search matches and hides filtered categories", () => {
    const model = buildGraphModel(
      graph,
      options("architecture", {
        query: "db",
        hiddenCategories: new Set(["container"]),
      }),
    );

    expect(model.matchCount).toBe(1);
    expect(model.nodes.find((item) => item.id === "db")?.matches).toBe(true);
    expect(model.nodes.find((item) => item.id === "alb")?.matches).toBe(false);
    expect(ids(model)).not.toContain("api");
  });
});

describe("formatPorts", () => {
  it("labels protocols and ranges", () => {
    expect(
      formatPorts([
        { protocol: "tcp", from_port: 5432, to_port: 5432 },
        { protocol: "tcp", from_port: 8000, to_port: 8080 },
        { protocol: "-1", from_port: null, to_port: null },
      ]),
    ).toBe("TCP 5432, TCP 8000-8080, All traffic");
  });
});
