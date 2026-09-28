"use client";

import "@xyflow/react/dist/style.css";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
  type Edge,
  type Node,
} from "@xyflow/react";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Filter,
  Loader2,
  Maximize,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CoreConnectionDetail,
  CoreGraphNodeDetail,
  CoreResourceNeighborhood,
  CoreScopeGraph,
} from "@/lib/core/api";
import {
  GRAPH_VIEWS,
  INTERNET_NODE_ID,
  buildGraphModel,
  searchResources,
  type GraphView,
  type ModelEdge,
} from "@/lib/infrastructure/graph-model";
import {
  layoutGraph,
  type GraphLayout,
} from "@/lib/infrastructure/graph-layout";
import {
  getGraphConnectionAction,
  getGraphResourceAction,
} from "@/app/dashboard/products/infrastructure-actions";
import { graphNodeTypes, type GraphNodeData } from "./graph-nodes";
import {
  dominantEvidence,
  graphEdgeTypes,
  type GraphEdgeData,
} from "./graph-edge";
import {
  ConnectionInspector,
  InspectorError,
  InspectorLoading,
  ResourceInspector,
} from "./graph-inspector";
import {
  CATEGORY_LABELS,
  EVIDENCE_STYLES,
  resourceVisual,
} from "./resource-visuals";

type Selection =
  | { type: "resource"; id: string }
  | { type: "connection"; hops: string[]; active: string }
  | null;

type Loaded<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

