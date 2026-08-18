import { describe, expect, it } from "vitest";
import { formatPercentage } from "./utils";

describe("CostOps formatting", () => {
  it("formats backend decimal percentages as readable UI values", () => {
    expect(formatPercentage("-36.52238188389265179304708169")).toBe("-36.5%");
    expect(formatPercentage("0")).toBe("0.0%");
    expect(formatPercentage(null)).toBe("—");
  });
});
