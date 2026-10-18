"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cloud,
  EyeOff,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModelNode } from "@/lib/infrastructure/graph-model";
import { resourceVisual } from "./resource-visuals";

export interface GraphNodeData extends Record<string, unknown> {
  model: ModelNode;
  onToggleExpand: (id: string) => void;
  onToggleGroup: (id: string) => void;
}

// Level of detail, highlight and dimming are CSS (see `.graph-workspace` in
// globals.css), driven by the workspace's zoom level and the node wrapper's
// classes — so zooming, hovering and selecting never re-render node content.

const hiddenHandle = "!h-2 !w-2 !min-w-0 !border-0 !bg-transparent";

function Handles() {
  return (
    <>
      <Handle type="target" position={Position.Top} className={hiddenHandle} />
      <Handle
        type="source"
        position={Position.Bottom}
        className={hiddenHandle}
      />
    </>
  );
}

function status(node: ModelNode["resource"]) {
  if (!node) return { tone: "bg-muted-foreground/40", label: "Unknown" };
  if (node.lifecycle_status !== "active")
    return { tone: "bg-amber-400", label: node.lifecycle_status };
  const value = node.status.toLowerCase();
  if (/(fail|error|impaired|unhealthy|stopp|delet|inactive)/.test(value))
    return { tone: "bg-rose-400", label: node.status };
  if (/(pending|creat|modif|updat|provision|drain)/.test(value))
    return { tone: "bg-amber-400", label: node.status };
  return { tone: "bg-emerald-400", label: node.status };
}

/** Runtime: why missing connections on this resource may mean nothing. */
const TRAFFIC_MARKERS = {
  none: {
    label: "Traffic not visible",
    title:
      "No source read this resource's traffic over the last 7 days — missing connections do not mean it is unused.",
    className: "border-amber-400/45 bg-amber-400/12 text-amber-300",
  },
  partial: {
    label: "Traffic partly visible",
    title:
      "Its traffic was read for only part of the last 7 days, or the resource is matched heuristically.",
    className: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  },
} as const;

function IconTile({
  tile,
  children,
  size = 40,
}: {
  tile: string;
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "graph-node-icon relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)]",
        tile,
      )}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

export const ResourceNode = memo(function ResourceNode({
  data,
  selected,
}: NodeProps & { data: GraphNodeData }) {
  const { model, onToggleExpand } = data;
  const resource = model.resource!;
  const visual = resourceVisual(resource.resource_type, resource.category);
  const Icon = visual.icon;
  const title = resource.name ?? resource.external_id;
  const state = status(resource);

  return (
    <div
      className={cn(
        "graph-card relative flex h-[68px] w-[248px] items-center gap-3 rounded-2xl border px-3",
        selected && "graph-card-selected",
      )}
      title={`${title} · ${visual.label} · ${state.label}`}
    >
      <Handles />
      <IconTile tile={visual.tile}>
        <Icon size={19} strokeWidth={2} />
        <span
          aria-hidden="true"
          className={cn(
            "ring-dashboard-panel-strong absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2",
            state.tone,
          )}
        />
      </IconTile>
      <span className="min-w-0 flex-1">
        <span className="graph-node-title text-foreground block truncate text-[13.5px] leading-5 font-semibold">
          {title}
        </span>
        <span className="graph-node-sub text-muted-foreground block truncate text-[11px] leading-4">
          {visual.label}
          <span className="text-muted-foreground/70">
            {" · "}
            {resource.provider.toUpperCase()}
          </span>
          <span className="graph-lod-near text-muted-foreground/70">
            {" · "}
            {resource.region}
          </span>
        </span>
      </span>
      {model.traffic === "none" || model.traffic === "partial" ? (
        <span
          className={cn(
            "graph-traffic-marker absolute -top-2 left-3 flex items-center gap-1 rounded-full border px-1.5 py-px text-[9.5px] font-semibold",
            TRAFFIC_MARKERS[model.traffic].className,
          )}
          title={TRAFFIC_MARKERS[model.traffic].title}
        >
          <EyeOff size={10} />
          {TRAFFIC_MARKERS[model.traffic].label}
        </span>
      ) : null}
      {model.hiddenNeighbors > 0 || model.expanded ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand(model.id);
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          className={cn(
            "graph-expand nodrag absolute -right-2 -bottom-2 flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full border px-1 text-[10px] font-semibold",
            model.expanded
              ? "border-accent/50 bg-accent text-accent-foreground"
              : "border-border-soft bg-card-strong text-muted-foreground hover:text-foreground",
          )}
          aria-label={
            model.expanded
              ? `Collapse ${title}`
              : `Expand ${model.hiddenNeighbors} related resources of ${title}`
          }
          title={
            model.expanded
              ? "Hide related detail"
              : `Show ${model.hiddenNeighbors} related resources`
          }
        >
          {model.expanded ? (
            <Minus size={11} />
          ) : (
            <>
              <Plus size={10} />
              {model.hiddenNeighbors}
            </>
          )}
        </button>
      ) : null}
    </div>
  );
});

