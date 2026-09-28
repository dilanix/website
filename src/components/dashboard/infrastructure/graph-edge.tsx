"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useStore,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { CoreEvidenceKind } from "@/lib/core/api";
import { formatPorts, type ModelEdge } from "@/lib/infrastructure/graph-model";
import { EVIDENCE_STYLES } from "./resource-visuals";

export interface GraphEdgeData extends Record<string, unknown> {
  model: ModelEdge;
  dimmed: boolean;
}

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

const TRAFFIC_TYPES = new Set([
  "connects_to",
  "exposes",
  "routes_to",
  "targets",
]);

export const RelationshipEdge = memo(function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps & { data?: GraphEdgeData }) {
  const zoom = useStore((state) => state.transform[2]);
  const model = data?.model;
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 14,
  });
  if (!model) return null;

  const kind = dominantEvidence(model.kinds);
  const style = kind ? EVIDENCE_STYLES[kind] : null;
  const color = style?.color ?? "#64748b";
  const traffic = TRAFFIC_TYPES.has(model.relationshipType);
  const label = formatPorts(model.ports);
  const showLabel = Boolean(label) && (selected || zoom >= 0.7);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={18}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.6 : 1.6,
          strokeDasharray: style?.dash,
          opacity: data?.dimmed ? 0.15 : selected ? 1 : 0.8,
          filter: selected ? `drop-shadow(0 0 6px ${color})` : undefined,
          transition: "opacity 200ms, stroke-width 150ms",
        }}
      />
      {traffic &&
      !data?.dimmed &&
      kind !== "permitted" &&
      kind !== "inferred" ? (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={selected ? 2.6 : 1.8}
          strokeDasharray="3 14"
          strokeLinecap="round"
          className="graph-edge-flow pointer-events-none"
          style={{ opacity: 0.9 }}
        />
      ) : null}
      {showLabel ? (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              borderColor: `${color}66`,
            }}
            className={cn(
              "bg-dashboard-panel-strong/95 text-foreground pointer-events-none absolute rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-medium shadow-sm backdrop-blur",
              data?.dimmed && "opacity-20",
            )}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
});

export const graphEdgeTypes = { relationship: RelationshipEdge };
