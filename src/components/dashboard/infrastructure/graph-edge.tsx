"use client";

import { memo } from "react";
import { getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { CoreEvidenceKind } from "@/lib/core/api";
import type { ModelEdge } from "@/lib/infrastructure/graph-model";
import type { Point } from "@/lib/infrastructure/graph-layout";
import { roundedPath, routeMidpoint } from "@/lib/infrastructure/edge-path";

export interface GraphEdgeData extends Record<string, unknown> {
  model: ModelEdge;
  /** ELK's orthogonal route; `null` once an endpoint was dragged away from it. */
  route: Point[] | null;
  color: string;
  dash: string | undefined;
  /** Protocol/port (and, in Runtime, the interaction verb). */
  label: string;
  /** Traffic-carrying edges animate their direction while highlighted. */
  flow: boolean;
}

export const VERBS: Record<string, string> = {
  writes_to: "writes",
  reads_from: "reads",
  triggers: "triggers",
  uses: "uses",
  depends_on: "depends on",
  connects_to: "connects",
  communicates_with: "exchanges traffic",
};

/** Strongest evidence first: what we saw beats what configuration allows. */
const EVIDENCE_PRIORITY: CoreEvidenceKind[] = [
  "observed",
  "user_confirmed",
  "configured",
  "permitted",
  "inferred",
];

export function dominantEvidence(kinds: CoreEvidenceKind[]) {
  return EVIDENCE_PRIORITY.find((kind) => kinds.includes(kind)) ?? null;
}

export const TRAFFIC_TYPES = new Set([
  "connects_to",
  "exposes",
  "routes_to",
  "targets",
  "writes_to",
  "reads_from",
  "triggers",
]);

/**
 * One relationship, drawn along its routed path. Emphasis (highlight, dim,
 * labels, level of detail) is pure CSS driven by classes on the edge and the
 * workspace's zoom level, so zooming and hovering never re-render edges.
 */
export const RelationshipEdge = memo(function RelationshipEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps & { data?: GraphEdgeData }) {
  if (!data) return null;
  let path: string;
  let labelAt: Point;
  if (data.route) {
    path = roundedPath(data.route, 16);
    labelAt = routeMidpoint(data.route);
  } else {
    const [smooth, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius: 10,
    });
    path = smooth;
    labelAt = { x: labelX, y: labelY };
  }
  const labelWidth = data.label.length * 6.1 + 12;

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="react-flow__edge-interaction"
      />
      <path
        d={path}
        fill="none"
        stroke={data.color}
        strokeDasharray={data.dash}
        markerEnd={markerEnd}
        className="graph-edge-path"
        style={{ color: data.color }}
      />
      {data.flow ? (
        <path
          d={path}
          fill="none"
          stroke={data.color}
          strokeDasharray="3 14"
          strokeLinecap="round"
          className="graph-edge-flow"
        />
      ) : null}
      {data.label ? (
        <g
          className="graph-edge-label"
          transform={`translate(${labelAt.x} ${labelAt.y})`}
        >
          <rect
            x={-labelWidth / 2}
            y={-9}
            width={labelWidth}
            height={18}
            rx={5}
            stroke={data.color}
          />
          <text textAnchor="middle" dominantBaseline="central">
            {data.label}
          </text>
        </g>
      ) : null}
    </>
  );
});

export const graphEdgeTypes = { relationship: RelationshipEdge };
