import type { Point } from "./graph-layout";

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

function towards(from: Point, to: Point, length: number): Point {
  const total = distance(from, to);
  if (total === 0) return from;
  const ratio = length / total;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

/** Drops repeated and collinear points so corners are real bends. */
function simplify(points: readonly Point[]): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    const last = result[result.length - 1];
    if (last && last.x === point.x && last.y === point.y) continue;
    const beforeLast = result[result.length - 2];
    if (
      beforeLast &&
      last &&
      ((beforeLast.x === last.x && last.x === point.x) ||
        (beforeLast.y === last.y && last.y === point.y))
    ) {
      result[result.length - 1] = point;
      continue;
    }
    result.push(point);
  }
  return result;
}

/** SVG path through an orthogonal route, with rounded corners. */
export function roundedPath(points: readonly Point[], radius = 10): string {
  const route = simplify(points);
  if (route.length === 0) return "";
  const [first] = route;
  let path = `M ${first.x} ${first.y}`;
  for (let index = 1; index < route.length - 1; index += 1) {
    const previous = route[index - 1];
    const corner = route[index];
    const next = route[index + 1];
    const r = Math.min(
      radius,
      distance(previous, corner) / 2,
      distance(corner, next) / 2,
    );
    const entry = towards(corner, previous, r);
    const exit = towards(corner, next, r);
    path += ` L ${entry.x} ${entry.y} Q ${corner.x} ${corner.y} ${exit.x} ${exit.y}`;
  }
  const last = route[route.length - 1];
  if (route.length > 1) path += ` L ${last.x} ${last.y}`;
  return path;
}

/** The point halfway along a route, where its label sits. */
export function routeMidpoint(points: readonly Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let total = 0;
  for (let index = 1; index < points.length; index += 1)
    total += distance(points[index - 1], points[index]);
  let remaining = total / 2;
  for (let index = 1; index < points.length; index += 1) {
    const segment = distance(points[index - 1], points[index]);
    if (remaining <= segment)
      return towards(points[index - 1], points[index], remaining);
    remaining -= segment;
  }
  return points[points.length - 1];
}
