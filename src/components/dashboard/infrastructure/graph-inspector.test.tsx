import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreConnectionDetail,
  CoreGraphNode,
  CoreGraphNodeDetail,
} from "@/lib/core/api";
import { tourTargetSelector } from "@/lib/tours/anchors";
import { infrastructureGraphAnchors as tourAnchors } from "@/lib/tours/definitions/infrastructure-graph";
import {
  ConnectionInspector,
  InspectorLoading,
  ResourceInspector,
} from "./graph-inspector";

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
        endpoint_identity: "exact",
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
    reachability: {
      state: "reachable",
      checks: [
        {
          name: "ingress_rule",
          result: "pass",
          detail:
            "The target's security group admits the source's security group.",
        },
        {
          name: "network_acl",
          result: "not_evaluated",
          detail: "Network ACLs are not evaluated.",
        },
      ],
    },
    observed: false,
    observed_identity: null,
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

  it("never shows a blocked or undecided path as reachable, and says why", () => {
    render(
      <ConnectionInspector
        detail={{
          ...connection,
          status: {
            ...connection.status,
            reachability: {
              state: "unknown",
              checks: [
                {
                  name: "egress_rule",
                  result: "unknown",
                  detail:
                    "The source's egress is limited to address ranges, which are not evaluated.",
                },
              ],
            },
          },
        }}
        hops={["edge-1"]}
        activeHop="edge-1"
        onSelectHop={vi.fn()}
        onClose={vi.fn()}
        onSelectResource={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Reachability unknown").length).toBe(2);
    expect(screen.queryByText("Reachable")).toBeNull();
    expect(
      screen.getByText(
        "The source's egress is limited to address ranges, which are not evaluated.",
      ),
    ).toBeTruthy();
  });
});

