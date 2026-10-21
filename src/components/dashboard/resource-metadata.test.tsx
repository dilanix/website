import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResourceMetadata } from "./resource-metadata";

afterEach(cleanup);

describe("ResourceMetadata", () => {
  it("renders scalar, list, object, and list-of-object backend metadata", () => {
    const { container } = render(
      <ResourceMetadata
        metadata={{
          desired_count: 3,
          assign_public_ip: false,
          subnet_ids: ["subnet-a", "subnet-b"],
          runtime_platform: {
            cpu_architecture: "ARM64",
            operating_system_family: "LINUX",
          },
          load_balancers: [
            {
              target_group_arn: "arn:aws:elasticloadbalancing:target-group/api",
              container_name: "api",
              container_port: 8080,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Desired count")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("Assign public IP")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
    expect(screen.getByText("Subnet IDs")).toBeTruthy();
    expect(screen.getByText("subnet-a")).toBeTruthy();
    expect(screen.getByText("subnet-b")).toBeTruthy();
    expect(screen.getByText("CPU architecture")).toBeTruthy();
    expect(screen.getByText("ARM64")).toBeTruthy();

    const loadBalancers = screen.getByText("Load balancers").parentElement;
    expect(loadBalancers).not.toBeNull();
    expect(within(loadBalancers!).getByText("Target group ARN")).toBeTruthy();
    expect(within(loadBalancers!).getByText("Container port")).toBeTruthy();
    expect(within(loadBalancers!).getByText("8080")).toBeTruthy();
    expect(container.querySelector("pre")).toBeNull();
  });

  it("omits null and recursively empty enrichment without dropping zero or false", () => {
    render(
      <ResourceMetadata
        metadata={{
          null_value: null,
          empty_text: "",
          empty_list: [],
          empty_object: { nested: null },
          running_count: 0,
          encrypted: false,
        }}
      />,
    );

    expect(screen.queryByText("Null value")).toBeNull();
    expect(screen.queryByText("Empty list")).toBeNull();
    expect(screen.queryByText("Empty object")).toBeNull();
    expect(screen.getByText("Running count")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getByText("Encrypted")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
  });
});
