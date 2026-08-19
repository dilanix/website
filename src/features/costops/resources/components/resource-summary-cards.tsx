import type { ResourceSummary } from "../types";
export function ResourceSummaryCards({
  summary,
}: {
  summary: ResourceSummary;
}) {
  const stats = [
    ["Total resources", summary.totalResources],
    ["Compute", summary.computeResources],
    ["Storage", summary.storageResources],
    ["With recommendations", summary.resourcesWithRecommendations],
  ] as const;
  return (
    <dl className="border-foreground/10 grid overflow-hidden rounded-xl border sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(([label, value]) => (
        <div
          key={label}
          className="border-foreground/10 px-5 py-4 not-first:border-t sm:nth-[2]:border-t-0 sm:nth-[even]:border-l lg:border-t-0 lg:not-first:border-l"
        >
          <dt className="text-muted-foreground text-xs">{label}</dt>
          <dd className="mt-1.5 font-mono text-xl font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
