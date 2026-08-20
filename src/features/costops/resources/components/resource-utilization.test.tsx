import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { COMPUTE_INSTANCE_METRICS } from "../analytics/metric-definitions";
import {
  getMockResourceAnalytics,
  MOCK_UNAVAILABLE_MEMORY,
  MOCK_UNAVAILABLE_MEMORY_SERIES,
} from "../analytics/mock-resource-analytics";
import { ResourceUtilization } from "./resource-utilization";

afterEach(cleanup);

describe("ResourceUtilization", () => {
  it("shows latest observation freshness and changes historical ranges", () => {
    render(
      <ResourceUtilization
        analytics={getMockResourceAnalytics("resource-1")}
        definition={COMPUTE_INSTANCE_METRICS}
      />,
    );

    expect(screen.getByText("Latest Metrics")).toBeInTheDocument();
    expect(screen.getByText("Updated 2 min ago")).toBeInTheDocument();
    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "24 hours" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "7 days" }));

    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Moderate")).toBeInTheDocument();
  });

  it("renders unavailable metrics without displaying a fake zero", () => {
    const analytics = structuredClone(getMockResourceAnalytics("resource-2"));
    analytics.latest["memory.utilization"] = MOCK_UNAVAILABLE_MEMORY;
    for (const range of ["24h", "7d", "30d"] as const) {
      analytics.ranges[range]!.series["memory.utilization"] =
        MOCK_UNAVAILABLE_MEMORY_SERIES;
    }

    render(
      <ResourceUtilization
        analytics={analytics}
        definition={COMPUTE_INSTANCE_METRICS}
      />,
    );

    expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "CloudWatch Agent is required to collect OS-level memory metrics.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });
});