function ToolbarButton({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg border transition-colors",
        active
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-border-soft bg-dashboard-panel-strong/80 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ZoomReadout() {
  const zoom = useStore((state) => state.transform[2]);
  return (
    <span className="text-muted-foreground w-11 text-center font-mono text-[11px]">
      {Math.round(zoom * 100)}%
    </span>
  );
}

function Legend() {
  return (
    <div className="border-border-soft bg-dashboard-panel-strong/90 pointer-events-auto rounded-xl border px-3 py-2.5 shadow-[0_12px_32px_var(--shadow-card)] backdrop-blur">
      <p className="text-muted-foreground mb-1.5 text-[10px] font-semibold tracking-wide uppercase">
        Evidence
      </p>
      <ul className="flex flex-col gap-1">
        {(Object.keys(EVIDENCE_STYLES) as (keyof typeof EVIDENCE_STYLES)[]).map(
          (kind) => (
            <li key={kind} className="flex items-center gap-2 text-[11px]">
              <svg width="26" height="6" aria-hidden="true">
                <line
                  x1="0"
                  y1="3"
                  x2="26"
                  y2="3"
                  stroke={EVIDENCE_STYLES[kind].color}
                  strokeWidth="2"
                  strokeDasharray={EVIDENCE_STYLES[kind].dash}
                />
              </svg>
              {EVIDENCE_STYLES[kind].label}
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function GraphCanvas({ graph }: { graph: CoreScopeGraph }) {
  const flow = useReactFlow();
  const [view, setView] = useState<GraphView>("architecture");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [hiddenCategories, setHiddenCategories] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [layout, setLayout] = useState<GraphLayout | null>(null);
  const [laying, startLayout] = useTransition();
  const [resourceDetails, setResourceDetails] = useState<
    Record<
      string,
      Loaded<{
        detail: CoreGraphNodeDetail;
        neighborhood: CoreResourceNeighborhood;
      }>
    >
  >({});
  const [connectionDetails, setConnectionDetails] = useState<
    Record<string, Loaded<CoreConnectionDetail>>
  >({});
  // Requests already issued — read and written only in event handlers.
  const requested = useRef(new Set<string>());

  const model = useMemo(
    () =>
      buildGraphModel(graph, {
        view,
        expanded,
        collapsedGroups,
        hiddenCategories,
        query,
      }),
    [graph, view, expanded, collapsedGroups, hiddenCategories, query],
  );
  // Layout depends on structure only: search dims nodes without moving them.
  const layoutModel = useMemo(
    () =>
      buildGraphModel(graph, {
        view,
        expanded,
        collapsedGroups,
        hiddenCategories,
        query: "",
      }),
    [graph, view, expanded, collapsedGroups, hiddenCategories],
  );

  useEffect(() => {
    let cancelled = false;
    startLayout(async () => {
      const next = await layoutGraph(layoutModel);
      if (!cancelled) setLayout(next);
    });
    return () => {
      cancelled = true;
    };
  }, [layoutModel]);

  const firstFit = useRef(true);
  useEffect(() => {
    if (!layout) return;
    const handle = window.requestAnimationFrame(() => {
      void flow.fitView({
        padding: 0.15,
        duration: firstFit.current ? 0 : 400,
        maxZoom: 1.1,
      });
      firstFit.current = false;
    });
    return () => window.cancelAnimationFrame(handle);
  }, [layout, flow]);

  const toggle = (set: ReadonlySet<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };
  const onToggleExpand = useCallback(
    (id: string) => setExpanded((current) => toggle(current, id)),
    [],
  );
  const onToggleGroup = useCallback(
    (id: string) => setCollapsedGroups((current) => toggle(current, id)),
    [],
  );

  const loadResource = useCallback((id: string) => {
    const key = `resource:${id}`;
    if (!requested.current.has(key)) {
      requested.current.add(key);
      setResourceDetails((current) => ({
        ...current,
        [id]: { status: "loading" },
      }));
      void getGraphResourceAction(id).then((result) => {
        if (!result.data) requested.current.delete(key);
        setResourceDetails((current) => ({
          ...current,
          [id]: result.data
            ? { status: "ready", data: result.data }
            : { status: "error", message: result.error ?? "Unknown error." },
        }));
      });
    }
    setSelection({ type: "resource", id });
  }, []);

  const loadConnection = useCallback((hops: string[], active: string) => {
    const key = `connection:${active}`;
    if (!requested.current.has(key)) {
      requested.current.add(key);
      setConnectionDetails((current) => ({
        ...current,
        [active]: { status: "loading" },
      }));
      void getGraphConnectionAction(active).then((result) => {
        if (!result.data) requested.current.delete(key);
        setConnectionDetails((current) => ({
          ...current,
          [active]: result.data
            ? { status: "ready", data: result.data }
            : { status: "error", message: result.error ?? "Unknown error." },
        }));
      });
    }
    setSelection({ type: "connection", hops, active });
  }, []);

  const focusResource = useCallback(
    (id: string) => {
      if (flow.getNode(id)) {
        void flow.fitView({
          nodes: [{ id }],
          duration: 500,
          maxZoom: 1.2,
          padding: 0.8,
        });
      }
      loadResource(id);
    },
    [flow, loadResource],
  );

  const selectedId = selection?.type === "resource" ? selection.id : null;
  const selectedEdgeHops = useMemo(
    () => (selection?.type === "connection" ? new Set(selection.hops) : null),
    [selection],
  );

  const nodes = useMemo<Node[]>(() => {
    if (!layout) return [];
    return model.nodes.map((node) => {
      const position = layout.positions.get(node.id) ?? { x: 0, y: 0 };
      const size = layout.groupSizes.get(node.id);
      const data: GraphNodeData = {
        model: node,
        onToggleExpand,
        onToggleGroup,
      };
      return {
        id: node.id,
        type: node.kind,
        position,
        data,
        parentId: node.parentId ?? undefined,
        selected: node.id === selectedId,
        draggable: node.kind !== "group" || node.collapsed,
        selectable: node.kind !== "internet",
        zIndex: node.kind === "group" && !node.collapsed ? 0 : 2,
        ...(size ? { style: { width: size.width, height: size.height } } : {}),
      } satisfies Node;
    });
  }, [layout, model, selectedId, onToggleExpand, onToggleGroup]);

  const edges = useMemo<Edge[]>(() => {
    const query_active = Boolean(query.trim());
    const matching = new Set(
      model.nodes.filter((node) => node.matches).map((node) => node.id),
    );
    return model.edges.map((edge: ModelEdge) => {
      const kind = dominantEvidence(edge.kinds);
      const color = kind ? EVIDENCE_STYLES[kind].color : "#64748b";
      const data: GraphEdgeData = {
        model: edge,
        dimmed:
          query_active &&
          !(matching.has(edge.source) || matching.has(edge.target)),
      };
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "relationship",
        data,
        zIndex: 1,
        selected: Boolean(
          selectedEdgeHops &&
          edge.relationshipIds.some((id) => selectedEdgeHops.has(id)),
        ),
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
          width: 16,
          height: 16,
        },
      } satisfies Edge;
    });
  }, [model, query, selectedEdgeHops]);

  const categories = useMemo(
    () => [...new Set(graph.nodes.map((item) => item.node.category))].sort(),
    [graph],
  );
  const suggestions = useMemo(
    () => searchResources(graph, query),
    [graph, query],
  );

  const resourceState =
    selection?.type === "resource" ? resourceDetails[selection.id] : undefined;
  const connectionState =
    selection?.type === "connection"
      ? connectionDetails[selection.active]
      : undefined;
  const closeInspector = () => setSelection(null);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={graphNodeTypes}
        edgeTypes={graphEdgeTypes}
        minZoom={0.08}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onlyRenderVisibleElements
        onNodeClick={(_, node) => {
          if (node.id === INTERNET_NODE_ID) return;
          loadResource(node.id);
        }}
        onEdgeClick={(_, edge) => {
          const hops =
            (edge.data as GraphEdgeData | undefined)?.model.relationshipIds ??
            [];
          if (hops.length) loadConnection(hops, hops[hops.length - 1]);
        }}
        onPaneClick={closeInspector}
        className="infrastructure-graph"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.2}
          color="var(--grid-dot)"
        />
        <MiniMap
          pannable
          zoomable
          position="top-right"
          className="!border-border-soft !bg-dashboard-panel-strong/90 !m-3 !rounded-xl !border"
          maskColor="color-mix(in oklab, var(--background) 72%, transparent)"
          nodeBorderRadius={6}
          nodeColor={(node) => {
            const data = node.data as GraphNodeData | undefined;
            const resource = data?.model.resource;
            if (
              !resource ||
              (data?.model.kind === "group" && !data.model.collapsed)
            )
              return "transparent";
            return resourceVisual(resource.resource_type, resource.category)
              .color;
          }}
          nodeStrokeColor={(node) =>
            (node.data as GraphNodeData | undefined)?.model.kind === "group"
              ? "#22d3ee"
              : "transparent"
          }
        />
      </ReactFlow>

      {/* Toolbar */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-start gap-2">
        <div className="pointer-events-auto relative w-full max-w-xs">
          <Search
            size={14}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resources, types, regions…"
            aria-label="Search resources"
            className="border-border-soft bg-dashboard-panel-strong/90 focus:border-accent/60 h-9 w-full rounded-xl border pr-8 pl-8 text-sm shadow-[0_10px_28px_var(--shadow-card)] backdrop-blur outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <X size={14} />
            </button>
          ) : null}
          {suggestions.length ? (
            <ul className="border-border-soft bg-dashboard-panel-strong absolute inset-x-0 top-10 z-30 overflow-hidden rounded-xl border shadow-[0_18px_48px_var(--shadow-card)]">
              {suggestions.map((node) => {
                const visual = resourceVisual(
                  node.resource_type,
                  node.category,
                );
                const Icon = visual.icon;
                return (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => focusResource(node.id)}
                      className="hover:bg-foreground/5 flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
                    >
                      <Icon size={14} style={{ color: visual.color }} />
                      <span className="truncate font-medium">
                        {node.name ?? node.external_id}
                      </span>
                      <span className="text-muted-foreground ml-auto shrink-0">
                        {visual.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div
          className="border-border-soft bg-dashboard-panel-strong/90 pointer-events-auto flex rounded-xl border p-1 shadow-[0_10px_28px_var(--shadow-card)] backdrop-blur"
          role="tablist"
          aria-label="Graph view"
        >
          {GRAPH_VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === item.id
                  ? "bg-accent/15 text-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <ToolbarButton
            label="Fit to screen"
            onClick={() => void flow.fitView({ padding: 0.15, duration: 400 })}
          >
            <Maximize size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Zoom out"
            onClick={() => void flow.zoomOut({ duration: 200 })}
          >
            <Minus size={14} />
          </ToolbarButton>
          <ZoomReadout />
          <ToolbarButton
            label="Zoom in"
            onClick={() => void flow.zoomIn({ duration: 200 })}
          >
            <Plus size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Expand all"
            onClick={() => {
              setCollapsedGroups(new Set());
              setExpanded(
                new Set(
                  model.nodes
                    .filter((node) => node.kind === "resource")
                    .map((node) => node.id),
                ),
              );
            }}
          >
            <ChevronsUpDown size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Collapse all"
            onClick={() => {
              setExpanded(new Set());
              setCollapsedGroups(
                new Set(
                  model.nodes
                    .filter((node) => node.kind === "group" && !node.parentId)
                    .map((node) => node.id),
                ),
              );
            }}
          >
            <ChevronsDownUp size={14} />
          </ToolbarButton>
          <div className="relative">
            <ToolbarButton
              label="Filter resource categories"
              onClick={() => setFiltersOpen((open) => !open)}
              active={filtersOpen || hiddenCategories.size > 0}
            >
              <Filter size={14} />
            </ToolbarButton>
            {filtersOpen ? (
              <div className="border-border-soft bg-dashboard-panel-strong absolute top-10 left-0 z-30 w-52 rounded-xl border p-2 shadow-[0_18px_48px_var(--shadow-card)]">
                <p className="text-muted-foreground px-2 pb-1 text-[10px] font-semibold tracking-wide uppercase">
                  Categories
                </p>
                {categories.map((category) => (
                  <label
                    key={category}
                    className="hover:bg-foreground/5 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenCategories.has(category)}
                      onChange={() =>
                        setHiddenCategories((current) =>
                          toggle(current, category),
                        )
                      }
                      className="accent-[var(--accent)]"
                    />
                    {CATEGORY_LABELS[category] ?? category}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          {laying ? (
            <Loader2
              size={14}
              className="text-muted-foreground ml-1 animate-spin"
            />
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col gap-2">
        <Legend />
        {query.trim() ? (
          <span className="border-border-soft bg-dashboard-panel-strong/90 pointer-events-auto rounded-lg border px-2.5 py-1 text-[11px]">
            {model.matchCount} match{model.matchCount === 1 ? "" : "es"} in this
            view
          </span>
        ) : null}
      </div>

      {selection?.type === "resource" ? (
        resourceState?.status === "ready" ? (
          <ResourceInspector
            key={selection.id}
            detail={resourceState.data.detail}
            neighborhood={resourceState.data.neighborhood}
            onClose={closeInspector}
            onSelectResource={focusResource}
            onSelectRelationship={(id) => loadConnection([id], id)}
          />
        ) : resourceState?.status === "error" ? (
          <InspectorError
            message={resourceState.message}
            onClose={closeInspector}
          />
        ) : (
          <InspectorLoading onClose={closeInspector} />
        )
      ) : null}
      {selection?.type === "connection" ? (
        connectionState?.status === "ready" ? (
          <ConnectionInspector
            key={selection.active}
            detail={connectionState.data}
            hops={selection.hops}
            activeHop={selection.active}
            onSelectHop={(hop) => loadConnection(selection.hops, hop)}
            onClose={closeInspector}
            onSelectResource={focusResource}
          />
        ) : connectionState?.status === "error" ? (
          <InspectorError
            message={connectionState.message}
            onClose={closeInspector}
          />
        ) : (
          <InspectorLoading onClose={closeInspector} />
        )
      ) : null}
    </div>
  );
}

export function GraphExplorer({ graph }: { graph: CoreScopeGraph }) {
  return (
    <ReactFlowProvider>
      <GraphCanvas graph={graph} />
    </ReactFlowProvider>
  );
}
