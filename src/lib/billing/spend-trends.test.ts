import { describe, expect, it } from "vitest";
import { parseSpendTrendRange, spendTrendPeriod } from "./spend-trends";

describe("spend trend ranges", () => {
  const now = new Date("2026-09-27T15:30:00Z");

  it("ends daily ranges at the start of today, excluding the incomplete day", () => {
    expect(spendTrendPeriod("30d", now)).toEqual({
      periodStart: "2026-08-28T00:00:00.000Z",
      periodEnd: "2026-09-27T00:00:00.000Z",
      granularity: "daily",
    });
    expect(spendTrendPeriod("90d", now).periodStart).toBe(
      "2026-06-29T00:00:00.000Z",
    );
  });

  it("covers the twelve completed calendar months for the monthly range", () => {
    expect(spendTrendPeriod("12m", now)).toEqual({
      periodStart: "2025-09-01T00:00:00.000Z",
      periodEnd: "2026-09-01T00:00:00.000Z",
      granularity: "monthly",
    });
  });

  it("falls back to the default range for unknown values", () => {
    expect(parseSpendTrendRange("12m")).toBe("12m");
    expect(parseSpendTrendRange("7y")).toBe("30d");
    expect(parseSpendTrendRange(undefined)).toBe("30d");
  });
});
