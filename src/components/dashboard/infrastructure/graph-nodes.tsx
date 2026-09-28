"use client";

import { memo } from "react";
import { Handle, Position, useStore, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, Cloud, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModelNode } from "@/lib/infrastructure/graph-model";
import { resourceVisual } from "./resource-visuals";

export interface GraphNodeData extends Record<string, unknown> {
  model: ModelNode;
  onToggleExpand: (id: string) => void;
  onToggleGroup: (id: string) => void;
}

const zoomSelector = (state: { transform: [number, number, number] }) =>
  state.transform[2];

/** Semantic zoom: full card, then icon + name, then icon only. */
function useDetailLevel() {
  const zoom = useStore(zoomSelector);
  if (zoom < 0.35) return "icon" as const;
  if (zoom < 0.6) return "compact" as const;
  return "full" as const;
}

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

function statusTone(node: ModelNode["resource"]) {
  if (!node) return "bg-muted-foreground/40";
  if (node.lifecycle_status !== "active") return "bg-amber-400";
  const status = node.status.toLowerCase();
  if (/(fail|error|impaired|unhealthy|stopp|delet|inactive)/.test(status))
    return "bg-rose-400";
  if (/(pending|creat|modif|updat|provision|drain)/.test(status))
    return "bg-amber-400";
  return "bg-emerald-400";
}

export const ResourceNode = memo(function ResourceNode({
  data,
  selected,
}: NodeProps & { data: GraphNodeData }) {
  const { model, onToggleExpand } = data;
  const resource = model.resource!;
  const visual = resourceVisual(resource.resource_type, resource.category);
  const Icon = visual.icon;
  const level = useDetailLevel();
  const title = resource.name ?? resource.external_id;

  return (
    <div
      className={cn(
        "group relative flex h-[62px] w-[212px] items-center gap-3 rounded-2xl border px-3 transition-[opacity,box-shadow,border-color] duration-200",
        "border-border-soft bg-dashboard-panel-strong/95 shadow-[0_14px_36px_var(--shadow-card)] backdrop-blur",
        selected &&
          "border-accent/70 shadow-[0_0_0_1px_var(--accent),0_18px_48px_var(--shadow-brand)]",
        !model.matches && "opacity-25",
        level === "icon" && "justify-center",
      )}
      title={`${title} · ${visual.label}`}
    >
      <Handles />
      <span
        className={cn(
          "relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)]",
          visual.tile,
        )}
      >
        <Icon size={19} strokeWidth={2} />
        <span
          aria-hidden="true"
          className={cn(
            "ring-dashboard-panel-strong absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2",
            statusTone(resource),
          )}
        />
      </span>
      {level !== "icon" ? (
        <span className="min-w-0 flex-1">
          <span className="text-foreground block truncate text-[13px] leading-5 font-semibold">
            {title}
          </span>
          {level === "full" ? (
            <span className="text-muted-foreground block truncate text-[11px] leading-4">
              {visual.label}
              <span className="text-muted-foreground/60">
                {" "}
                · {resource.provider.toUpperCase()}
              </span>
            </span>
          ) : null}
        </span>
      ) : null}
      {model.hiddenNeighbors > 0 || model.expanded ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand(model.id);
          }}
          className={cn(
            "nodrag absolute -right-2 -bottom-2 flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full border px-1 text-[10px] font-semibold shadow-sm transition-colors",
            model.expanded
              ? "border-accent/50 bg-accent text-accent-foreground"
              : "border-border-soft bg-card-strong text-muted-foreground hover:text-foreground",
          )}
          aria-label={
            model.expanded
              ? `Collapse ${title}`
              : `Expand ${model.hiddenNeighbors} related resources of ${title}`
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

  if (model.collapsed) {
    return (
      <div
        className={cn(
          "flex h-[66px] w-[236px] items-center gap-3 rounded-2xl border border-dashed px-3",
          "border-cyan-400/50 bg-cyan-500/[0.07] shadow-[0_14px_36px_var(--shadow-card)] backdrop-blur",
          selected && "border-accent shadow-[0_0_0_1px_var(--accent)]",
          !model.matches && "opacity-40",
        )}
      >
        <Handles />
        <span className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">
            {visual.label} {title}
          </span>
          <span className="text-muted-foreground block text-[11px]">
            {model.memberCount} resources
          </span>
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleGroup(model.id);
          }}
          className="nodrag text-muted-foreground hover:text-foreground rounded-md p-1"
          aria-label={`Expand ${visual.label} ${title}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  const isSubnet = resource.resource_type === "network.subnet";
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
      <div className="flex items-center gap-2 px-4 pt-3">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-lg",
            isSubnet
              ? "bg-teal-400/15 text-teal-400"
              : "bg-cyan-400/15 text-cyan-400",
          )}
        >
          <Icon size={13} />
        </span>
        <span className="text-foreground/90 truncate text-xs font-semibold tracking-wide">
          {visual.label}
        </span>
        <span className="text-muted-foreground truncate font-mono text-[11px]">
          {title}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleGroup(model.id);
          }}
          className="nodrag text-muted-foreground hover:text-foreground ml-auto rounded-md p-0.5"
          aria-label={`Collapse ${visual.label} ${title}`}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
});

export const InternetNode = memo(function InternetNode({
  selected,
}: NodeProps) {
  return (
    <div className="flex h-[92px] w-[132px] flex-col items-center justify-center gap-1.5">
      <Handles />
      <span
        className={cn(
          "relative flex size-14 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/10 text-sky-300",
          "shadow-[0_0_36px_rgba(56,189,248,0.35)]",
          selected && "border-accent",
        )}
      >
        <span className="animate-breathe absolute inset-0 rounded-full bg-sky-400/10" />
        <Cloud size={26} strokeWidth={1.8} />
      </span>
      <span className="text-foreground text-xs font-semibold">Internet</span>
    </div>
  );
});

export const graphNodeTypes = {
  resource: ResourceNode,
  group: GroupNode,
  internet: InternetNode,
};