describe("ConnectionInspector for a flow observation", () => {
  it("states the traffic and that flow logs cannot tell who initiates", () => {
    const flow: CoreConnectionDetail = {
      ...connection,
      edge: {
        ...connection.edge,
        relationship_type: "communicates_with",
        evidence: [
          {
            kind: "observed",
            producer: "aws.vpc_flow_logs",
            confidence: null,
            endpoint_identity: "exact",
            first_observed_at: "2026-09-28T10:00:00Z",
            last_observed_at: "2026-09-28T10:00:00Z",
            attributes: {
              source: "vpc_flow_logs",
              protocol: "tcp",
              direction: "unknown",
              bytes: 2048,
              packets: 20,
              flows: 4,
              endpoints: [
                {
                  resource_id: "api",
                  identity: "attachment",
                  fixed_ports: [],
                  port_min: 32768,
                  port_max: 60999,
                },
                {
                  resource_id: "db",
                  identity: "attachment",
                  fixed_ports: [5432],
                  port_min: 5432,
                  port_max: 5432,
                },
              ],
            },
          },
        ],
      },
      path: [api, db],
      status: {
        ...connection.status,
        permitted: false,
        observed: true,
        observed_identity: "exact",
      },
    };

    render(
      <ConnectionInspector
        detail={flow}
        hops={["edge-1"]}
        activeHop="edge-1"
        onSelectHop={vi.fn()}
        onClose={vi.fn()}
        onSelectResource={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        /recorded 2\.0 KB over 4 TCP flows between these resources \(adverse-media-api on ports 32768-60999, production-db on port 5432\).*do not show which side opens the connection/,
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText(/matched to its resource by security groups/),
    ).toBeNull();
  });

  it("says when a side's resource is only matched by security groups", () => {
    const [evidence] = connection.edge.evidence;
    const flow: CoreConnectionDetail = {
      ...connection,
      edge: {
        ...connection.edge,
        relationship_type: "communicates_with",
        evidence: [
          {
            ...evidence,
            kind: "observed",
            producer: "aws.vpc_flow_logs",
            endpoint_identity: "heuristic",
            attributes: {
              source: "vpc_flow_logs",
              protocol: "tcp",
              bytes: 100,
              flows: 1,
              endpoints: [],
            },
          },
        ],
      },
      path: [api, db],
      status: {
        ...connection.status,
        permitted: false,
        observed: true,
        observed_identity: "heuristic",
      },
    };

    render(
      <ConnectionInspector
        detail={flow}
        hops={["edge-1"]}
        activeHop="edge-1"
        onSelectHop={vi.fn()}
        onClose={vi.fn()}
        onSelectResource={vi.fn()}
      />,
    );

    expect(screen.getByText("resource guessed")).toBeTruthy();
    expect(
      screen.getByText(
        /matched to its resource by security groups and subnet, not stated by AWS/,
      ),
    ).toBeTruthy();
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
        external={null}
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

describe("ResourceInspector external endpoints", () => {
  const gateway = node("litellm", "litellm", "container.service");
  const detail: CoreGraphNodeDetail = {
    node: api,
    connection_id: "conn-1",
    provider_resource_key: "arn:aws:ecs:eu-west-1:123:service/api",
    zone: null,
    tags: {},
    extra: {},
    capacity: {},
    first_seen_at: "2026-09-28T10:00:00Z",
    last_seen_at: "2026-09-28T10:00:00Z",
  };
  const neighborhood = { resource: api, edges: [], peers: [], total_edges: 0 };

  it("shows an endpoint reached through a gateway, its provider and why", () => {
    const onSelectResource = vi.fn();
    render(
      <ResourceInspector
        detail={detail}
        neighborhood={neighborhood}
        external={{
          resource: api,
          nodes: [gateway],
          truncated: false,
          items: [
            {
              endpoint_kind: "host",
              endpoint: "api.openai.com",
              provider: "openai",
              relationship_type: "connects_to",
              via_resource_id: "litellm",
              hops: [
                {
                  resource_id: "litellm",
                  relationship_type: "connects_to",
                  evidence_kinds: ["configured"],
                  exact: true,
                  observed: false,
                },
              ],
              evidence: [
                {
                  kind: "observed",
                  producer: "aws.xray",
                  confidence: null,
                  endpoint_identity: "exact",
                  first_observed_at: "2026-09-28T10:00:00Z",
                  last_observed_at: "2026-09-28T10:00:00Z",
                  attributes: { source: "xray", requests: 1500, errors: 2 },
                },
              ],
              observed: false,
              identity: "exact",
            },
          ],
        }}
        onClose={vi.fn()}
        onSelectResource={onSelectResource}
        onSelectRelationship={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /External/ }));
    expect(screen.getByText("api.openai.com")).toBeTruthy();
    expect(screen.getByText("openai")).toBeTruthy();
    expect(screen.getByText("Not observed end to end")).toBeTruthy();
    expect(
      screen.getByText(
        /AWS X-Ray traced 1,500 calls from litellm \(2 errors\)/,
      ),
    ).toBeTruthy();
    expect(screen.getByText("litellm calls this host.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "litellm" }));
    expect(onSelectResource).toHaveBeenCalledWith("litellm");
  });

  it("says traffic named by a DNS answer is traffic, not calls", () => {
    render(
      <ResourceInspector
        detail={detail}
        neighborhood={neighborhood}
        external={{
          resource: api,
          nodes: [],
          truncated: false,
          items: [
            {
              endpoint_kind: "host",
              endpoint: "api.openai.com",
              provider: "openai",
              relationship_type: "communicates_with",
              via_resource_id: api.id,
              hops: [],
              evidence: [
                {
                  kind: "observed",
                  producer: "aws.dns_query_logs_s3",
                  confidence: null,
                  endpoint_identity: "heuristic",
                  first_observed_at: "2026-10-13T09:00:00Z",
                  last_observed_at: "2026-10-13T10:00:00Z",
                  attributes: {
                    source: "dns_query_logs",
                    bytes: 2048,
                    flows: 3,
                  },
                },
              ],
              observed: false,
              identity: "heuristic",
            },
          ],
        }}
        onClose={vi.fn()}
        onSelectResource={vi.fn()}
        onSelectRelationship={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /External/ }));
    expect(
      screen.getByText(/exchanges traffic with this host — traffic was seen/),
    ).toBeTruthy();
    expect(
      screen.getByText(/looked up this host and VPC Flow Logs recorded/),
    ).toBeTruthy();
    expect(screen.getByText(/also answered other host names/)).toBeTruthy();
  });

  it("does not claim a resource calls nothing when none is known", () => {
    render(
      <ResourceInspector
        detail={detail}
        neighborhood={neighborhood}
        external={{ resource: api, nodes: [], truncated: false, items: [] }}
        onClose={vi.fn()}
        onSelectResource={vi.fn()}
        onSelectRelationship={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /External/ }));
    expect(screen.getByText(/does not mean it calls none/)).toBeTruthy();
  });
});

describe("ConnectionInspector for logged load balancer requests", () => {
  it("states the requests, the target port and that access logs are best-effort", () => {
    const logged: CoreConnectionDetail = {
      ...connection,
      edge: {
        ...connection.edge,
        relationship_type: "connects_to",
        evidence: [
          {
            kind: "observed",
            producer: "aws.alb_access_logs",
            confidence: null,
            endpoint_identity: "heuristic",
            first_observed_at: "2026-09-28T10:00:00Z",
            last_observed_at: "2026-09-28T10:00:00Z",
            attributes: {
              source: "alb_access_logs",
              requests: 1200,
              client_errors: 3,
              server_errors: 2,
              bytes: 4096,
              target_ports: [8080],
            },
          },
        ],
      },
      path: [api, db],
      status: {
        ...connection.status,
        permitted: false,
        observed: true,
        observed_identity: "heuristic",
      },
    };

    render(
      <ConnectionInspector
        detail={logged}
        hops={["edge-1"]}
        activeHop="edge-1"
        onSelectHop={vi.fn()}
        onClose={vi.fn()}
        onSelectResource={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        /ALB access logs recorded 1,200 requests from adverse-media-api to production-db \(port 8080\), 2 with a 5xx response.*best-effort.*not registered in the logged target group/,
      ),
    ).toBeTruthy();
  });
});

describe("product tour anchors", () => {
  const anchored = (anchor: string) =>
    document.querySelector(tourTargetSelector(anchor));

  it("marks only a loaded inspector, so a tour step waits past loading", () => {
    render(<InspectorLoading onClose={vi.fn()} />);
    expect(anchored(tourAnchors.inspector)).toBeNull();
    expect(anchored(tourAnchors.connection)).toBeNull();
    cleanup();

    render(
      <ResourceInspector
        detail={{
          node: db,
          connection_id: "conn-1",
          provider_resource_key: "db",
          zone: null,
          tags: {},
          extra: {},
          capacity: {},
          first_seen_at: "2026-09-01T10:00:00Z",
          last_seen_at: "2026-09-28T10:00:00Z",
        }}
        neighborhood={{ resource: db, edges: [], peers: [], total_edges: 0 }}
        external={null}
        onClose={vi.fn()}
        onSelectResource={vi.fn()}
        onSelectRelationship={vi.fn()}
      />,
    );
    expect(anchored(tourAnchors.inspector)).not.toBeNull();
    expect(anchored(tourAnchors.inspectorTabs)?.getAttribute("role")).toBe(
      "tablist",
    );
    cleanup();

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
    expect(anchored(tourAnchors.connection)).not.toBeNull();
    expect(anchored(tourAnchors.connectionStatus)?.textContent).toContain(
      "Internet path",
    );
    expect(anchored(tourAnchors.inspector)).toBeNull();
  });
});
