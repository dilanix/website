import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getCostOpsOverview,
  getRecommendations,
} from "@/lib/data/dashboard-mocks";
import {
  Metric,
  PageHeader,
  Section,
  StatusBadge,
} from "@/components/dashboard/primitives";

export const metadata: Metadata = {
  title: "CostOps",
  robots: { index: false, follow: false },
};
const money = (value: number) => `$${value.toLocaleString("en-US")}`;

export default async function CostOpsPage() {
  const [overview, recs] = await Promise.all([
    getCostOpsOverview(),
    getRecommendations(),
  ]);
  const max = Math.max(...overview.dailySpend);
  const maxCategory = Math.max(
    ...overview.categories.map((item) => item.amount),
  );
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="CostOps"
        description="Cloud and AI infrastructure cost visibility and optimization."
        action={
          <span className="border-foreground/10 text-muted-foreground rounded-lg border px-3 py-2 text-sm">
            {overview.period}
          </span>
        }
      />
      <dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {overview.metrics.map((metric) => (
          <Metric key={metric.label} {...metric} />
        ))}
      </dl>
      <Section
        title="Spend over time"
        action={
          <div
            className="border-foreground/10 flex rounded-lg border p-1"
            aria-label="Chart date range"
          >
            {["7D", "30D", "90D"].map((range) => (
              <button
                key={range}
                className={`rounded-md px-2.5 py-1 text-xs ${range === "30D" ? "bg-foreground/8 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {range}
              </button>
            ))}
          </div>
        }
      >
        <div className="border-foreground/10 rounded-xl border p-5">
          <div
            className="flex h-48 items-end gap-1"
            role="img"
            aria-label="Daily spend over the last 30 days, ranging from 742 to 962 dollars"
          >
            {overview.dailySpend.map((value, index) => (
              <div
                key={index}
                className="group relative flex h-full flex-1 items-end"
              >
                <div
                  className="bg-accent/55 group-hover:bg-accent w-full rounded-t-sm transition-colors"
                  style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
                >
                  <span className="sr-only">
                    Day {index + 1}: {money(value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-3 flex justify-between font-mono text-[10px]">
            <span>Jul 20</span>
            <span>Aug 3</span>
            <span>Aug 18</span>
          </div>
        </div>
      </Section>
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Spend by provider">
          <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
            {overview.providers.map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 px-4 py-3"
              >
                <span className="text-sm">{item.label}</span>
                <div className="bg-foreground/6 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-accent h-full rounded-full"
                    style={{ width: `${item.share}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-28 text-right font-mono text-xs">
                  {money(item.amount)} · {item.share}%
                </span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Cost by category">
          <div className="space-y-4">
            {overview.categories.map((item) => (
              <div key={item.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-mono">{money(item.amount)}</span>
                </div>
                <div className="bg-foreground/6 h-1 rounded-full">
                  <div
                    className="bg-foreground/35 h-full rounded-full"
                    style={{ width: `${(item.amount / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
      <Section
        title="Optimization opportunities"
        action={
          <Link
            href="/dashboard/costops/recommendations"
            className="text-accent inline-flex items-center gap-1 text-sm hover:underline"
          >
            View all recommendations <ArrowRight size={14} />
          </Link>
        }
      >
        <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
          {recs.map((rec) => (
            <div
              key={rec.id}
              className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-medium">{rec.title}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {rec.provider} / {rec.category}
                </p>
              </div>
              <span className="text-success font-mono text-sm">
                Save {money(rec.saving)}/mo
              </span>
              <StatusBadge
                status={rec.confidence === "High" ? "success" : "warning"}
              >
                {rec.confidence} confidence
              </StatusBadge>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
