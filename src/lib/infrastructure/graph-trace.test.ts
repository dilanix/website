import { describe, expect, it } from "vitest";
import { buildTraceIndex, traceFrom } from "./graph-trace";

const edges = [
  { id: "internet>alb", source: "internet", target: "alb" },
  { id: "alb>api", source: "alb", target: "api" },
  { id: "api>db", source: "api", target: "db" },
  { id: "api>queue", source: "api", target: "queue" },
  { id: "worker>db", source: "worker", target: "db" },
];

describe("traceFrom", () => {
  it("follows upstream and downstream paths through the focused resource", () => {
    const trace = traceFrom(buildTraceIndex(edges), "api");

    expect([...trace.nodes].sort()).toEqual(
      ["alb", "api", "db", "internet", "queue"].sort(),
    );
    expect([...trace.edges].sort()).toEqual(
      ["alb>api", "api>db", "api>queue", "internet>alb"].sort(),
    );
  });

  it("does not light up siblings that only share a downstream target", () => {
    const trace = traceFrom(buildTraceIndex(edges), "api");

    expect(trace.nodes.has("worker")).toBe(false);
    expect(trace.edges.has("worker>db")).toBe(false);
  });

  it("terminates on cycles", () => {
    const trace = traceFrom(
      buildTraceIndex([
        { id: "a>b", source: "a", target: "b" },
        { id: "b>a", source: "b", target: "a" },
      ]),
      "a",
    );

    expect([...trace.nodes].sort()).toEqual(["a", "b"]);
    expect(trace.edges.size).toBe(2);
  });
});
