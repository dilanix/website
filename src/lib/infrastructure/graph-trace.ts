/**
 * Upstream/downstream tracing over the drawn graph, for hover/selection
 * highlighting. Pure and independent of the renderer.
 */

export interface TraceEdge {
  id: string;
  source: string;
  target: string;
}

export interface TraceIndex {
  outgoing: Map<string, TraceEdge[]>;
  incoming: Map<string, TraceEdge[]>;
}

export interface Trace {
  nodes: Set<string>;
  edges: Set<string>;
}

export function buildTraceIndex(edges: readonly TraceEdge[]): TraceIndex {
  const outgoing = new Map<string, TraceEdge[]>();
  const incoming = new Map<string, TraceEdge[]>();
  for (const edge of edges) {
    const out = outgoing.get(edge.source);
    if (out) out.push(edge);
    else outgoing.set(edge.source, [edge]);
    const inc = incoming.get(edge.target);
    if (inc) inc.push(edge);
    else incoming.set(edge.target, [edge]);
  }
  return { outgoing, incoming };
}

/**
 * Everything `focus` reaches (downstream) and everything that reaches it
 * (upstream), following edge direction — the paths traffic can take through
 * the focused resource, not every resource that merely touches a neighbor.
 */
export function traceFrom(index: TraceIndex, focus: string): Trace {
  const nodes = new Set<string>([focus]);
  const edges = new Set<string>();
  const walk = (
    lookup: Map<string, TraceEdge[]>,
    next: (edge: TraceEdge) => string,
  ) => {
    const seen = new Set<string>([focus]);
    const queue = [focus];
    while (queue.length) {
      const current = queue.shift()!;
      for (const edge of lookup.get(current) ?? []) {
        edges.add(edge.id);
        const peer = next(edge);
        nodes.add(peer);
        if (!seen.has(peer)) {
          seen.add(peer);
          queue.push(peer);
        }
      }
    }
  };
  walk(index.outgoing, (edge) => edge.target);
  walk(index.incoming, (edge) => edge.source);
  return { nodes, edges };
}
