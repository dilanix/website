import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CoreResourceTrafficCoverage } from "@/lib/core/api";
import { TrafficCoverage } from "./traffic-coverage";

afterEach(cleanup);

const node = {
  id: "r1",
  target_id: "t1",
  provider: "aws",
  provider_resource_type: "ec2.instance",
  resource_type: "compute.instance",
  category: "compute",
  external_id: "i-1",
  name: "vivox-vpn",
  region: "eu-west-1",
  status: "running",
  lifecycle_status: "active",
};

function coverage(
  state: CoreResourceTrafficCoverage["coverage"]["state"],
  reasons: string[],
): CoreResourceTrafficCoverage {
  return {
    resource: node,
    coverage: {
      state,
      since: "2026-10-08T12:00:00Z",
      until: "2026-10-15T12:00:00Z",
      signals: [
        {
          signal: "network_traffic",
          state: state === "covered" ? "covered" : "none",
          reasons,
          source: state === "covered" ? "vpc_flow_logs" : null,
          visible_from: null,
          visible_until: null,
          read_ratio: state === "covered" ? 1 : 0,
          gaps: 0,
        },
        {
          signal: "load_balancer_requests",
          state: "not_applicable",
          reasons: ["only a load balancer has access logs"],
          source: null,
          visible_from: null,
          visible_until: null,
          read_ratio: 0,
          gaps: 0,
        },
      ],
    },
  };
}

describe("TrafficCoverage", () => {
  it("says missing connections mean nothing when no flow log reads the VPC, and what to enable", () => {
    render(<TrafficCoverage coverage={coverage("none", ["no flow log"])} />);

    expect(screen.getAllByText("Not visible").length).toBeGreaterThan(0);
    expect(screen.getByText(/do not mean it is unused/)).toBeTruthy();
    expect(screen.getByText("no flow log")).toBeTruthy();
    expect(screen.getByText(/Enable VPC flow logs/)).toBeTruthy();
  });

  it("offers no remedy when the traffic was visible", () => {
    render(<TrafficCoverage coverage={coverage("covered", [])} />);

    expect(screen.getAllByText("Visible").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Enable VPC flow logs/)).toBeNull();
  });

  it("says when coverage could not be read", () => {
    render(<TrafficCoverage coverage={null} />);

    expect(
      screen.getByText("Traffic coverage could not be read right now."),
    ).toBeTruthy();
  });
});
