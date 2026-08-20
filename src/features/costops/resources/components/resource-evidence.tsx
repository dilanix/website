import { Section, StatusBadge } from "@/components/dashboard/primitives";
import { formatDateTime } from "../../utils";
import { formatMetricValue } from "../analytics/formatters";
import type { ResourceEvidence } from "../analytics/evidence-types";
import { humanize } from "../presentation";

export function ResourceEvidencePanel({
  evidence,
  history,
}: {
  evidence: ResourceEvidence | null;
  history: ResourceEvidence[];
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
      <dl className="border-foreground/10 grid overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-5">
        <EvidenceStat label="Policy version" value={evidence.schemaVersion} />
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
                  <span>
                    <span className="block font-medium">
                      {humanize(signal.key)}
                    </span>
                    <span className="text-muted-foreground mt-1 block leading-5">
                      {signalReason(signal)}
                    </span>
                  </span>
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
      <div className="border-foreground/10 mt-4 overflow-hidden rounded-xl border">
        <div className="border-foreground/10 border-b px-4 py-3">
          <h3 className="text-sm font-medium">Evidence history</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Previous idempotent analysis snapshots and the policy version used.
          </p>
        </div>
        {history.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl text-left text-xs">
              <thead className="text-muted-foreground bg-foreground/[0.025]">
                <tr>
                  <th className="px-4 py-2 font-medium">Window end</th>
                  <th className="px-4 py-2 font-medium">Policy</th>
                  <th className="px-4 py-2 font-medium">Quality</th>
                  <th className="px-4 py-2 font-medium">Metric coverage</th>
                  <th className="px-4 py-2 font-medium">Signals</th>
                </tr>
              </thead>
              <tbody>
                {history.map((snapshot) => (
                  <tr
                    key={snapshot.id}
                    className="border-foreground/7 border-t"
                  >
                    <td className="px-4 py-3">
                      {formatDateTime(snapshot.windowEnd)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {snapshot.schemaVersion}
                    </td>
                    <td className="px-4 py-3">{snapshot.quality.score}%</td>
                    <td className="px-4 py-3">
                      {snapshot.quality.metric_coverage_percent}%
                    </td>
                    <td className="px-4 py-3">{snapshot.signals.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground px-4 py-6 text-sm">
            No historical snapshots yet.
          </p>
        )}
      </div>
    </Section>
  );
}

const operatorLabels = {
  lt: "<",
  le: "≤",
  gt: ">",
  ge: "≥",
  eq: "=",
} as const;

function signalReason(signal: ResourceEvidence["signals"][number]) {
  if (
    !signal.field ||
    !signal.operator ||
    signal.threshold === undefined ||
    !signal.aggregation ||
    !signal.observed
  ) {
    return `Detected from ${signal.metric_keys.join(", ")} using an earlier evidence schema.`;
  }
  const observed = Object.entries(signal.observed)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return `${humanize(signal.field)} ${operatorLabels[signal.operator]} ${signal.threshold}; observed ${observed}. Rule aggregation: ${signal.aggregation}.`;
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
