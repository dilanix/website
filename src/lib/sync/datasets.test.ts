import { describe, expect, it } from "vitest";
import { eligibleSyncDatasets, SYNC_DATASETS } from "./datasets";

describe("eligibleSyncDatasets", () => {
  it("returns only datasets whose required capability is enabled", () => {
    const result = eligibleSyncDatasets(["inventory.read", "billing.read"]);

    expect(result.map((dataset) => dataset.slug)).toEqual([
      "inventory.resources",
      "billing.cost_usage",
    ]);
  });

  it("returns an empty list when no capability is enabled", () => {
    expect(eligibleSyncDatasets([])).toEqual([]);
  });

  it("returns every dataset when every capability is enabled", () => {
    const allCapabilities = SYNC_DATASETS.map(
      (dataset) => dataset.requiredCapability,
    );

    expect(eligibleSyncDatasets(allCapabilities)).toHaveLength(
      SYNC_DATASETS.length,
    );
  });
});
