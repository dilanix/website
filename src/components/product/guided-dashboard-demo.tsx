"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import {
  Activity,
  BellRing,
  Boxes,
  CircleDollarSign,
  Cloud,
  Database,
  LayoutDashboard,
  Server,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";
import type { ProductDashboardSnapshot } from "@/types";
import { cn } from "@/lib/utils";

type DemoView = "overview" | "costs" | "infrastructure" | "health";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "costs", label: "Costs", icon: CircleDollarSign },
  { id: "infrastructure", label: "Infrastructure", icon: Boxes },
  { id: "health", label: "Health", icon: Activity },
] satisfies { id: DemoView; label: string; icon: typeof LayoutDashboard }[];

const inventory = [
  { name: "prod-api-cluster", type: "ECS Cluster", region: "us-east-1" },
  { name: "analytics-primary", type: "RDS PostgreSQL", region: "eu-west-1" },
  { name: "assets-production", type: "S3 Bucket", region: "us-east-1" },
  { name: "worker-fleet", type: "EC2 Auto Scaling", region: "us-west-2" },
];

function OverviewPanel({ snapshot }: { snapshot: ProductDashboardSnapshot }) {
  const max = Math.max(...snapshot.spendTrend);
  const min = Math.min(...snapshot.spendTrend);
  const range = max - min || 1;
  const points = snapshot.spendTrend
    .map((value, index) => {
      const x = (index / (snapshot.spendTrend.length - 1)) * 560;
      const y = 142 - ((value - min) / range) * 105;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(13rem,0.55fr)]">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {[
            {
              label: "Monthly spend",
              value: `$${snapshot.monthlySpendUsd.toLocaleString("en-US")}`,
              detail: "Current period",
            },
            {
              label: "Potential savings",
              value: `$${snapshot.potentialSavingsUsd.toLocaleString("en-US")}`,
              detail: "per month",
              positive: true,
            },
            {
              label: "Optimization score",
              value: "72%",
              detail: "+8 points",
            },
          ].map((metric, index) => (
            <div
              key={metric.label}
              className={cn(
                "border-border-soft bg-card-strong/70 rounded-xl border p-3",
                index === 2 && "col-span-2 sm:col-span-1",
              )}
            >
              <p className="text-muted-foreground text-[8px] font-semibold tracking-wide uppercase">
                {metric.label}
              </p>
              <p
                className={cn(
                  "mt-2 font-mono text-base font-semibold sm:text-lg",
                  metric.positive && "text-success",
                )}
              >
                {metric.value}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[8px]">
                {metric.detail}
              </p>
            </div>
          ))}
        </div>
        <div className="border-border-soft bg-card-strong/55 rounded-xl border p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold">Spend trend</p>
              <p className="text-muted-foreground mt-0.5 text-[8px]">
                Last 14 days · FOCUS 1.2
              </p>
            </div>
            <span className="text-success bg-success/8 rounded-full px-2 py-1 text-[8px] font-semibold">
              4.8% optimized
            </span>
          </div>
          <svg
            viewBox="0 0 560 160"
            preserveAspectRatio="none"
            className="mt-3 h-32 w-full overflow-visible"
            aria-label="Sample 14-day cloud spend trend"
            role="img"
          >
            <defs>
              <linearGradient id="demo-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--accent)"
                  stopOpacity="0.24"
                />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[35, 70, 105, 140].map((y) => (
              <line
                key={y}
                x1="0"
                x2="560"
                y1={y}
                y2={y}
                stroke="var(--border-soft)"
                strokeWidth="1"
              />
            ))}
            <polygon
              points={`0,150 ${points} 560,150`}
              fill="url(#demo-chart-fill)"
              className="animate-demo-fade"
            />
            <polyline
              points={points}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="100"
              className="animate-demo-draw motion-reduce:animate-none"
            />
          </svg>
        </div>
      </div>

      <div className="border-success/18 from-success/10 to-card-strong/60 rounded-xl border bg-gradient-to-br p-4">
        <span className="bg-success/12 text-success flex size-8 items-center justify-center rounded-lg">
          <Sparkles size={15} />
        </span>
        <p className="mt-4 text-xs font-semibold">Optimization found</p>
        <p className="text-muted-foreground mt-1 text-[9px] leading-4">
          Idle EC2 reservations and oversized RDS instances are increasing
          effective cost.
        </p>
        <div className="border-success/15 bg-card-strong/50 mt-4 rounded-lg border p-3">
          <p className="text-muted-foreground text-[8px] uppercase">
            Monthly opportunity
          </p>
          <p className="text-success mt-1 font-mono text-xl font-semibold">
            ${snapshot.recommendation.monthlySavingUsd.toLocaleString("en-US")}
          </p>
        </div>
        <div className="text-success mt-4 flex items-center gap-1.5 text-[9px] font-semibold">
          Review recommendation <TrendingDown size={12} />
        </div>
      </div>
    </div>
  );
}

