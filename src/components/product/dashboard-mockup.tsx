import { TrendingDown } from "lucide-react";
import type { ProductDashboardSnapshot } from "@/types";
import { AnimatedNumber } from "@/components/common/animated-number";
import { Sparkline } from "@/components/product/sparkline";

export function DashboardMockup({
  productName,
  snapshot,
}: {
  productName: string;
  snapshot: ProductDashboardSnapshot;
}) {
  const maxBreakdown = Math.max(
    ...snapshot.breakdown.map((item) => item.amountUsd),
  );

  return (
    <div className="border-foreground/10 bg-card-strong rounded-xl border p-4 shadow-2xl shadow-black/20 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-foreground/10 hidden h-2.5 w-2.5 rounded-full sm:block" />
          <span className="bg-foreground/10 hidden h-2.5 w-2.5 rounded-full sm:block" />
          <span className="bg-foreground/10 hidden h-2.5 w-2.5 rounded-full sm:block" />
          <span className="text-muted-foreground text-xs sm:ml-2">
            {productName} · Overview
          </span>
        </div>
        <span className="text-success flex items-center gap-1.5 text-xs">
          <span className="bg-success h-1.5 w-1.5 rounded-full" />
          Live
        </span>
      </div>

      {/* Top metrics — stacked on phones so each figure stays fully legible;
          side-by-side once there's enough width to spare. */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <div>
          <p className="text-muted-foreground text-xs">
            Monthly infrastructure spend
          </p>
          <AnimatedNumber
            value={snapshot.monthlySpendUsd}
            prefix="$"
            className="text-foreground font-mono text-2xl font-semibold sm:text-3xl"
          />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Potential savings</p>
          <AnimatedNumber
            value={snapshot.potentialSavingsUsd}
            prefix="$"
            suffix="/mo"
            className="text-success font-mono text-2xl font-semibold sm:text-3xl"
          />
        </div>
      </div>

      {/* Secondary visualization — dropped on the smallest screens to keep
          the metrics and recommendation front and center. */}
      <div className="mt-5 hidden sm:block">
        <p className="text-muted-foreground text-xs">14-day trend</p>
        <Sparkline data={snapshot.spendTrend} className="mt-1" />
      </div>

      <div className="mt-6">
        <p className="text-muted-foreground mb-3 text-xs">Cost by provider</p>
        <div className="space-y-2.5">
          {snapshot.breakdown.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2 sm:gap-3">
              <span className="text-muted-foreground w-16 shrink-0 truncate text-xs">
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
              <span className="text-foreground w-14 shrink-0 text-right font-mono text-xs sm:w-16">
                ${item.amountUsd.toLocaleString("en-US")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-foreground/10 bg-foreground/[0.03] mt-6 rounded-lg border p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="bg-success/10 text-success mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
            <TrendingDown size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-foreground text-sm font-medium">
              Potential saving: $
              {snapshot.recommendation.monthlySavingUsd.toLocaleString("en-US")}
              /month
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {snapshot.recommendation.title}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {snapshot.recommendation.metrics.map((metric) => (
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
      </div>
    </div>
  );
}
