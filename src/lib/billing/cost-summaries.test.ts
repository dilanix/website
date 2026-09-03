import { describe, expect, it } from "vitest";
import {
  COST_BASIS_FILTER_ORDER,
  COST_BASIS_LABELS,
  costBasisLabel,
  formatCostAmount,
  formatCostPeriod,
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
