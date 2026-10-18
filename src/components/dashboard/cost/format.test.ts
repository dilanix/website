import { describe, expect, it } from "vitest";
import { formatAmount } from "./format";

describe("formatAmount", () => {
  it("formats a regular amount with 2 decimals", () => {
    expect(formatAmount(20, "USD")).toBe("20.00 USD");
    expect(formatAmount(0.06, "USD")).toBe("0.06 USD");
  });

  it("never renders a bare negative zero for a tiny negative amount that rounds to zero", () => {
    // Usage nearly fully offset by a credit nets to a value like this —
    // toLocaleString would otherwise render "-0.00", reading as broken.
    expect(formatAmount(-0.0000625, "USD")).toBe("0.00 USD");
    expect(formatAmount(-0, "USD")).toBe("0.00 USD");
  });

  it("still shows the sign for an amount that rounds to a real nonzero cent value", () => {
    expect(formatAmount(-0.006, "USD")).toBe("-0.01 USD");
  });
});
