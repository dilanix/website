import Link from "next/link";
import { EmptyState } from "@/components/dashboard/primitives";

/**
 * Infrastructure -> Graph: the product's default section. Core stores
 * resource relationships and their evidence (the shared Resource Graph) but
 * no provider relationship discovery writes them yet, so this states that
 * honestly instead of drawing anything. The interactive renderer (canvas,
 * semantic zoom, expand/collapse, inspectors, Architecture/Network/Security
 * projections) belongs under `components/dashboard/infrastructure/` and will
 * load the graph progressively — one resource's neighborhood at a time via
 * Core's `/infrastructure/graph/resources/{id}/relationships`, never the
 * whole organization's graph at once.
 */
export function InfrastructureGraph() {
  return (
    <EmptyState
      title="No relationships discovered yet"
      description="Relationship discovery between your resources is not enabled yet, so there is no graph to show. Your collected inventory is available under Resources."
      actions={
        <Link
          href="/dashboard/products/infrastructure/resources"
          className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
        >
          Browse resources
        </Link>
      }
    />
  );
}
