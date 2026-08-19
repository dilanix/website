import { describe, expect, it } from "vitest";
import { formatPercentage, formatRelativeTime } from "./utils";

describe("CostOps formatting", () => {
  it("formats backend decimal percentages as readable UI values", () => {
    expect(formatPercentage("-36.52238188389265179304708169")).toBe("-36.5%");
    expect(formatPercentage("0")).toBe("0.0%");
    expect(formatPercentage(null)).toBe("—");
  });
});

describe("CostOps relative time", () => {
  it("formats backend timestamps with compact relative labels", () => {
    const now = new Date("2026-08-19T20:00:00Z").getTime();
    expect(formatRelativeTime("2026-08-19T20:00:00Z", now)).toBe("Just now");
    expect(formatRelativeTime("2026-08-19T19:56:00Z", now)).toBe("4 min ago");
    expect(formatRelativeTime("2026-08-19T19:00:00Z", now)).toBe("1 hour ago");
  });
});
