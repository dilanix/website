import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import {
  Metric,
  PageHeader,
  StatusBadge,
} from "@/components/dashboard/primitives";
import { getRecommendations } from "@/lib/data/dashboard-mocks";
export const metadata: Metadata = {
  title: "Recommendations — CostOps",
  robots: { index: false, follow: false },
};
export default async function RecommendationsPage() {
  const recs = await getRecommendations();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Recommendations"
        description="Reduce infrastructure and AI costs without compromising reliability."
      />
      <dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-3">
        <Metric
          label="Potential monthly savings"
          value="$3,420"
          tone="positive"
        />
        <Metric label="Recommendations" value="12" />
        <Metric label="High confidence" value="8" />
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        <div className="border-foreground/10 flex flex-wrap rounded-lg border p-1">
          {["All", "AWS", "AI", "Compute", "Database"].map((item) => (
            <button
              key={item}
              className={`rounded-md px-3 py-1.5 text-xs ${item === "All" ? "bg-foreground/8" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item}
            </button>
          ))}
        </div>
        {["Confidence", "Impact", "Status"].map((item) => (
          <button
            key={item}
            className="border-foreground/10 text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs"
          >
            <SlidersHorizontal size={12} />
            {item}
          </button>
        ))}
      </div>
      <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
        {recs.map((rec) => (
          <article
            key={rec.id}
            className="grid gap-4 p-5 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
          >
            <div>
              <h2 className="text-sm font-medium">{rec.title}</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                {rec.resources} · {rec.provider} / {rec.category}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
                Estimated savings
              </p>
              <p className="text-success mt-1 font-mono text-sm">
                ${rec.saving} / month
              </p>
            </div>
            <StatusBadge
              status={rec.confidence === "High" ? "success" : "warning"}
            >
              {rec.confidence}
            </StatusBadge>
            <button className="border-foreground/15 hover:border-accent/50 rounded-lg border px-3 py-2 text-xs font-medium">
              View details
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
