import { describe, expect, it } from "vitest";
import { limitRatio, limitSentence, planStateLabel } from "./format";

describe("plan formatting", () => {
  it("phrases limits for cards", () => {
    expect(
      limitSentence({
        name: "Connected cloud accounts",
        unit: "accounts",
        value: 5,
      }),
    ).toBe("Up to 5 accounts");
    expect(limitSentence({ name: "Members", unit: "members", value: 1 })).toBe(
      "1 member",
    );
    expect(
      limitSentence({ name: "Members", unit: "members", value: null }),
    ).toBe("Unlimited members");
  });

  it("computes usage ratios, capped and unlimited-safe", () => {
    const base = {
      code: "cloud.accounts",
      name: "Accounts",
      unit: "accounts",
      status: "ok" as const,
      over_limit_action: "block_provider_sync" as const,
      grace_started_at: null,
      grace_ends_at: null,
    };
    expect(limitRatio({ ...base, limit: 4, usage: 1 })).toBe(0.25);
    expect(limitRatio({ ...base, limit: 2, usage: 3 })).toBe(1);
    expect(limitRatio({ ...base, limit: null, usage: 30 })).toBe(0);
  });

  it("labels plan states", () => {
    expect(planStateLabel("trial_expired")).toBe("Trial ended");
    expect(planStateLabel("active")).toBe("Active");
  });
});
