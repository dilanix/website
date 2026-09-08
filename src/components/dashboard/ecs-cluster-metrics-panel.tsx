import type {
  CoreMetricDatapointListResponse,
  CoreMetricUtilizationSummaryListResponse,
  CoreResource,
} from "@/lib/core/api";
import { EmptyState } from "./primitives";
import { ResourceMetricsPanel } from "./resource-metrics-panel";

export function EcsClusterMetricsPanel({
  connectionId,
  services,
  metricSummary,
  initialMetrics,
}: {
  connectionId: string;
  services: CoreResource[];
  metricSummary: CoreMetricUtilizationSummaryListResponse;
  initialMetrics: CoreMetricDatapointListResponse;
}) {
  if (services.length === 0) {
    return (
      <EmptyState
        title="No ECS services in this cluster"
        description="Run an inventory.resources sync to discover this cluster's ECS services."
      />
    );
  }

  const initialService =
    services.find((service) =>
      metricSummary.items.some((summary) => summary.resource_id === service.id),
    ) ?? services[0];

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs leading-5">
        Standard AWS/ECS utilization is reported per service. Select a service
        and metric to inspect its complete chart.
      </p>
      <ResourceMetricsPanel
        connectionId={connectionId}
        resourceId={initialService.id}
        resourceOptions={services.map((service) => ({
          id: service.id,
          label:
            service.name ??
            service.external_id.split("/").at(-1) ??
            service.external_id,
          detail: service.external_id,
        }))}
        resourceSelectorLabel="ECS service"
        initialMetricSummary={metricSummary}
        initialMetrics={initialMetrics}
      />
    </div>
  );
}
