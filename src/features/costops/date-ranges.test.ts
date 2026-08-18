import { describe, expect, it } from "vitest";
import { getCostDateRange, isValidCostDateRange } from "./date-ranges";

const now = new Date("2026-08-19T23:30:00-04:00");

describe("CostOps UTC date ranges", () => {
  it("builds inclusive relative windows using UTC calendar dates", () => {
    expect(getCostDateRange("last_7_days", now)).toEqual({
      startDate: "2026-08-14",
      endDate: "2026-08-20",
    });
    expect(getCostDateRange("last_30_days", now).startDate).toBe("2026-07-22");
  });

  it("builds calendar month boundaries", () => {
    expect(getCostDateRange("current_month", now)).toEqual({
      startDate: "2026-08-01",
      endDate: "2026-08-20",
    });
    expect(getCostDateRange("last_month", now)).toEqual({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
    });
  });

  it("rejects reversed custom ranges", () => {
    expect(
      isValidCostDateRange({
        startDate: "2026-08-20",
        endDate: "2026-08-01",
      }),
    ).toBe(false);
  });
});
