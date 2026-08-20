import { describe, expect, it } from "vitest";
import { RESOURCE_METRIC_DEFINITIONS } from "./metric-definitions";

describe("resource metric definitions", () => {
  it("provides analytics UI definitions for every supported AWS resource", () => {
    expect(Object.keys(RESOURCE_METRIC_DEFINITIONS).sort()).toEqual([
      "block_storage_volume",
      "compute_instance",
      "container_cluster",
      "database_instance",
      "load_balancer",
      "serverless_function",
    ]);

    for (const definition of Object.values(RESOURCE_METRIC_DEFINITIONS)) {
      expect(definition.latest.length).toBeGreaterThan(0);
      expect(definition.groups.length).toBeGreaterThan(0);
    }
  });
});
