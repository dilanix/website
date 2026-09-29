"use client";

import "@xyflow/react/dist/style.css";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  type NodeChange,
} from "@xyflow/react";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Filter,
  Loader2,
  Maximize,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CoreConnectionDetail,
  CoreEvidenceKind,
  CoreGraphNodeDetail,
  CoreResourceNeighborhood,
  CoreScopeGraph,
} from "@/lib/core/api";
import {
  GRAPH_MODES,
  GRAPH_VIEWS,
  INTERNET_NODE_ID,
  buildGraphModel,
  formatPorts,
  nodeMatches,
  searchResources,
  type GraphMode,
  type GraphModel,
  type GraphView,
} from "@/lib/infrastructure/graph-model";
import {
  layoutGraph,
  type GraphLayout,
  type Point,
} from "@/lib/infrastructure/graph-layout";
import { buildTraceIndex, traceFrom } from "@/lib/infrastructure/graph-trace";
import {
  getGraphConnectionAction,
  getGraphResourceAction,
} from "@/app/dashboard/products/infrastructure-actions";
import { InteractionSources } from "./interaction-sources";
import { graphNodeTypes, type GraphNodeData } from "./graph-nodes";
import {
  TRAFFIC_TYPES,
  VERBS,
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

type FullscreenMode = "off" | "native" | "fallback";

/** What the canvas shows: a model together with the layout computed for it. */
interface Rendered {
  model: GraphModel;
  layout: GraphLayout;
}

type FitRequest = { type: "all" } | { type: "node"; id: string } | null;

type Lod = "far" | "mid" | "near";

/** Semantic zoom thresholds (see globals.css `data-lod`). */
function lodFor(zoom: number): Lod {
  if (zoom < 0.35) return "far";
  if (zoom < 0.6) return "mid";
  return "near";
}

const FIT_OPTIONS = { padding: 0.12, maxZoom: 1 } as const;
const NEUTRAL_EDGE = "#94a3b8";
// z-order: containers < edges < resources.
const Z_EDGE = 2;
const Z_EDGE_HIGHLIGHT = 3;
const Z_RESOURCE = 4;

const toggled = <T,>(set: ReadonlySet<T>, value: T) => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

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
        "flex size-8 items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-accent/12 text-accent"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

const panel =
  "border-border-soft bg-card-strong pointer-events-auto rounded-xl border shadow-[0_6px_20px_var(--shadow-card)]";

function ZoomReadout() {
  const zoom = useStore((state) => state.transform[2]);
  return (
    <span className="text-muted-foreground w-10 text-center font-mono text-[11px] tabular-nums">
      {Math.round(zoom * 100)}%
    </span>
  );
}

/** Mirrors the zoom level onto the workspace; re-renders only on a threshold. */
function LevelOfDetail({
  target,
}: {
  target: React.RefObject<HTMLDivElement | null>;
}) {
  const lod = useStore((state) => lodFor(state.transform[2]));
  useEffect(() => {
    target.current?.setAttribute("data-lod", lod);
  }, [lod, target]);
  return null;
}

function Legend() {
  return (
    <div className={cn(panel, "px-3 py-2")}>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {(Object.keys(EVIDENCE_STYLES) as (keyof typeof EVIDENCE_STYLES)[]).map(
          (kind) => (
            <li key={kind} className="flex items-center gap-1.5 text-[11px]">
              <svg width="20" height="6" aria-hidden="true">
                <line
                  x1="0"
                  y1="3"
                  x2="20"
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
      <p className="text-muted-foreground mt-1 text-[10px]">
        Hover to trace · double-click to expand · Esc to clear
      </p>
    </div>
  );
}

function GraphCanvas({ graph }: { graph: CoreScopeGraph }) {
  const flow = useReactFlow();
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<GraphMode>("provisioned");
  const [view, setView] = useState<GraphView>("architecture");
  const [evidenceKinds, setEvidenceKinds] = useState<
    ReadonlySet<CoreEvidenceKind>
  >(new Set(Object.keys(EVIDENCE_STYLES) as CoreEvidenceKind[]));
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [hiddenCategories, setHiddenCategories] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [rendered, setRendered] = useState<Rendered | null>(null);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  /** Positions of nodes the user dragged, until the next layout. */
  const [dragged, setDragged] = useState<ReadonlyMap<string, Point>>(new Map());
  const [fullscreen, setFullscreen] = useState<FullscreenMode>("off");
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
  const fitRequest = useRef<FitRequest>(null);
  const refitOnResize = useRef(false);
  const moving = useRef(false);
  const hoverTimer = useRef<number | undefined>(undefined);

  // Structure only — search never re-runs the model or the layout.
  const model = useMemo(
    () =>
      buildGraphModel(graph, {
        mode,
        evidenceKinds,
        view,
        expanded,
        collapsedGroups,
        hiddenCategories,
        revealed,
        query: "",
      }),
    [
      graph,
      mode,
      evidenceKinds,
      view,
      expanded,
      collapsedGroups,
      hiddenCategories,
      revealed,
    ],
  );

  // Layout runs off the render path (in a worker when available) and is
  // cached by structure; the canvas keeps showing the previous layout until
  // the new one is ready, so nothing jumps to the origin meanwhile.
  useEffect(() => {
    let cancelled = false;
    layoutGraph(model).then(
      (layout) => {
        if (cancelled) return;
        setRendered({ model, layout });
        setDragged(new Map());
        setLayoutError(null);
      },
      (error: unknown) => {
        if (!cancelled)
          setLayoutError(
            error instanceof Error ? error.message : "Layout failed.",
          );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [model]);
  const laying = rendered?.model !== model && !layoutError;

  // Fit requests are fulfilled once the layout they wait for is on screen.
  useEffect(() => {
    if (!rendered || !fitRequest.current) return;
    const request = fitRequest.current;
    const handle = window.requestAnimationFrame(() => {
      if (request.type === "all") {
        void flow.fitView({ ...FIT_OPTIONS, duration: 300 });
      } else if (flow.getNode(request.id)) {
        void flow.fitView({
          nodes: [{ id: request.id }],
          duration: 450,
          maxZoom: 1.2,
          padding: 0.9,
        });
      }
      fitRequest.current = null;
    });
    return () => window.cancelAnimationFrame(handle);
  }, [rendered, flow]);

  const onToggleExpand = useCallback(
    (id: string) => setExpanded((current) => toggled(current, id)),
    [],
  );
  const onToggleGroup = useCallback(
    (id: string) => setCollapsedGroups((current) => toggled(current, id)),
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

  /** Select a resource and bring it into view — revealing it in this view
   *  first when it is not drawn (e.g. a security group in Architecture). */
  const focusResource = useCallback(
    (id: string) => {
      if (flow.getNode(id)) {
        void flow.fitView({
          nodes: [{ id }],
          duration: 450,
          maxZoom: 1.2,
          padding: 0.9,
        });
      } else {
        fitRequest.current = { type: "node", id };
        setRevealed((current) =>
          current.has(id) ? current : new Set([...current, id]),
        );
      }
      setSuggestionsOpen(false);
      loadResource(id);
    },
    [flow, loadResource],
  );

  const clearSelection = useCallback(() => {
    setSelection(null);
    setHovered(null);
  }, []);

  const changeStructure = (apply: () => void) => {
    fitRequest.current = { type: "all" };
    apply();
  };

  const resetView = () => {
    changeStructure(() => {
      setExpanded(new Set());
      setCollapsedGroups(new Set());
      setRevealed(new Set());
      setHiddenCategories(new Set());
      setQuery("");
      clearSelection();
    });
    // Same structure as now: no new layout will arrive, fit directly.
    if (
      !expanded.size &&
      !collapsedGroups.size &&
      !revealed.size &&
      !hiddenCategories.size
    ) {
      fitRequest.current = null;
      void flow.fitView({ ...FIT_OPTIONS, duration: 300 });
    }
  };

  // ---- Fullscreen: the whole workspace (canvas, toolbar, inspector). ----
  useEffect(() => {
    const onChange = () => {
      const active = document.fullscreenElement === rootRef.current;
      refitOnResize.current = true;
      setFullscreen((current) =>
        active ? "native" : current === "native" ? "off" : current,
      );
    };
    document.addEventListener("fullscreenchange", onChange);
    const root = rootRef.current;
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      if (root && document.fullscreenElement === root)
        void document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (fullscreen !== "fallback") return;
    const html = document.documentElement;
    html.setAttribute("data-graph-fullscreen", "");
    return () => html.removeAttribute("data-graph-fullscreen");
  }, [fullscreen]);

  const toggleFullscreen = async () => {
    refitOnResize.current = true;
    if (fullscreen === "native") {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    if (fullscreen === "fallback") {
      setFullscreen("off");
      return;
    }
    const root = rootRef.current;
    if (root && document.fullscreenEnabled && root.requestFullscreen) {
      try {
        await root.requestFullscreen({ navigationUI: "hide" });
        return;
      } catch {
        // Denied (iframe policy, etc.): fall back to a viewport overlay.
      }
    }
    setFullscreen("fallback");
  };

  // Re-fit once the workspace has actually resized after entering/leaving
  // fullscreen (React Flow picks up its new size from the same resize).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (!refitOnResize.current) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        refitOnResize.current = false;
        void flow.fitView({ ...FIT_OPTIONS, duration: 250 });
      });
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [flow]);

  // Escape: close popovers, then clear selection, then leave the fallback
  // fullscreen (native fullscreen is exited by the browser itself).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (suggestionsOpen || filtersOpen) {
        setSuggestionsOpen(false);
        setFiltersOpen(false);
      } else if (selection) {
        clearSelection();
      } else if (fullscreen === "fallback") {
        refitOnResize.current = true;
        setFullscreen("off");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [suggestionsOpen, filtersOpen, selection, fullscreen, clearSelection]);

  // ---- Derived render state ----
  const drawnModel = rendered?.model;
  const traceIndex = useMemo(
    () => buildTraceIndex(drawnModel?.edges ?? []),
    [drawnModel],
  );
  const parentOf = useMemo(
    () =>
      new Map(
        (drawnModel?.nodes ?? []).map((node) => [node.id, node.parentId]),
      ),
    [drawnModel],
  );
  /** Open containers: the backdrop of their members, never a trace focus. */
  const openGroups = useMemo(
    () =>
      new Set(
        (drawnModel?.nodes ?? [])
          .filter((node) => node.kind === "group" && !node.collapsed)
          .map((node) => node.id),
      ),
    [drawnModel],
  );
  const selectedId = selection?.type === "resource" ? selection.id : null;
  const focusId = hovered ?? selectedId;

  /** Nodes/edges to emphasize; everything else is dimmed. */
  const highlight = useMemo(() => {
    if (!drawnModel) return null;
    let trace: { nodes: Set<string>; edges: Set<string> } | null = null;
    if (focusId && parentOf.has(focusId) && !openGroups.has(focusId)) {
      trace = traceFrom(traceIndex, focusId);
    } else if (selection?.type === "connection") {
      const hops = new Set(selection.hops);
      const edges = drawnModel.edges.filter((edge) =>
        edge.relationshipIds.some((id) => hops.has(id)),
      );
      if (edges.length)
        trace = {
          edges: new Set(edges.map((edge) => edge.id)),
          nodes: new Set(edges.flatMap((edge) => [edge.source, edge.target])),
        };
    }
    if (!trace) return null;
    // Containers of anything highlighted stay legible.
    for (const id of [...trace.nodes]) {
      for (let parent = parentOf.get(id); parent; parent = parentOf.get(parent))
        trace.nodes.add(parent);
    }
    return trace;
  }, [drawnModel, focusId, openGroups, parentOf, selection, traceIndex]);

  const matching = useMemo(() => {
    if (!drawnModel || !deferredQuery.trim()) return null;
    return new Set(
      drawnModel.nodes
        .filter(
          (node) => node.resource && nodeMatches(node.resource, deferredQuery),
        )
        .map((node) => node.id),
    );
  }, [drawnModel, deferredQuery]);

  const detailIds = useMemo(
    () =>
      new Set(
        (drawnModel?.nodes ?? [])
          .filter(
            (node) => node.kind === "resource" && node.layer !== "service",
          )
          .map((node) => node.id),
      ),
    [drawnModel],
  );

  // Base nodes/edges: rebuilt only when a new layout arrives.
  const baseNodes = useMemo<Node[]>(() => {
    if (!rendered) return [];
    const { model: drawn, layout } = rendered;
    return drawn.nodes.map((node) => {
      const size = layout.sizes.get(node.id);
      const data: GraphNodeData = {
        model: node,
        onToggleExpand,
        onToggleGroup,
      };
      const expandedGroup = node.kind === "group" && !node.collapsed;
      return {
        id: node.id,
        type: node.kind,
        position: layout.positions.get(node.id) ?? { x: 0, y: 0 },
        data,
        parentId: node.parentId ?? undefined,
        width: size?.width,
        height: size?.height,
        draggable: !expandedGroup,
        selectable: node.kind !== "internet",
        zIndex: expandedGroup ? 0 : Z_RESOURCE,
      } satisfies Node;
    });
  }, [rendered, onToggleExpand, onToggleGroup]);

  const baseEdges = useMemo<Edge[]>(() => {
    if (!rendered) return [];
    const { model: drawn, layout } = rendered;
    const runtime = mode === "runtime";
    return drawn.edges.map((edge) => {
      const kind = dominantEvidence(edge.kinds);
      const style = kind ? EVIDENCE_STYLES[kind] : null;
      const color = style?.color ?? NEUTRAL_EDGE;
      const verb = runtime ? VERBS[edge.relationshipType] : undefined;
      const data: GraphEdgeData = {
        model: edge,
        route: layout.routes.get(edge.id) ?? null,
        color,
        dash: style?.dash,
        label: [verb, formatPorts(edge.ports)].filter(Boolean).join(" · "),
        flow:
          TRAFFIC_TYPES.has(edge.relationshipType) &&
          kind !== "permitted" &&
          kind !== "inferred",
      };
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "relationship",
        data,
        zIndex: Z_EDGE,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
          width: 14,
          height: 14,
        },
      } satisfies Edge;
    });
  }, [rendered, mode]);

  // Final nodes/edges: emphasis applied per element, reusing the previous
  // object when nothing about it changed, so React Flow re-renders only the
  // elements whose state actually changed (not the whole graph on hover).
  // The caches are pure memoization — the output is fully determined by the
  // memo's inputs — hence the targeted `react-hooks/refs` suppressions.
  const nodeCache = useRef(
    new WeakMap<Node, { signature: string; node: Node }>(),
  );
  const nodes = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      baseNodes.map((base) => {
        const className = cn(
          detailIds.has(base.id) && "graph-lod-detail",
          highlight &&
            (highlight.nodes.has(base.id) ? "graph-hl" : "graph-dim"),
          matching && base.id !== INTERNET_NODE_ID && !matching.has(base.id)
            ? "graph-miss"
            : null,
        );
        const selected = base.id === selectedId;
        const position = dragged.get(base.id);
        const signature = `${className}|${selected}|${position?.x},${position?.y}`;
        const hit = nodeCache.current.get(base);
        if (hit?.signature === signature) return hit.node;
        const node: Node = {
          ...base,
          className,
          selected,
          position: position ?? base.position,
        };
        nodeCache.current.set(base, { signature, node });
        return node;
      }),
    [baseNodes, detailIds, highlight, matching, selectedId, dragged],
  );

  const edgeCache = useRef(
    new WeakMap<Edge, { signature: string; edge: Edge }>(),
  );
  const edges = useMemo(() => {
    const moved = (id: string) => {
      for (
        let current: string | null | undefined = id;
        current;
        current = parentOf.get(current)
      )
        if (dragged.has(current)) return true;
      return false;
    };
    const selectedHops =
      selection?.type === "connection" ? new Set(selection.hops) : null;
    // eslint-disable-next-line react-hooks/refs
    return baseEdges.map((base) => {
      const data = base.data as GraphEdgeData;
      const lit = highlight?.edges.has(base.id) ?? false;
      const className = cn(
        (detailIds.has(base.source) || detailIds.has(base.target)) &&
          "graph-lod-detail",
        highlight && (lit ? "graph-hl" : "graph-dim"),
      );
      const selected = Boolean(
        selectedHops &&
        data.model.relationshipIds.some((id) => selectedHops.has(id)),
      );
      const stale = moved(base.source) || moved(base.target);
      const signature = `${className}|${selected}|${stale}`;
      const hit = edgeCache.current.get(base);
      if (hit?.signature === signature) return hit.edge;
      const edge: Edge = {
        ...base,
        className,
        selected,
        zIndex: lit || selected ? Z_EDGE_HIGHLIGHT : Z_EDGE,
        data: stale ? { ...data, route: null } : data,
      };
      edgeCache.current.set(base, { signature, edge });
      return edge;
    });
  }, [baseEdges, detailIds, highlight, selection, dragged, parentOf]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const moves = changes.filter(
      (change) => change.type === "position" && change.position,
    );
    if (!moves.length) return;
    setDragged((current) => {
      const next = new Map(current);
      for (const change of moves)
        if (change.type === "position" && change.position)
          next.set(change.id, change.position);
      return next;
    });
  }, []);

  const hoverNode = useCallback((id: string | null) => {
    window.clearTimeout(hoverTimer.current);
    if (moving.current) return;
    hoverTimer.current = window.setTimeout(() => setHovered(id), id ? 60 : 0);
  }, []);
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  /** While the canvas moves, ambient animations pause (see globals.css). */
  const setMoving = useCallback((value: boolean) => {
    moving.current = value;
    if (value) rootRef.current?.setAttribute("data-moving", "");
    else rootRef.current?.removeAttribute("data-moving");
  }, []);

  const categories = useMemo(
    () => [...new Set(graph.nodes.map((item) => item.node.category))].sort(),
    [graph],
  );
  const suggestions = useMemo(
    () => searchResources(graph, deferredQuery),
    [graph, deferredQuery],
  );

  const resourceState =
    selection?.type === "resource" ? resourceDetails[selection.id] : undefined;
  const connectionState =
    selection?.type === "connection"
      ? connectionDetails[selection.active]
      : undefined;
  const inspectorOpen = selection !== null;

  return (
    <div
      ref={rootRef}
      data-lod="mid"
      className={cn(
        "graph-workspace relative h-full w-full overflow-hidden",
        fullscreen !== "off" && "bg-background",
        fullscreen === "fallback" && "fixed inset-0 z-[100]",
      )}
    >
      {rendered ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={graphNodeTypes}
          edgeTypes={graphEdgeTypes}
          onNodesChange={onNodesChange}
          fitView
          fitViewOptions={FIT_OPTIONS}
          minZoom={0.04}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          onlyRenderVisibleElements
          nodesConnectable={false}
          nodeDragThreshold={4}
          selectNodesOnDrag={false}
          elevateNodesOnSelect={false}
          elevateEdgesOnSelect={false}
          zoomOnDoubleClick={false}
          onNodeClick={(_, node) => {
            if (node.id === INTERNET_NODE_ID) return;
            loadResource(node.id);
          }}
          onNodeDoubleClick={(_, node) => {
            const data = node.data as GraphNodeData;
            if (data.model.kind === "group") onToggleGroup(node.id);
            else if (data.model.hiddenNeighbors > 0 || data.model.expanded)
              onToggleExpand(node.id);
            void flow.fitView({
              nodes: [{ id: node.id }],
              duration: 400,
              maxZoom: 1.2,
              padding: 0.9,
            });
          }}
          onNodeMouseEnter={(_, node) =>
            hoverNode(openGroups.has(node.id) ? null : node.id)
          }
          onNodeMouseLeave={() => hoverNode(null)}
          onNodeDragStart={() => setMoving(true)}
          onNodeDragStop={() => setMoving(false)}
          onMoveStart={() => {
            setMoving(true);
            window.clearTimeout(hoverTimer.current);
          }}
          onMoveEnd={() => setMoving(false)}
          onEdgeClick={(_, edge) => {
            const hops =
              (edge.data as GraphEdgeData | undefined)?.model.relationshipIds ??
              [];
            if (hops.length) loadConnection(hops, hops[hops.length - 1]);
          }}
          onPaneClick={() => {
            clearSelection();
            setSuggestionsOpen(false);
            setFiltersOpen(false);
          }}
          className="infrastructure-graph"
        >
          <LevelOfDetail target={rootRef} />
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="var(--grid-dot)"
          />
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            className="!border-border-soft !bg-card-strong !m-3 !rounded-xl !border"
            style={{
              width: 180,
              height: 120,
              right: inspectorOpen ? "min(26rem, calc(100% - 1.5rem))" : 0,
            }}
            maskColor="color-mix(in oklab, var(--background) 70%, transparent)"
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
                ? "#06b6d4"
                : "transparent"
            }
          />
        </ReactFlow>
      ) : (
        <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
          {layoutError ? (
            <span>Unable to lay out this graph: {layoutError}</span>
          ) : (
            <>
              <Loader2 size={16} className="animate-spin" />
              Laying out {graph.nodes.length.toLocaleString("en-US")} resources…
            </>
          )}
        </div>
      )}

      {/* Toolbar — clear of the inspector while it is open. */}
      <div
        className="pointer-events-none absolute top-3 left-3 z-10 flex flex-wrap items-start gap-2"
        style={{
          right: inspectorOpen
            ? "calc(min(26rem, calc(100% - 1.5rem)) + 1.5rem)"
            : "0.75rem",
        }}
      >
        <div className="pointer-events-auto relative w-full max-w-xs">
          <Search
            size={14}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && suggestions[0])
                focusResource(suggestions[0].id);
            }}
            placeholder="Search resources, types, regions…"
            aria-label="Search resources"
            className="border-border-soft bg-card-strong focus:border-accent/60 h-9 w-full rounded-xl border pr-8 pl-8 text-sm shadow-[0_6px_20px_var(--shadow-card)] outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestionsOpen(false);
              }}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <X size={14} />
            </button>
          ) : null}
          {suggestionsOpen && suggestions.length ? (
            <ul className="border-border-soft bg-card-strong absolute inset-x-0 top-10 z-30 overflow-hidden rounded-xl border shadow-[0_18px_48px_var(--shadow-card)]">
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
          className={cn(panel, "flex p-1")}
          role="tablist"
          aria-label="Graph mode"
        >
          {GRAPH_MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              title={item.hint}
              onClick={() => {
                if (item.id === mode) return;
                changeStructure(() => {
                  setMode(item.id);
                  setExpanded(new Set());
                  setCollapsedGroups(new Set());
                });
              }}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
                mode === item.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === "runtime" ? (
          <div
            className={cn(panel, "flex flex-wrap items-center gap-1 p-1")}
            aria-label="Evidence shown"
          >
            {(Object.keys(EVIDENCE_STYLES) as CoreEvidenceKind[]).map(
              (kind) => {
                const active = evidenceKinds.has(kind);
                const style = EVIDENCE_STYLES[kind];
                return (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setEvidenceKinds((current) => toggled(current, kind))
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-opacity",
                      active ? "opacity-100" : "opacity-40",
                    )}
                    style={
                      active
                        ? { color: style.color, background: `${style.color}1a` }
                        : undefined
                    }
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: style.color }}
                    />
                    {style.label}
                  </button>
                );
              },
            )}
            <InteractionSources sources={graph.sources} />
          </div>
        ) : (
          <div
            className={cn(panel, "flex p-1")}
            role="tablist"
            aria-label="Graph view"
          >
            {GRAPH_VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={view === item.id}
                onClick={() => {
                  if (item.id !== view) changeStructure(() => setView(item.id));
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  view === item.id
                    ? "bg-accent/12 text-accent"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div className={cn(panel, "ml-auto flex items-center gap-0.5 p-0.5")}>
          {laying ? (
            <Loader2
              size={14}
              className="text-muted-foreground mx-1.5 animate-spin"
              aria-label="Laying out"
            />
          ) : null}
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
            label="Fit to view"
            onClick={() => void flow.fitView({ ...FIT_OPTIONS, duration: 300 })}
          >
            <Maximize size={14} />
          </ToolbarButton>
          <ToolbarButton label="Reset view" onClick={resetView}>
            <RotateCcw size={14} />
          </ToolbarButton>
          <span className="bg-border-soft mx-0.5 h-5 w-px" aria-hidden="true" />
          <ToolbarButton
            label="Expand all"
            onClick={() =>
              changeStructure(() => {
                setCollapsedGroups(new Set());
                setExpanded(
                  new Set(
                    model.nodes
                      .filter((node) => node.kind === "resource")
                      .map((node) => node.id),
                  ),
                );
              })
            }
          >
            <ChevronsUpDown size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Collapse all"
            onClick={() =>
              changeStructure(() => {
                setExpanded(new Set());
                setCollapsedGroups(
                  new Set(
                    model.nodes
                      .filter((node) => node.kind === "group" && !node.parentId)
                      .map((node) => node.id),
                  ),
                );
              })
            }
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
              <div className="border-border-soft bg-card-strong absolute top-10 right-0 z-30 w-52 rounded-xl border p-2 shadow-[0_18px_48px_var(--shadow-card)]">
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
                          toggled(current, category),
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
          <ToolbarButton
            label={
              fullscreen === "off" ? "Enter fullscreen" : "Exit fullscreen"
            }
            onClick={() => void toggleFullscreen()}
            active={fullscreen !== "off"}
          >
            {fullscreen === "off" ? (
              <Maximize2 size={14} />
            ) : (
              <Minimize2 size={14} />
            )}
          </ToolbarButton>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex max-w-[calc(100%-14rem)] flex-col items-start gap-2">
        {matching ? (
          <span className={cn(panel, "px-2.5 py-1 text-[11px]")}>
            {matching.size} match{matching.size === 1 ? "" : "es"} in this view
          </span>
        ) : null}
        <Legend />
      </div>

      {selection?.type === "resource" ? (
        resourceState?.status === "ready" ? (
          <ResourceInspector
            key={selection.id}
            detail={resourceState.data.detail}
            neighborhood={resourceState.data.neighborhood}
            onClose={clearSelection}
            onSelectResource={focusResource}
            onSelectRelationship={(id) => loadConnection([id], id)}
          />
        ) : resourceState?.status === "error" ? (
          <InspectorError
            message={resourceState.message}
            onClose={clearSelection}
          />
        ) : (
          <InspectorLoading onClose={clearSelection} />
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
            onClose={clearSelection}
            onSelectResource={focusResource}
          />
        ) : connectionState?.status === "error" ? (
          <InspectorError
            message={connectionState.message}
            onClose={clearSelection}
          />
        ) : (
          <InspectorLoading onClose={clearSelection} />
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