export const GroupNode = memo(function GroupNode({
  data,
  selected,
}: NodeProps & { data: GraphNodeData }) {
  const { model, onToggleGroup } = data;
  const resource = model.resource!;
  const visual = resourceVisual(resource.resource_type, resource.category);
  const Icon = visual.icon;
  const title = resource.name ?? resource.external_id;
  const isSubnet = resource.resource_type === "network.subnet";

  if (model.collapsed) {
    return (
      <div
        className={cn(
          "graph-card graph-card-group flex h-[68px] w-[264px] items-center gap-3 rounded-2xl border border-dashed px-3",
          selected && "graph-card-selected",
        )}
      >
        <Handles />
        <IconTile tile={visual.tile}>
          <Icon size={18} />
        </IconTile>
        <span className="min-w-0 flex-1">
          <span className="graph-node-title block truncate text-[13.5px] leading-5 font-semibold">
            {title}
          </span>
          <span className="graph-node-sub text-muted-foreground block truncate text-[11px] leading-4">
            {visual.label} · {model.memberCount} resources
          </span>
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleGroup(model.id);
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          className="nodrag text-muted-foreground hover:text-foreground rounded-md p-1"
          aria-label={`Expand ${visual.label} ${title}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-full w-full rounded-[1.4rem] border border-dashed",
        isSubnet
          ? "border-teal-400/35 bg-teal-400/[0.035]"
          : "border-cyan-400/40 bg-[linear-gradient(180deg,rgba(34,211,238,0.07),rgba(34,211,238,0.015))]",
        selected && "border-accent/80",
      )}
    >
      <Handles />
      <div className="graph-group-header flex items-center gap-2 px-4 pt-3">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-lg",
            isSubnet
              ? "bg-teal-400/15 text-teal-400"
              : "bg-cyan-400/15 text-cyan-400",
          )}
        >
          <Icon size={13} />
        </span>
        <span className="text-foreground/90 shrink-0 text-xs font-semibold tracking-wide">
          {visual.label}
        </span>
        <span className="text-muted-foreground min-w-0 truncate font-mono text-[11px]">
          {title}
        </span>
        <span className="graph-lod-near text-muted-foreground/70 shrink-0 font-mono text-[10px]">
          {resource.region}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleGroup(model.id);
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          className="nodrag text-muted-foreground hover:text-foreground ml-auto rounded-md p-0.5"
          aria-label={`Collapse ${visual.label} ${title}`}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
});

export const InternetNode = memo(function InternetNode() {
  return (
    <div className="flex h-[84px] w-[148px] flex-col items-center justify-center gap-1.5">
      <Handles />
      <span className="relative flex size-14 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/10 text-sky-300 shadow-[0_0_36px_rgba(56,189,248,0.35)]">
        <span className="animate-breathe graph-ambient absolute inset-0 rounded-full bg-sky-400/10" />
        <Cloud size={26} strokeWidth={1.8} />
      </span>
      <span className="graph-node-title text-foreground text-xs font-semibold">
        Internet
      </span>
    </div>
  );
});

/** Runtime: an external endpoint scope resources call or exchange traffic with. */
export const ExternalNode = memo(function ExternalNode({
  data,
}: NodeProps & { data: GraphNodeData }) {
  const endpoint = data.model.endpoint!;
  return (
    <div
      className="graph-card flex h-[56px] w-[232px] items-center gap-2.5 rounded-full border border-dashed px-3"
      title={`${endpoint.value}${endpoint.provider ? ` · ${endpoint.provider}` : ""} — outside the collected accounts`}
    >
      <Handles />
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-400/12 text-violet-300">
        <ArrowUpRight size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="graph-node-title text-foreground block truncate font-mono text-[12px] leading-5 font-semibold">
          {endpoint.value}
        </span>
        <span className="graph-node-sub text-muted-foreground block truncate text-[11px] leading-4">
          {endpoint.provider ? `${endpoint.provider} · ` : ""}External
          {endpoint.kind === "ip_address" ? " address" : " host"}
        </span>
      </span>
    </div>
  );
});

/** Runtime: every address/host no collected resource held, as one node. */
export const UnresolvedNode = memo(function UnresolvedNode({
  data,
}: NodeProps & { data: GraphNodeData }) {
  const resources = data.model.unresolved?.resources ?? 0;
  return (
    <div
      className="graph-card flex h-[56px] w-[232px] items-center gap-2.5 rounded-full border border-dashed px-3"
      title="Addresses no collected resource held: outside the collected accounts, AWS services, or uncollected interfaces. Never one node per address."
    >
      <Handles />
      <span className="bg-muted-foreground/12 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
        <CircleHelp size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="graph-node-title text-foreground block truncate text-[12.5px] leading-5 font-semibold">
          Unresolved addresses
        </span>
        <span className="graph-node-sub text-muted-foreground block truncate text-[11px] leading-4">
          Traffic with {resources} {resources === 1 ? "resource" : "resources"}
        </span>
      </span>
    </div>
  );
});

export const graphNodeTypes = {
  resource: ResourceNode,
  group: GroupNode,
  internet: InternetNode,
  external: ExternalNode,
  unresolved: UnresolvedNode,
};
