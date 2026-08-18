import type { Metadata } from "next";
import { TrendingDown } from "lucide-react";
import { getProductBySlug } from "@/lib/data/products";
import { getDashboardOverview } from "@/lib/data/dashboard";
import { AnimatedNumber } from "@/components/common/animated-number";
import { Sparkline } from "@/components/product/sparkline";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product?.shortName ?? product?.name ?? "Product",
    robots: { index: false, follow: false },
  };
}

export default async function ProductOverviewPage({
  params,
}: PageProps<"/dashboard/products/[slug]">) {
  const { slug } = await params;
  const overview = await getDashboardOverview(slug);

  if (!overview) {
    return (
      <p className="text-muted-foreground text-sm">
        This product&apos;s dashboard isn&apos;t connected yet.
      </p>
    );
  }

  const maxBreakdown = Math.max(
    ...overview.breakdown.map((item) => item.amountUsd),
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly spend"
          value={<AnimatedNumber value={overview.monthlySpendUsd} prefix="$" />}
        />
        <StatCard
          label="Potential savings"
          tone="success"
          value={
            <AnimatedNumber
              value={overview.potentialSavingsUsd}
              prefix="$"
              suffix="/mo"
            />
          }
        />
        <StatCard
          label="Optimization score"
          value={
            <AnimatedNumber value={overview.optimizationScore} suffix="/100" />
          }
        />
        <StatCard
          label="Active alerts"
          value={<AnimatedNumber value={overview.activeAlerts} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border-foreground/10 rounded-xl border p-5">
          <p className="text-muted-foreground text-xs">30-day trend</p>
          <Sparkline data={overview.spendTrend} className="mt-3" />
        </div>

        <div className="border-foreground/10 rounded-xl border p-5">
          <p className="text-muted-foreground mb-3 text-xs">Cost by provider</p>
          <div className="space-y-3">
            {overview.breakdown.map((item, index) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-muted-foreground w-20 shrink-0 truncate text-xs">
                  {item.label}
                </span>
                <span className="bg-foreground/5 h-1.5 flex-1 overflow-hidden rounded-full">
                  <span
                    className="bg-accent block h-full rounded-full"
                    style={{
                      width: `${(item.amountUsd / maxBreakdown) * 100}%`,
                      opacity: 1 - index * 0.18,
                    }}
                  />
                </span>
                <span className="text-foreground w-16 shrink-0 text-right font-mono text-xs">
                  ${item.amountUsd.toLocaleString("en-US")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Recommendations
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {overview.recommendations.map((rec) => (
            <div
              key={rec.title}
              className="border-foreground/10 bg-foreground/[0.02] flex items-start gap-3 rounded-xl border p-4"
            >
              <span className="bg-success/10 text-success mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                <TrendingDown size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-foreground text-sm font-medium">
                    {rec.title}
                  </p>
                  <Badge tone="success">
                    Save ${rec.monthlySavingUsd.toLocaleString("en-US")}/mo
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {rec.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  {rec.metrics.map((metric) => (
                    <div key={metric.label} className="text-xs">
                      <span className="text-muted-foreground">
                        {metric.label}:{" "}
                      </span>
                      <span className="text-foreground font-mono">
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Recent activity
        </h2>
        <ul className="border-foreground/10 mt-4 divide-y rounded-xl border">
          {overview.activity.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <span className="text-foreground text-sm">{entry.message}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {entry.timestamp}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
