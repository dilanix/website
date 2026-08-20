import { Section, StatusBadge } from "@/components/dashboard/primitives";
import { formatDateTime } from "../../utils";
import { formatMetricValue } from "../analytics/formatters";
import type { ResourceEvidence } from "../analytics/evidence-types";
import { humanize } from "../presentation";

export function ResourceEvidencePanel({
  evidence,
}: {
  evidence: ResourceEvidence | null;
}) {
  if (!evidence)
    return (
      <Section title="Analysis Evidence">
        <p className="text-muted-foreground text-sm">
          No evidence snapshot is available yet. Run sync to build one from
          stored metric rollups.
        </p>
      </Section>
    );

  const tone =
    evidence.quality.status === "good"
      ? "success"
      : evidence.quality.status === "partial"
        ? "warning"
        : "neutral";
  return (
    <Section
      title="Analysis Evidence"
      action={
        <StatusBadge status={tone}>
          {humanize(evidence.quality.status)}
        </StatusBadge>
      }
    >
      <p className="text-muted-foreground -mt-2 mb-4 text-xs leading-5">
        Provider-neutral facts derived from stored daily rollups. These are
        inputs for future validation and recommendations, not recommendations
        themselves.
      </p>
      <dl className="border-foreground/10 grid overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-4">
        <EvidenceStat
          label="Quality score"
          value={`${evidence.quality.score}%`}
        />
        <EvidenceStat
          label="Metric coverage"
          value={`${evidence.quality.metric_coverage_percent}%`}
        />
        <EvidenceStat
          label="Temporal coverage"
          value={`${evidence.quality.temporal_coverage_percent}%`}
        />
        <EvidenceStat
          label="Analysis window"
          value={`${formatDateTime(evidence.windowStart)} – ${formatDateTime(evidence.windowEnd)}`}
        />
      </dl>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="border-foreground/10 rounded-xl border p-4">
          <h3 className="text-sm font-medium">Metric facts</h3>
          <div className="mt-3 space-y-3">
            {Object.entries(evidence.metrics).map(([key, metric]) => (
              <div
                key={key}
                className="border-foreground/7 border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium">
                    {humanize(key.replaceAll(".", " "))}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {metric.bucket_count} buckets
                  </span>
                </div>
                <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 text-[11px]">
                  <span>
                    Avg {formatMetricValue(metric.average, metric.unit)}
                  </span>
                  <span>P95 {formatMetricValue(metric.p95, metric.unit)}</span>
                  <span>
                    Max {formatMetricValue(metric.maximum, metric.unit)}
                  </span>
                  <span>
                    Trend{" "}
                    {metric.trend_percent === null
                      ? "—"
                      : `${metric.trend_percent > 0 ? "+" : ""}${metric.trend_percent}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="border-foreground/10 rounded-xl border p-4">
          <h3 className="text-sm font-medium">Signals & data gaps</h3>
          <div className="mt-3 space-y-3 text-xs">
            {evidence.signals.length ? (
              evidence.signals.map((signal) => (
                <div
                  key={`${signal.key}-${signal.metric_keys.join("-")}`}
                  className="flex items-start justify-between gap-3"
                >
                  <span>{humanize(signal.key)}</span>
                  <StatusBadge
                    status={
                      signal.severity === "warning" ? "warning" : "neutral"
                    }
                  >
                    {signal.severity}
                  </StatusBadge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                No notable signals detected in this window.
              </p>
            )}
            <div className="border-foreground/10 border-t pt-3">
              <p className="font-medium">Missing metrics</p>
              <p className="text-muted-foreground mt-1 break-words">
                {evidence.quality.missing_metric_keys.length
                  ? evidence.quality.missing_metric_keys.join(", ")
                  : "None"}
              </p>
            </div>
          </div>
        </article>
      </div>
    </Section>
  );
}

function EvidenceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-foreground/7 min-w-0 border-b px-4 py-3">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-1 font-mono text-sm font-medium break-words">
        {value}
      </dd>
    </div>
  );
}
