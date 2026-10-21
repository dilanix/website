import { describe, expect, it } from "vitest";
import {
  COST_USAGE_METRIC_FILTER_ORDER,
  COST_USAGE_METRIC_LABELS,
  costUsageMetricLabel,
} from "./cost-usage";

describe("costUsageMetricLabel", () => {
  it("labels every known metric", () => {
    expect(costUsageMetricLabel("effective_cost")).toBe("Effective");
    expect(costUsageMetricLabel("billed_cost")).toBe("Billed");
    expect(costUsageMetricLabel("list_cost")).toBe("List");
    expect(costUsageMetricLabel("contracted_cost")).toBe("Contracted");
  });

  it("filter order covers every labeled metric exactly once", () => {
    expect(COST_USAGE_METRIC_FILTER_ORDER.slice().sort()).toEqual(
      Object.keys(COST_USAGE_METRIC_LABELS).sort(),
    );
  });
});
