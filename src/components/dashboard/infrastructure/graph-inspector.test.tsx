import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreConnectionDetail,
  CoreGraphNode,
  CoreGraphNodeDetail,
} from "@/lib/core/api";
import { ConnectionInspector, ResourceInspector } from "./graph-inspector";

afterEach(cleanup);

function node(id: string, name: string, resourceType: string): CoreGraphNode {
  return {
    id,
    target_id: "target-1",
    provider: "aws",
    provider_resource_type: `x.${id}`,
    resource_type: resourceType,
    category: resourceType.split(".")[0],
    external_id: id,
    name,
    region: "eu-west-1",
    status: "available",
    lifecycle_status: "active",
  };
}

const api = node("api", "adverse-media-api", "container.service");
const sgApi = node("sg-api", "sg-api", "network.security_group");
const sgDb = node("sg-db", "sg-db", "network.security_group");
const db = node("db", "production-db", "database.instance");

const connection: CoreConnectionDetail = {
  edge: {
    id: "edge-1",
    source_resource_id: "api",
    target_resource_id: "db",
    relationship_type: "connects_to",
    first_seen_at: "2026-09-28T10:00:00Z",
    last_seen_at: "2026-09-28T10:00:00Z",
    evidence: [
      {
        kind: "permitted",
        producer: "aws.configuration",
        confidence: null,
        first_observed_at: "2026-09-28T10:00:00Z",
        last_observed_at: "2026-09-28T10:00:00Z",
        attributes: {
          protocol: "tcp",
          from_port: 5432,
          to_port: 5432,
          source_security_group: {
            id: "sg-api",
            external_id: "sg-api",
            name: "sg-api",
          },
          target_security_group: {
            id: "sg-db",
            external_id: "sg-db",
            name: "sg-db",
          },
          egress_permitted: true,
          same_vpc: true,
        },
      },
    ],
  },
  source: api,
  target: db,
  path: [api, sgApi, sgDb, db],
  status: {
    configured: false,
    permitted: true,
    reachable: true,
    observed: false,
    inferred: false,
    user_confirmed: false,
    internet_exposed: false,
    last_observed_at: null,
    confidence: null,
  },
};

describe("ConnectionInspector", () => {
  it("explains why two resources can communicate and never claims observed traffic", () => {
    render(
      <ConnectionInspector
        detail={connection}
        hops={["edge-1"]}
        activeHop="edge-1"
        onSelectHop={vi.fn()}
        onClose={vi.fn()}
        onSelectResource={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Security group sg-db allows TCP 5432 from sg-api."),
    ).toBeTruthy();
    expect(
      screen.getByText("Outbound rules of sg-api allow this traffic."),
    ).toBeTruthy();
    expect(screen.getByText(/No traffic has been observed/)).toBeTruthy();
    expect(screen.getByText("Never observed")).toBeTruthy();
    expect(screen.getByText(/Internet path: No/)).toBeTruthy();
  });

  it("walks the network path through the security groups", () => {
    render(
      <ConnectionInspector
        detail={connection}
        hops={["edge-1"]}
        activeHop="edge-1"
        onSelectHop={vi.fn()}
        onClose={vi.fn()}
        onSelectResource={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Path" }));

    const names = screen
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(names[0]).toContain("adverse-media-api");
    expect(names[1]).toContain("sg-api");
    expect(names[2]).toContain("sg-db");
    expect(names[3]).toContain("production-db");
  });
});

describe("ResourceInspector", () => {
  it("shows security-group rules and links to the Resources page", () => {
    const detail: CoreGraphNodeDetail = {
      node: sgDb,
      connection_id: "conn-1",
      provider_resource_key: "arn:aws:ec2:eu-west-1:123:security-group/sg-db",
      zone: null,
      tags: { team: "platform" },
      extra: {
        ingress_rules: [
          {
            protocol: "tcp",
            from_port: 5432,
            to_port: 5432,
            security_group_ids: ["sg-api"],
          },
        ],
        egress_rules: [],
      },
      capacity: {},
      first_seen_at: "2026-09-01T10:00:00Z",
      last_seen_at: "2026-09-28T10:00:00Z",
    };
    render(
      <ResourceInspector
        detail={detail}
        neighborhood={{ resource: sgDb, edges: [], peers: [], total_edges: 0 }}
        onClose={vi.fn()}
        onSelectResource={vi.fn()}
        onSelectRelationship={vi.fn()}
      />,
    );

    expect(
      screen
        .getByRole("link", { name: /Open in Resources/ })
        .getAttribute("href"),
    ).toBe(
      "/dashboard/products/infrastructure/resources/sg-db?connection=conn-1",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Security" }));
    expect(screen.getByText("TCP 5432")).toBeTruthy();
    expect(screen.getByText("sg-api")).toBeTruthy();
  });
});
