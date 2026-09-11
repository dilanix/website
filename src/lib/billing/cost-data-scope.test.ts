import { describe, expect, it } from "vitest";
import { parseCostDataScope } from "./cost-data-scope";

describe("parseCostDataScope", () => {
  it("uses the first connection and target values", () => {
    expect(
      parseCostDataScope({
        connection: [
          "10000000-0000-4000-8000-000000000001",
          "10000000-0000-4000-8000-000000000002",
        ],
        target: [
          "20000000-0000-4000-8000-000000000001",
          "20000000-0000-4000-8000-000000000002",
        ],
      }),
    ).toEqual({
      connectionId: "10000000-0000-4000-8000-000000000001",
      targetId: "20000000-0000-4000-8000-000000000001",
    });
  });

  it("drops a target that is not nested under a connection", () => {
    expect(
      parseCostDataScope({
        target: "20000000-0000-4000-8000-000000000001",
      }),
    ).toEqual({
      connectionId: null,
      targetId: null,
    });
  });

  it("ignores malformed ids", () => {
    expect(parseCostDataScope({ connection: "not-a-uuid" })).toEqual({
      connectionId: null,
      targetId: null,
    });
  });
});
