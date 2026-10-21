import { describe, expect, it } from "vitest";
import { roundedPath, routeMidpoint } from "./edge-path";

describe("roundedPath", () => {
  it("rounds each bend of an orthogonal route", () => {
    expect(
      roundedPath([
        { x: 0, y: 0 },
        { x: 0, y: 40 },
        { x: 60, y: 40 },
      ]),
    ).toBe("M 0 0 L 0 30 Q 0 40 10 40 L 60 40");
  });

  it("never rounds beyond half a short segment", () => {
    expect(
      roundedPath([
        { x: 0, y: 0 },
        { x: 0, y: 8 },
        { x: 30, y: 8 },
      ]),
    ).toBe("M 0 0 L 0 4 Q 0 8 4 8 L 30 8");
  });

  it("drops duplicate and collinear points", () => {
    expect(
      roundedPath([
        { x: 0, y: 0 },
        { x: 0, y: 10 },
        { x: 0, y: 10 },
        { x: 0, y: 50 },
      ]),
    ).toBe("M 0 0 L 0 50");
  });
});

describe("routeMidpoint", () => {
  it("finds the point halfway along the route's length", () => {
    expect(
      routeMidpoint([
        { x: 0, y: 0 },
        { x: 0, y: 40 },
        { x: 60, y: 40 },
      ]),
    ).toEqual({ x: 10, y: 40 });
  });
});