function CostsPanel({ snapshot }: { snapshot: ProductDashboardSnapshot }) {
  const max = Math.max(...snapshot.breakdown.map((item) => item.amountUsd));

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(14rem,0.75fr)]">
      <div className="border-border-soft bg-card-strong/55 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold">Cost by service</p>
            <p className="text-muted-foreground mt-0.5 text-[8px]">
              Effective cost · current month
            </p>
          </div>
          <span className="border-border-soft rounded-lg border px-2 py-1 font-mono text-[8px]">
            USD
          </span>
        </div>
        <div className="mt-5 space-y-4">
          {snapshot.breakdown.map((item, index) => (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[9px]">
                <span className="font-medium">{item.label}</span>
                <span className="font-mono">
                  ${item.amountUsd.toLocaleString("en-US")}
                </span>
              </div>
              <div className="bg-foreground/[0.055] h-2 overflow-hidden rounded-full">
                <div
                  className="from-accent to-accent-secondary h-full origin-left animate-[demo-bar_.65s_ease-out_both] rounded-full bg-gradient-to-r motion-reduce:animate-none"
                  style={{
                    width: `${(item.amountUsd / max) * 100}%`,
                    animationDelay: `${index * 90}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <div className="border-border-soft bg-card-strong/60 rounded-xl border p-4">
          <p className="text-muted-foreground text-[8px] font-semibold tracking-wide uppercase">
            Billed cost
          </p>
          <p className="mt-2 font-mono text-xl font-semibold">
            ${snapshot.monthlySpendUsd.toLocaleString("en-US")}
          </p>
          <p className="text-muted-foreground mt-1 text-[8px]">FOCUS dataset</p>
        </div>
        <div className="border-success/18 from-success/10 to-card-strong/60 rounded-xl border bg-gradient-to-br p-4">
          <p className="text-success text-[8px] font-semibold tracking-wide uppercase">
            Savings identified
          </p>
          <p className="text-success mt-2 font-mono text-xl font-semibold">
            ${snapshot.potentialSavingsUsd.toLocaleString("en-US")}
          </p>
          <p className="text-muted-foreground mt-1 text-[8px]">per month</p>
        </div>
      </div>
    </div>
  );
}

function InfrastructurePanel() {
  return (
    <div className="border-border-soft bg-card-strong/55 overflow-hidden rounded-xl border">
      <div className="border-border-soft flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold">Resource inventory</p>
          <p className="text-muted-foreground mt-0.5 text-[8px]">
            248 resources across 3 regions
          </p>
        </div>
        <span className="border-accent/15 bg-accent/8 text-accent rounded-full border px-2 py-1 text-[8px] font-semibold">
          Live inventory
        </span>
      </div>
      <div className="divide-border-soft divide-y">
        {inventory.map((resource, index) => {
          const Icon = index === 1 ? Database : index === 2 ? Cloud : Server;
          return (
            <div
              key={resource.name}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3"
            >
              <span className="border-border-soft bg-foreground/[0.035] text-accent flex size-8 items-center justify-center rounded-lg border">
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold">
                  {resource.name}
                </p>
                <p className="text-muted-foreground mt-0.5 truncate text-[8px]">
                  {resource.type} · {resource.region}
                </p>
              </div>
              <span className="text-success flex items-center gap-1 text-[8px] font-medium">
                <span className="bg-success size-1 rounded-full" /> Active
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HealthPanel() {
  const providers = [
    { name: "AWS Production", score: 100, detail: "Synced 2m ago" },
    { name: "AWS Analytics", score: 96, detail: "Synced 4m ago" },
    { name: "Telemetry API", score: 100, detail: "Receiving data" },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(13rem,0.8fr)]">
      <div className="space-y-2.5">
        {providers.map((provider, index) => (
          <div
            key={provider.name}
            className="border-border-soft bg-card-strong/55 flex items-center gap-3 rounded-xl border p-3.5"
          >
            <span className="border-success/18 bg-success/10 text-success flex size-9 items-center justify-center rounded-lg border">
              {index === 2 ? <Zap size={15} /> : <Cloud size={15} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[10px] font-semibold">
                  {provider.name}
                </p>
                <span className="text-success font-mono text-[9px]">
                  {provider.score}%
                </span>
              </div>
              <div className="bg-foreground/[0.055] mt-2 h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-success h-full origin-left animate-[demo-bar_.65s_ease-out_both] rounded-full motion-reduce:animate-none"
                  style={{
                    width: `${provider.score}%`,
                    animationDelay: `${index * 100}ms`,
                  }}
                />
              </div>
              <p className="text-muted-foreground mt-1.5 text-[8px]">
                {provider.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-border-soft from-accent/10 to-card-strong/60 rounded-xl border bg-gradient-to-br p-4">
        <span className="border-accent/15 bg-accent/10 text-accent flex size-8 items-center justify-center rounded-lg border">
          <ShieldCheck size={15} />
        </span>
        <p className="mt-4 text-xs font-semibold">Workspace healthy</p>
        <p className="text-muted-foreground mt-1 text-[9px] leading-4">
          All critical data sources are available and reporting within their
          expected sync window.
        </p>
        <div className="border-border-soft mt-4 flex items-center justify-between border-t pt-3">
          <span className="text-muted-foreground text-[8px]">
            Open incidents
          </span>
          <span className="font-mono text-sm font-semibold">0</span>
        </div>
        <div className="border-border-soft mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-muted-foreground text-[8px]">
            Data freshness
          </span>
          <span className="text-success text-[9px] font-semibold">Current</span>
        </div>
      </div>
    </div>
  );
}

export function GuidedDashboardDemo({
  productName,
  snapshot,
}: {
  productName: string;
  snapshot: ProductDashboardSnapshot;
}) {
  const [activeView, setActiveView] = useState<DemoView>("overview");
  const [autoplay, setAutoplay] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (!autoplay || paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveView((current) => {
        const index = tabs.findIndex((tab) => tab.id === current);
        return tabs[(index + 1) % tabs.length].id;
      });
    }, 5500);
    return () => window.clearInterval(timer);
  }, [autoplay, paused, reducedMotion]);

  function selectView(view: DemoView) {
    setActiveView(view);
    setAutoplay(false);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = tabs.findIndex((tab) => tab.id === activeView);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : event.key === "ArrowRight"
            ? (currentIndex + 1) % tabs.length
            : (currentIndex - 1 + tabs.length) % tabs.length;
    const next = tabs[nextIndex];
    selectView(next.id);
    document.getElementById(`demo-tab-${next.id}`)?.focus();
  }

  return (
    <div
      className="border-border-soft bg-card-strong/82 relative overflow-hidden rounded-[1.65rem] border p-2 shadow-[0_34px_90px_var(--shadow-brand)] backdrop-blur-xl sm:p-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="border-border-soft bg-background/55 overflow-hidden rounded-[1.25rem] border">
        <div className="border-border-soft bg-card-strong/70 flex h-11 items-center gap-3 border-b px-3 sm:px-4">
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="size-2 rounded-full bg-rose-400/70" />
            <span className="size-2 rounded-full bg-amber-400/70" />
            <span className="size-2 rounded-full bg-emerald-400/70" />
          </div>
          <div className="border-border-soft bg-foreground/[0.025] text-muted-foreground mx-auto flex max-w-60 min-w-0 flex-1 items-center justify-center rounded-lg border px-3 py-1.5 font-mono text-[8px]">
            demo.dilanix.com
          </div>
          <span className="border-accent/15 bg-accent/8 text-accent shrink-0 rounded-full border px-2 py-1 text-[7px] font-semibold tracking-wide uppercase">
            Sample workspace
          </span>
        </div>

        <div className="grid min-h-[31rem] sm:grid-cols-[3.5rem_minmax(0,1fr)]">
          <aside className="border-border-soft bg-card-strong/45 hidden flex-col items-center border-r py-4 sm:flex">
            <span className="from-accent to-accent-secondary text-accent-foreground flex size-8 items-center justify-center rounded-xl bg-gradient-to-br text-[10px] font-bold shadow-[0_8px_20px_var(--shadow-brand)]">
              D
            </span>
            <div className="mt-6 flex flex-col gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeView === tab.id;
                return (
                  <span
                    key={tab.id}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg",
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground/60",
                    )}
                  >
                    <Icon size={14} />
                  </span>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="border-border-soft bg-card-strong/35 flex min-h-14 items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-5">
              <div className="min-w-0">
                <p className="text-muted-foreground text-[7px] font-semibold tracking-[0.14em] uppercase">
                  {productName}
                </p>
                <p className="mt-0.5 truncate text-[10px] font-semibold">
                  {tabs.find((tab) => tab.id === activeView)?.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success hidden items-center gap-1.5 text-[8px] sm:flex">
                  <span className="bg-success size-1 rounded-full shadow-[0_0_7px_var(--success)]" />
                  Live sample
                </span>
                <span className="border-border-soft bg-card-strong/70 text-muted-foreground flex size-7 items-center justify-center rounded-lg border">
                  <BellRing size={12} />
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-5">
              <div
                role="tablist"
                aria-label="Interactive dashboard views"
                className="border-border-soft bg-foreground/[0.025] grid grid-cols-2 gap-1 rounded-xl border p-1 sm:grid-cols-4"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`demo-tab-${tab.id}`}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls="guided-demo-panel"
                      tabIndex={active ? 0 : -1}
                      onClick={() => selectView(tab.id)}
                      onKeyDown={handleTabKeyDown}
                      className={cn(
                        "relative flex min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-lg px-2 py-2 text-[9px] font-semibold transition-all",
                        active
                          ? "border-border-soft bg-card-strong text-foreground border shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon size={12} />
                      <span className="truncate">{tab.label}</span>
                      {active && autoplay && !paused && !reducedMotion ? (
                        <span
                          key={activeView}
                          className="bg-accent absolute inset-x-1 bottom-0 h-px origin-left animate-[demo-progress_5.5s_linear]"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div
                key={activeView}
                id="guided-demo-panel"
                role="tabpanel"
                aria-labelledby={`demo-tab-${activeView}`}
                className="mt-3 animate-[demo-panel-in_.35s_ease-out] motion-reduce:animate-none"
              >
                {activeView === "overview" ? (
                  <OverviewPanel snapshot={snapshot} />
                ) : activeView === "costs" ? (
                  <CostsPanel snapshot={snapshot} />
                ) : activeView === "infrastructure" ? (
                  <InfrastructurePanel />
                ) : (
                  <HealthPanel />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
