import { describe, expect, it } from "vitest";
import {
  COST_BASIS_FILTER_ORDER,
  COST_BASIS_LABELS,
  costBasisLabel,
  costDiff,
  customRange,
  formatCostAmount,
  formatCostPeriod,
  presetRange,
  previousRange,
} from "./cost-summaries";

describe("costBasisLabel", () => {
  it("labels every known cost basis", () => {
    expect(costBasisLabel("unblended")).toBe("Unblended");
    expect(costBasisLabel("net_unblended")).toBe("Net unblended");
    expect(costBasisLabel("amortized")).toBe("Amortized");
    expect(costBasisLabel("net_amortized")).toBe("Net amortized");
  });

  it("filter order covers every labeled cost basis exactly once", () => {
    expect(COST_BASIS_FILTER_ORDER.sort()).toEqual(
      Object.keys(COST_BASIS_LABELS).sort(),
    );
  });
});

describe("formatCostAmount", () => {
  it("formats a whole-dollar amount as USD currency", () => {
    expect(formatCostAmount("10.000000", "USD")).toBe("$10.00");
  });

  it("rounds to two decimals for ordinary amounts", () => {
    expect(formatCostAmount("1234567.891234", "USD")).toBe("$1,234,567.89");
  });

  it("widens precision for sub-cent amounts instead of rounding to zero", () => {
    expect(formatCostAmount("0.001234", "USD")).toBe("$0.0012");
  });

  it("never widens precision for a genuine zero", () => {
    expect(formatCostAmount("0.000000", "USD")).toBe("$0.00");
  });

  it("falls back to a plain number for an unrecognized currency code", () => {
    expect(formatCostAmount("10.00", "NOTACODE")).toBe("10.00 NOTACODE");
  });
});

describe("formatCostPeriod", () => {
  it("renders a daily period as a date range", () => {
    expect(
      formatCostPeriod("2026-08-01T00:00:00Z", "2026-08-02T00:00:00Z"),
    ).toBe("Aug 1 – Aug 2, 2026");
  });

  it("collapses to one date when start and end land on the same day", () => {
    expect(
      formatCostPeriod("2026-08-01T00:00:00Z", "2026-08-01T12:00:00Z"),
    ).toBe("Aug 1, 2026");
  });
});

describe("presetRange", () => {
  const now = new Date("2026-08-31T14:23:00Z");

  it("ends at tomorrow's UTC midnight so today's estimated data is included", () => {
    expect(presetRange("1d", now).end.toISOString()).toBe(
      "2026-09-01T00:00:00.000Z",
    );
  });

  it("spans exactly the preset's day count", () => {
    expect(presetRange("1d", now).start.toISOString()).toBe(
      "2026-08-31T00:00:00.000Z",
    );
    expect(presetRange("7d", now).start.toISOString()).toBe(
      "2026-08-25T00:00:00.000Z",
    );
    expect(presetRange("30d", now).start.toISOString()).toBe(
      "2026-08-02T00:00:00.000Z",
    );
  });
});

describe("previousRange", () => {
  it("returns the immediately preceding range of the same length", () => {
    const range = {
      start: new Date("2026-08-25T00:00:00.000Z"),
      end: new Date("2026-09-01T00:00:00.000Z"),
    };
    const previous = previousRange(range);
    expect(previous.end).toEqual(range.start);
    expect(previous.start.toISOString()).toBe("2026-08-18T00:00:00.000Z");
  });
});

describe("customRange", () => {
  it("includes the whole end date by extending to the next day's midnight", () => {
    const range = customRange("2026-08-20", "2026-08-31");
    expect(range.start.toISOString()).toBe("2026-08-20T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});

describe("costDiff", () => {
  it("computes a positive absolute and percent change", () => {
    const diff = costDiff("15.00", "10.00");
    expect(diff.absolute).toBeCloseTo(5);
    expect(diff.percent).toBeCloseTo(50);
    expect(diff.direction).toBe("up");
  });

  it("computes a negative change", () => {
    const diff = costDiff("8.00", "10.00");
    expect(diff.absolute).toBeCloseTo(-2);
    expect(diff.percent).toBeCloseTo(-20);
    expect(diff.direction).toBe("down");
  });

  it("reports no percent when the previous period was zero", () => {
    const diff = costDiff("10.00", "0.00");
    expect(diff.percent).toBeNull();
    expect(diff.direction).toBe("up");
  });

  it("reports flat when nothing changed", () => {
    const diff = costDiff("10.00", "10.00");
    expect(diff.absolute).toBe(0);
    expect(diff.direction).toBe("flat");
  });
});
