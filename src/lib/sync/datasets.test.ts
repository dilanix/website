import { describe, expect, it } from "vitest";
import {
  DEFAULT_SYNC_INTERVAL_SECONDS,
  eligibleSyncDatasets,
  SYNC_DATASETS,
  SYNC_INTERVAL_PRESETS,
} from "./datasets";

describe("eligibleSyncDatasets", () => {
  it("returns only datasets whose required capability is enabled", () => {
    const result = eligibleSyncDatasets(["inventory.read"]);

    expect(result.map((dataset) => dataset.slug)).toEqual([
      "inventory.resources",
    ]);
  });

  it("returns every capability-matching dataset when multiple capabilities are enabled", () => {
    const result = eligibleSyncDatasets(["inventory.read", "billing.read"]);

    expect(result.map((dataset) => dataset.slug).sort()).toEqual([
      "billing.cost_summary",
      "inventory.resources",
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

  it("contains only datasets executable by the current Core registry", () => {
    expect(SYNC_DATASETS.map((dataset) => dataset.slug).sort()).toEqual([
      "billing.cost_summary",
      "inventory.resources",
    ]);
  });
});

describe("SYNC_INTERVAL_PRESETS", () => {
  it("every preset is at or above the backend's default minimum (1h)", () => {
    for (const preset of SYNC_INTERVAL_PRESETS) {
      expect(preset.seconds).toBeGreaterThanOrEqual(3600);
    }
  });

  it("defaults to the shortest preset (every hour)", () => {
    expect(DEFAULT_SYNC_INTERVAL_SECONDS).toBe(3600);
  });
});
