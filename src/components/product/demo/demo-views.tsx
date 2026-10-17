"use client";

import "@xyflow/react/dist/style.css";

import { useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleDollarSign,
  Cloud,
  CloudCog,
  Filter,
  HeartPulse,
  Layers3,
  Maximize,
  Minus,
  PackageOpen,
  Plug,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wrench,
  X,
  Boxes,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PageHeader,
  Section,
  StatusBadge,
} from "@/components/dashboard/primitives";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  ExpandableRow,
  ExpandableTable,
  RowMenu,
  RowTag,
  StatePill,
} from "@/components/dashboard/expandable-table";
import { ResourceCategoryIcon } from "@/components/dashboard/resource-category-icon";
import {
  BeforeYouContinue,
  RecommendationInsight,
} from "@/components/dashboard/recommendation-review";
import { GuideBody } from "@/components/dashboard/fix-guide";
import { SpendTrajectoryChart } from "@/components/dashboard/cost/spend-trajectory-chart";
import { formatAmount } from "@/components/dashboard/cost/format";
import {
  graphNodeTypes,
  type GraphNodeData,
} from "@/components/dashboard/infrastructure/graph-nodes";
import {
  graphEdgeTypes,
  type GraphEdgeData,
} from "@/components/dashboard/infrastructure/graph-edge";
import { EVIDENCE_STYLES } from "@/components/dashboard/infrastructure/resource-visuals";
import { ResourceInspector } from "@/components/dashboard/infrastructure/graph-inspector";
import type { ModelNode } from "@/lib/infrastructure/graph-model";
import { cn } from "@/lib/utils";
import {
  DEMO_USER,
  DEMO_WORKSPACE,
  demoCostDrivers,
  demoDailySpend,
  demoDatasets,
  demoFixGuide,
  demoGraphEdges,
  demoGraphNodes,
  demoRecommendations,
  demoResourceDetail,
  demoReview,
} from "@/components/product/demo-data";

// The real dashboard's family tints (recommendations-inbox-client).
const FAMILY_TINTS: Record<string, string> = {
  ec2: "border-orange-500/25 bg-orange-500/10 text-orange-500",
  ecs: "border-amber-500/25 bg-amber-500/10 text-amber-500",
  rds: "border-violet-500/25 bg-violet-500/10 text-violet-500",
};

/** Cumulative effective cost per day — what the budget chart plots. */
const DEMO_ACTUAL = demoDailySpend.reduce<
  { date: string; cumulative: number }[]
>(
  (points, amount, index) => [
    ...points,
    {
      date: new Date(Date.UTC(2026, 9, index + 1)).toISOString(),
      cumulative: (points.at(-1)?.cumulative ?? 0) + amount,
    },
  ],
  [],
);

const MONTH_START = "2026-10-01T00:00:00Z";
const MONTH_END = "2026-11-01T00:00:00Z";

/** The header every product page carries: back link, name, status, tabs. */
function ProductHeader({
  name,
  tabs,
  active,
}: {
  name: string;
  tabs: string[];
  active: string;
}) {
  return (
    <>
      <div>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft size={14} />
          Products
        </span>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          <Badge tone="success">Active</Badge>
        </div>
      </div>
      <div className="border-foreground/10 flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <span
            key={tab}
            className={cn(
              "relative shrink-0 px-3 py-2.5 text-sm whitespace-nowrap",
              tab === active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {tab}
            {tab === active ? (
              <span className="bg-accent absolute -bottom-px left-0 h-px w-full" />
            ) : null}
          </span>
        ))}
      </div>
    </>
  );
}

// ── Overview ────────────────────────────────────────────────────────────────

const connections = [
  {
    name: "AWS Production",
    provider: "Amazon Web Services",
    synced: "Synced Oct 17, 07:58 AM",
  },
  {
    name: "AWS Shared services",
    provider: "Amazon Web Services",
    synced: "Synced Oct 17, 07:41 AM",
  },
];

export function OverviewView() {
  const metrics = [
    {
      label: "Connected sources",
      value: "2/2",
      detail: "Ready for cloud sync",
      icon: Plug,
      iconClassName: "border-cyan-500/20 bg-cyan-500/10 text-cyan-500",
    },
    {
      label: "Cloud providers",
      value: "1",
      detail: "Unified in one workspace",
      icon: CloudCog,
      iconClassName: "border-blue-500/20 bg-blue-500/10 text-blue-500",
    },
    {
      label: "Active products",
      value: "2",
      detail: "5 available to your team",
      icon: Layers3,
      iconClassName: "border-violet-500/20 bg-violet-500/10 text-violet-500",
    },
    {
      label: "Needs attention",
      value: "0",
      detail: "Everything looks good",
      icon: CheckCircle2,
      iconClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    },
  ];
  const links = [
    {
      title: "Cloud resources",
      description: "Search and inspect your live infrastructure inventory.",
      icon: Boxes,
      iconClassName: "border-cyan-500/20 bg-cyan-500/10 text-cyan-500",
    },
    {
      title: "Cost intelligence",
      description: "Understand spend, trends, and optimization opportunities.",
      icon: CircleDollarSign,
      iconClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    },
    {
      title: "Data connections",
      description: "Connect and manage your cloud providers in one place.",
      icon: Plug,
      iconClassName: "border-violet-500/20 bg-violet-500/10 text-violet-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="border-border-soft bg-dashboard-panel dashboard-panel-highlight relative overflow-hidden rounded-[1.75rem] border p-6 shadow-[0_24px_70px_var(--shadow-card)] backdrop-blur-sm sm:p-8 lg:p-10">
        <div className="from-accent/18 pointer-events-none absolute -top-32 -right-24 size-80 rounded-full bg-radial to-transparent blur-2xl" />
        <div className="from-accent-secondary/12 pointer-events-none absolute -bottom-36 left-1/3 size-72 rounded-full bg-radial to-transparent blur-3xl" />
        <div className="relative z-10 grid items-center gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <div className="border-success/20 bg-success/8 text-success mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
              <span className="bg-success size-1.5 rounded-full shadow-[0_0_10px_var(--success)]" />
              Cloud command center
            </div>
            <h1 className="max-w-3xl text-3xl leading-[1.08] font-semibold tracking-[-0.045em] sm:text-4xl lg:text-[2.8rem]">
              Good to see you, {DEMO_USER.firstName}.
              <span className="text-muted-foreground mt-2 block">
                Your cloud is in focus.
              </span>
            </h1>
            <p className="text-muted-foreground mt-5 max-w-2xl text-sm leading-6 sm:text-[15px] sm:leading-7">
              Monitor connections, explore infrastructure, and move from signal
              to action across {DEMO_WORKSPACE}.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <span className="text-accent-foreground from-accent to-accent-secondary inline-flex items-center gap-2 rounded-xl bg-gradient-to-br px-4 py-2.5 text-sm font-semibold shadow-[0_14px_34px_var(--shadow-brand)]">
                <Plus size={16} />
                Connect source
              </span>
              <span className="border-border-soft bg-card-strong/65 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm backdrop-blur-sm">
                Explore products
                <ArrowRight size={15} />
              </span>
            </div>
          </div>

          <div className="border-border-soft bg-card-strong/55 relative overflow-hidden rounded-3xl border p-5 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
                  Workspace health
                </p>
                <p className="mt-2 text-sm font-semibold">
                  All sources are connected
                </p>
              </div>
              <span className="border-accent/15 bg-accent/10 text-accent flex size-9 items-center justify-center rounded-xl border">
                <Activity size={16} />
              </span>
            </div>
            <div className="mt-6 flex items-center gap-5">
              <div
                className="relative flex size-24 shrink-0 items-center justify-center rounded-full p-[7px] shadow-[0_12px_34px_var(--shadow-brand)]"
                style={{
                  background:
                    "conic-gradient(var(--accent) 100%, color-mix(in oklab, var(--foreground) 8%, transparent) 0)",
                }}
              >
                <div className="bg-card-strong flex size-full items-center justify-center rounded-full">
                  <span className="font-mono text-xl font-semibold tracking-tight">
                    100%
                  </span>
                </div>
              </div>
              <dl className="min-w-0 flex-1 space-y-3">
                {[
                  ["Connected", "2"],
                  ["Providers", "1"],
                  ["Products", "2"],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={cn(
                      "flex items-center justify-between gap-3",
                      index > 0 && "border-border-soft border-t pt-3",
                    )}
                  >
                    <dt className="text-muted-foreground text-xs">{label}</dt>
                    <dd className="font-mono text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="border-border-soft bg-dashboard-panel relative overflow-hidden rounded-[1.35rem] border p-5 shadow-[0_16px_44px_var(--shadow-card)] backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground text-[10px] font-semibold tracking-[0.12em] uppercase">
                  {metric.label}
                </dt>
                <span
                  className={`flex size-8 items-center justify-center rounded-lg border ${metric.iconClassName}`}
                >
                  <Icon size={15} />
                </span>
              </div>
              <dd className="mt-4 font-mono text-3xl font-semibold tracking-[-0.05em]">
                {metric.value}
              </dd>
              <p className="text-muted-foreground mt-1.5 text-[11px]">
                {metric.detail}
              </p>
            </div>
          );
        })}
      </dl>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Section
          title="Cloud connections"
          description="Live provider status and synchronization freshness."
          action={
            <span className="text-accent inline-flex items-center gap-1 text-xs font-semibold">
              Manage all <ArrowUpRight size={13} />
            </span>
          }
        >
          <div className="border-border-soft bg-dashboard-panel overflow-hidden rounded-[1.4rem] border shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-sm">
            <div className="border-border-soft text-muted-foreground hidden grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.7fr)_auto] gap-4 border-b px-5 py-3 text-[9px] font-semibold tracking-[0.14em] uppercase sm:grid">
              <span>Connection</span>
              <span>Last activity</span>
              <span>Status</span>
            </div>
            <div className="divide-border-soft divide-y">
              {connections.map((connection) => (
                <div
                  key={connection.name}
                  className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.7fr)_auto] sm:items-center sm:gap-4 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="border-border-soft bg-card-strong/70 text-accent flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-sm">
                      <PackageOpen size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {connection.name}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block truncate text-[11px]">
                        {connection.provider}
                      </span>
                    </span>
                  </div>
                  <span className="text-muted-foreground pl-[3.25rem] text-[11px] sm:pl-0">
                    {connection.synced}
                  </span>
                  <div className="pl-[3.25rem] sm:pl-0">
                    <StatusBadge status="success">Healthy</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section
          title="Quick access"
          description="Jump directly to the work that matters."
        >
          <div className="border-border-soft bg-dashboard-panel flex flex-col gap-1.5 rounded-[1.4rem] border p-2 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-sm">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-2xl p-3"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${item.iconClassName}`}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold">
                      {item.title}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block text-[10px] leading-4">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground shrink-0 opacity-40"
                  />
                </div>
              );
            })}
            <div className="border-accent/10 from-accent/8 to-accent-secondary/8 mt-1 flex items-center gap-3 rounded-2xl border bg-gradient-to-br p-3">
              <span className="from-accent to-accent-secondary text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-[0_10px_24px_var(--shadow-brand)]">
                <Sparkles size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">
                  Product portfolio
                </span>
                <span className="text-muted-foreground mt-0.5 block text-[10px]">
                  2 active of 5 available
                </span>
              </span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ── Cost ────────────────────────────────────────────────────────────────────

const chipActive =
  "border-accent/30 bg-accent/10 text-accent rounded-full border px-3 py-1.5 text-xs font-medium";
const chipIdle =
  "border-foreground/10 text-muted-foreground rounded-full border px-3 py-1.5 text-xs font-medium";

export function CostView() {
  const actual = DEMO_ACTUAL;
  const total = actual[actual.length - 1]!.cumulative;
  const average = total / demoDailySpend.length;
  const projected = total + average * (31 - demoDailySpend.length);
  const previous = 46381.4;
  const delta = total - previous;

  return (
    <div className="flex flex-col gap-6">
      <ProductHeader
        name="Cost"
        active="Overview"
        tabs={[
          "Overview",
          "Explorer",
          "Budgets",
          "Allocations",
          "Anomalies",
          "Saved Views",
          "Reports",
          "Documentation",
        ]}
      />

      <div className="border-border-soft bg-dashboard-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 shadow-[0_16px_44px_var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <span className="border-border-soft bg-card-strong/60 text-accent flex size-10 items-center justify-center rounded-xl border">
            <Cloud size={17} />
          </span>
          <div>
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              Cost data scope
            </p>
            <p className="text-sm font-medium">All accessible connections</p>
            <p className="text-muted-foreground text-xs">
              Connections without billing.read are excluded automatically.
            </p>
          </div>
        </div>
        <span className="border-border-soft bg-background/60 flex h-10 w-72 items-center justify-between rounded-xl border px-3 text-sm">
          All accessible connections <ChevronDown size={14} />
        </span>
      </div>

      <div>
        <div className="border-border-soft bg-dashboard-panel mb-5 inline-flex gap-1 rounded-xl border p-1">
          {["Summary", "Services", "Resources", "Trends"].map((tab, index) => (
            <span
              key={tab}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                index === 0
                  ? "bg-accent/12 text-accent"
                  : "text-muted-foreground",
              )}
            >
              {tab}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                Spend overview
              </h2>
              <StatusBadge status="success">FOCUS</StatusBadge>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Oct 1 – Oct 17, 2026 vs. the immediately preceding period of equal
              length. Includes provider credits and discounts, broken down below
              by charge type.
            </p>
          </div>
          <span className="text-accent inline-flex items-center gap-1 text-xs font-semibold">
            Open Explorer <ArrowRight size={13} />
          </span>
        </div>
        <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
          <CheckCircle2 size={13} className="text-success" />
          All 2 budgets on track · no open anomalies
        </p>

        <div className="border-border-soft bg-dashboard-panel mt-4 flex flex-wrap items-center gap-1.5 rounded-2xl border p-3 shadow-[0_16px_44px_var(--shadow-card)]">
          {[
            "Month to date",
            "1 day",
            "3 days",
            "Week",
            "30 days",
            "Custom",
          ].map((label, index) => (
            <span key={label} className={index === 0 ? chipActive : chipIdle}>
              {label}
            </span>
          ))}
        </div>

        <p className="text-muted-foreground mt-4 mb-3 text-xs">
          Current period spend and the dimension breakdown use FOCUS only.{" "}
          <span className="text-foreground font-medium">
            Complete FOCUS coverage through Oct 17.
          </span>
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="USD · Current period"
            tone="success"
            value={
              <>
                <span className="block">{formatAmount(total, "USD")}</span>
                <span className="mt-1 flex items-center gap-1 text-xs font-normal tracking-normal">
                  <TrendingDown size={12} />
                  {formatAmount(Math.abs(delta), "USD")} (
                  {Math.abs((delta / previous) * 100).toFixed(1)}%) vs previous
                  period
                </span>
              </>
            }
          />
        </div>

        <div className="border-border-soft bg-dashboard-panel mt-4 rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Budget pacing · USD</h3>
            <div className="flex flex-wrap gap-1.5">
              <span className={chipActive}>Monthly cloud budget</span>
              <span className={chipIdle}>Platform team</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            {formatAmount(projected, "USD")} projected by Nov 1 vs.{" "}
            {formatAmount(85000, "USD")} budget
          </p>
          <div className="mt-3">
            <SpendTrajectoryChart
              currency="USD"
              periodStart={MONTH_START}
              periodEnd={MONTH_END}
              actual={actual}
              forecastTail={[
                actual[actual.length - 1]!,
                { date: "2026-10-31T00:00:00Z", cumulative: projected },
              ]}
              budgetAmount={85000}
              height={180}
            />
          </div>
          <p className="text-muted-foreground mt-2 text-[11px]">
            The lighter dashed tail is an estimate — a trailing 7-day daily
            average projected across the rest of the period, not a statistical
            forecast.
          </p>
        </div>

        <div className="border-border-soft bg-dashboard-panel mt-4 rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
          <h3 className="text-sm font-semibold">
            Cost Drivers — why did spend change?
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Service-level totals for this FOCUS range vs. the immediately
            preceding period of equal length.
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {(
              [
                ["increases", "Top increases · USD", TrendingUp],
                ["decreases", "Top decreases · USD", TrendingDown],
              ] as const
            ).map(([key, title, Icon]) => (
              <div key={key}>
                <h4 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
                  <Icon
                    size={13}
                    className={
                      key === "increases" ? "text-red-500" : "text-emerald-500"
                    }
                  />
                  {title}
                </h4>
                <div className="mt-2 space-y-2.5">
                  {demoCostDrivers[key].map((driver) => {
                    const change = driver.to - driver.from;
                    return (
                      <div
                        key={driver.service}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5"
                      >
                        <span className="truncate text-xs font-medium">
                          {driver.service}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-xs",
                            change > 0
                              ? "text-red-500"
                              : "text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          {change > 0 ? "+" : ""}
                          {formatAmount(change, "USD")}
                        </span>
                        <span className="text-muted-foreground col-span-2 text-[11px]">
                          {formatAmount(driver.from, "USD")} →{" "}
                          {formatAmount(driver.to, "USD")} (
                          {change > 0 ? "+" : ""}
                          {((change / driver.from) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Recommendations ─────────────────────────────────────────────────────────

const REC_GRID =
  "md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,0.75fr)_minmax(0,0.85fr)_5.5rem]";

export function FixGuidePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close guide"
        onClick={onClose}
        className="bg-background/60 absolute inset-0 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-label={`How to fix: ${demoFixGuide.option_title}`}
        className="border-border-soft bg-background animate-drawer-in relative flex h-full w-full max-w-2xl flex-col border-l shadow-2xl"
      >
        <header className="border-border-soft flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-accent mb-1 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase">
              <Wrench size={11} aria-hidden /> How to fix
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              {demoFixGuide.option_title}
            </h2>
            <code className="border-border-soft bg-card-strong/60 mt-1.5 inline-block rounded px-1.5 py-0.5 text-[11px]">
              orders-db · eu-west-1
            </code>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="border-border-soft text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg border"
          >
            <X size={16} aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <GuideBody guide={demoFixGuide} recommendationId="demo-rec-rds" />
        </div>
        <footer className="border-border-soft text-muted-foreground border-t px-5 py-3 text-[11px] sm:px-6">
          Dilanix never runs these steps or changes your infrastructure.
        </footer>
      </aside>
    </div>
  );
}

export function RecommendationsView({ onOpenFix }: { onOpenFix: () => void }) {
  const [openId, setOpenId] = useState<string | null>("rec-rds");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Insights"
        title="Recommendations"
        description="A unified, cross-product inbox of optimization recommendations — never gated by a single product's own access grant."
      />
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        {[
          ["5", "recommendations", "text-accent"],
          ["1", "need your input", "text-amber-500"],
          ["4", "ready to fix", "text-success"],
        ].map(([value, label, tone], index) => (
          <p
            key={label}
            className={cn(
              "text-muted-foreground flex items-baseline gap-2 text-sm",
              index > 0 && "border-border-soft border-l pl-6",
            )}
          >
            <span className={cn("font-mono text-2xl font-semibold", tone)}>
              {value}
            </span>
            {label}
          </p>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {["All", "Active", "Dismissed", "Resolved"].map((label, index) => (
          <span
            key={label}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm",
              index === 0
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border-soft text-muted-foreground",
            )}
          >
            {label}
          </span>
        ))}
        <span className="border-border-soft text-foreground flex items-center gap-6 rounded-xl border px-3 py-2 text-sm">
          All products <ChevronDown size={14} />
        </span>
        <span className="border-border-soft text-foreground flex items-center gap-16 rounded-xl border px-3 py-2 text-sm">
          All analyzers <ChevronDown size={14} />
        </span>
        <span className="text-muted-foreground flex items-center gap-2 text-sm">
          <span className="border-border-soft size-4 rounded border" />
          Show covered
        </span>
        <span className="border-border-soft text-muted-foreground ml-auto flex min-w-60 flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-sm">
          <Search size={14} /> Search recommendations…
        </span>
      </div>

      <ExpandableTable
        label="Recommendations"
        columns={["Recommendation", "Resource", "Potential savings", "Status"]}
        gridClassName={REC_GRID}
      >
        {demoRecommendations.map((recommendation) => {
          const open = openId === recommendation.id;
          return (
            <ExpandableRow
              key={recommendation.id}
              id={recommendation.id}
              label={recommendation.title}
              open={open}
              onToggle={() => setOpenId(open ? null : recommendation.id)}
              gridClassName={REC_GRID}
              title={
                <>
                  <span className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-px inline-flex h-5 min-w-7 shrink-0 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-semibold",
                        recommendation.rank <= 3
                          ? "bg-accent text-accent-foreground"
                          : "bg-accent/12 text-accent",
                      )}
                    >
                      #{recommendation.rank}
                    </span>
                    <span className="block text-sm font-semibold">
                      {recommendation.title}
                    </span>
                  </span>
                  <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs leading-5">
                    {recommendation.summary}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    <RowTag>cost</RowTag>
                    <RowTag
                      tone={
                        recommendation.priority === "high"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {recommendation.priority} priority
                    </RowTag>
                    <RowTag tone="warning">active</RowTag>
                  </span>
                </>
              }
              cells={[
                <div key="resource" className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                      FAMILY_TINTS[recommendation.family],
                    )}
                  >
                    <ResourceCategoryIcon
                      category={recommendation.category}
                      size={16}
                    />
                  </span>
                  <span className="min-w-0 text-xs">
                    <span className="text-muted-foreground block">
                      {recommendation.resourceKind}
                    </span>
                    <span className="block truncate text-sm font-medium">
                      {recommendation.resourceName}
                    </span>
                    <span className="text-muted-foreground block truncate">
                      {recommendation.resourceDetail}
                    </span>
                  </span>
                </div>,
                <div key="savings">
                  <span className="text-muted-foreground block text-[11px]">
                    Up to
                  </span>
                  <span className="text-accent block font-mono text-xl font-semibold tracking-tight">
                    {recommendation.savingLabel}
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    per monthly
                  </span>
                </div>,
                <StatePill key="state" tone={recommendation.state.tone}>
                  {recommendation.state.label}
                </StatePill>,
                <div
                  key="actions"
                  className="flex items-center justify-end gap-1"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : recommendation.id)}
                    className="text-accent px-2 py-1 text-xs font-medium hover:underline"
                  >
                    {open ? "Close" : "Details"}
                  </button>
                  <RowMenu
                    label={`More actions for ${recommendation.title}`}
                    items={[]}
                  />
                </div>,
              ]}
            >
              {recommendation.id === "rec-rds" ? (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="lg:border-border-soft flex flex-col gap-5 lg:border-r lg:pr-6">
                    <RecommendationInsight review={demoReview} currency="USD" />
                    <p className="text-muted-foreground text-[11px]">
                      aws.rds.rightsizing · first detected Oct 9, 08:00 AM ·
                      last seen Oct 17, 07:58 AM
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <BeforeYouContinue review={demoReview} />
                    <button
                      type="button"
                      onClick={onOpenFix}
                      className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 self-start rounded-lg px-5 py-2.5 text-sm font-medium shadow-[0_10px_30px_color-mix(in_oklab,var(--accent)_35%,transparent)] hover:opacity-90"
                    >
                      <Wrench size={15} aria-hidden /> How to fix
                    </button>
                  </div>
                </div>
              ) : (
                <section className="text-sm">
                  <h3 className="text-base font-semibold tracking-tight">
                    Why this matters
                  </h3>
                  <p className="text-muted-foreground mt-1.5 leading-6">
                    {recommendation.summary}
                  </p>
                </section>
              )}
            </ExpandableRow>
          );
        })}
      </ExpandableTable>
    </div>
  );
}

// ── Infrastructure ──────────────────────────────────────────────────────────

const panel =
  "border-border-soft bg-card-strong pointer-events-auto rounded-xl border shadow-[0_6px_20px_var(--shadow-card)]";

function modelFor(id: string, kind: ModelNode["kind"]): ModelNode {
  return {
    id,
    kind,
    resource: demoGraphNodes[id] ?? null,
    parentId: null,
    layer: kind === "group" ? "network" : "service",
    hiddenNeighbors: 0,
    expanded: false,
    memberCount: 0,
    collapsed: false,
    matches: true,
  };
}

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  internet: { x: 50, y: 230 },
  alb: { x: 300, y: 238 },
  api: { x: 640, y: 150 },
  worker: { x: 640, y: 330 },
  db: { x: 980, y: 240 },
  cache: { x: 980, y: 80 },
  queue: { x: 1300, y: 330 },
  bucket: { x: 1300, y: 470 },
  fn: { x: 1620, y: 330 },
};

function GraphCanvas({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const noop = () => undefined;
  const nodes = useMemo<Node[]>(() => {
    const vpc: Node = {
      id: "vpc",
      type: "group",
      position: { x: 250, y: 20 },
      data: {
        model: modelFor("vpc", "group"),
        onToggleExpand: noop,
        onToggleGroup: noop,
      } satisfies GraphNodeData,
      style: { width: 1040, height: 420 },
      zIndex: 0,
      selectable: false,
    };
    const rest: Node[] = Object.entries(NODE_POSITIONS).map(([id, at]) => ({
      id,
      type: id === "internet" ? "internet" : "resource",
      position: at,
      data: {
        model: modelFor(id, id === "internet" ? "internet" : "resource"),
        onToggleExpand: noop,
        onToggleGroup: noop,
      } satisfies GraphNodeData,
      selected: id === selectedId,
      zIndex: 4,
    }));
    return [vpc, ...rest];
  }, [selectedId]);

  const edges = useMemo<Edge[]>(
    () =>
      demoGraphEdges.map((edge) => {
        const kind = edge.kinds[0]!;
        const style = EVIDENCE_STYLES[kind];
        const highlighted =
          selectedId !== null &&
          (edge.source === selectedId || edge.target === selectedId);
        const data: Partial<GraphEdgeData> = {
          route: null,
          color: style.color,
          dash: style.dash,
          label: edge.label,
          flow: kind === "observed" || kind === "configured",
        };
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "relationship",
          data: data as GraphEdgeData,
          zIndex: highlighted ? 3 : 2,
          className: highlighted ? "graph-hl" : undefined,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: style.color,
            width: 14,
            height: 14,
          },
        } satisfies Edge;
      }),
    [selectedId],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={graphNodeTypes}
      edgeTypes={graphEdgeTypes}
      fitView
      fitViewOptions={{ padding: 0.08 }}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      onNodeClick={(_, clicked) =>
        onSelect(
          clicked.id === "vpc" || clicked.id === "internet" ? null : clicked.id,
        )
      }
      onPaneClick={() => onSelect(null)}
      className="infrastructure-graph"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="var(--grid-dot)"
      />
    </ReactFlow>
  );
}

export function InfrastructureView({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const inspected = selectedId ? demoResourceDetail(selectedId) : null;

  return (
    <div className="flex flex-col gap-6">
      <ProductHeader
        name="Infrastructure"
        active="Graph"
        tabs={["Graph", "Resources"]}
      />
      <div className="flex flex-wrap items-center gap-2">
        {[
          ["Connection", "Amazon Web Services · AWS Production"],
          ["Account", "Production (111122223333)"],
          ["Region", "All regions"],
        ].map(([label, value]) => (
          <span
            key={label}
            className="border-border-soft bg-dashboard-panel-strong/80 relative flex h-9 items-center gap-2 rounded-xl border pr-8 pl-3 text-xs shadow-[0_8px_22px_var(--shadow-card)]"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-medium">{value}</span>
            <ChevronDown
              size={14}
              className="text-muted-foreground absolute right-2.5"
            />
          </span>
        ))}
        <span className="text-muted-foreground ml-auto text-[11px]">
          Relationships resolved Oct 17, 2026, 7:54 AM
        </span>
      </div>

      <div className="border-border-soft bg-dashboard-panel/60 relative h-[440px] overflow-hidden rounded-[1.6rem] border shadow-[0_18px_48px_var(--shadow-card)]">
        <div
          data-lod="near"
          className="graph-workspace relative h-full w-full overflow-hidden"
        >
          <ReactFlowProvider>
            <GraphCanvas selectedId={selectedId} onSelect={onSelect} />
          </ReactFlowProvider>

          <div
            className="pointer-events-none absolute top-3 left-3 z-10 flex flex-wrap items-start gap-2"
            style={{
              right: inspected
                ? "calc(min(26rem, calc(100% - 1.5rem)) + 1.5rem)"
                : "0.75rem",
            }}
          >
            <div className="pointer-events-auto relative w-full max-w-xs">
              <Search
                size={14}
                className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
              />
              <span className="border-border-soft bg-card-strong text-muted-foreground flex h-9 w-full items-center rounded-xl border pl-8 text-sm shadow-[0_6px_20px_var(--shadow-card)]">
                Search resources, types, regions…
              </span>
            </div>
            <div className={cn(panel, "flex p-1")}>
              {["Provisioned", "Runtime"].map((label, index) => (
                <span
                  key={label}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-semibold",
                    index === 0
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className={cn(panel, "flex p-1")}>
              {["Architecture", "Network", "Security"].map((label, index) => (
                <span
                  key={label}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium",
                    index === 0
                      ? "bg-accent/12 text-accent"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
            <div
              className={cn(
                panel,
                "text-muted-foreground ml-auto flex items-center gap-0.5 p-0.5",
              )}
            >
              {[Minus, null, Plus, Maximize, RotateCcw].map((Icon, index) =>
                Icon ? (
                  <span
                    key={index}
                    className="flex size-8 items-center justify-center"
                  >
                    <Icon size={14} />
                  </span>
                ) : (
                  <span
                    key={index}
                    className="w-10 text-center font-mono text-[11px]"
                  >
                    100%
                  </span>
                ),
              )}
              <span className="bg-border-soft mx-0.5 h-5 w-px" />
              {[ChevronsUpDown, ChevronsDownUp, Filter].map((Icon, index) => (
                <span
                  key={index}
                  className="flex size-8 items-center justify-center"
                >
                  <Icon size={14} />
                </span>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 z-10">
            <div className={cn(panel, "px-3 py-2")}>
              <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {(
                  Object.keys(
                    EVIDENCE_STYLES,
                  ) as (keyof typeof EVIDENCE_STYLES)[]
                ).map((kind) => (
                  <li
                    key={kind}
                    className="flex items-center gap-1.5 text-[11px]"
                  >
                    <svg width="20" height="6" aria-hidden="true">
                      <line
                        x1="0"
                        y1="3"
                        x2="20"
                        y2="3"
                        stroke={EVIDENCE_STYLES[kind].color}
                        strokeWidth="2"
                        strokeDasharray={EVIDENCE_STYLES[kind].dash}
                      />
                    </svg>
                    {EVIDENCE_STYLES[kind].label}
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-1 text-[10px]">
                Click a resource to see what it connects to and why
              </p>
            </div>
          </div>

          {inspected ? (
            <ResourceInspector
              key={selectedId}
              detail={inspected.detail}
              neighborhood={{
                resource: inspected.detail.node,
                edges: inspected.edges,
                peers: inspected.peers,
                total_edges: inspected.edges.length,
              }}
              external={null}
              onClose={() => onSelect(null)}
              onSelectResource={(id) => onSelect(id)}
              onSelectRelationship={() => undefined}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Sync ────────────────────────────────────────────────────────────────────

const SYNC_GRID =
  "md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_5.5rem]";

export function SyncView() {
  const [openName, setOpenName] = useState<string | null>("AWS Production");
  const rows = [
    {
      name: "AWS Production",
      synced: "Oct 17, 07:58 AM",
      healthy: "5 / 5",
      state: <StatePill tone="success">Healthy</StatePill>,
    },
    {
      name: "AWS Shared services",
      synced: "Oct 17, 07:41 AM",
      healthy: "5 / 5",
      state: (
        <StatePill tone="accent" spinning>
          Syncing
        </StatePill>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Manage"
        title="Sync"
        description="Every cloud connection's data sync in one place — what is running, what is healthy, and what needs attention."
      />
      <ExpandableTable
        label="Connections"
        columns={["Connection", "Last synced", "Datasets", "Status"]}
        gridClassName={SYNC_GRID}
      >
        {rows.map((row) => {
          const open = openName === row.name;
          return (
            <ExpandableRow
              key={row.name}
              id={row.name}
              label={row.name}
              open={open}
              onToggle={() => setOpenName(open ? null : row.name)}
              gridClassName={SYNC_GRID}
              title={
                <>
                  <span className="block text-sm font-semibold">
                    {row.name}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    <RowTag>Amazon Web Services</RowTag>
                    <RowTag tone="success">connected</RowTag>
                  </span>
                </>
              }
              cells={[
                <div key="synced" className="text-xs">
                  <span className="text-muted-foreground block">
                    Last synced
                  </span>
                  <span className="block text-sm font-medium">
                    {row.synced}
                  </span>
                </div>,
                <div key="datasets" className="text-xs">
                  <span className="text-muted-foreground block">
                    Datasets healthy
                  </span>
                  <span className="text-accent block font-mono text-xl font-semibold">
                    {row.healthy}
                  </span>
                </div>,
                <span key="state">{row.state}</span>,
                <div
                  key="actions"
                  className="flex items-center justify-end gap-1"
                >
                  <button
                    type="button"
                    onClick={() => setOpenName(open ? null : row.name)}
                    className="text-accent px-2 py-1 text-xs font-medium hover:underline"
                  >
                    {open ? "Close" : "Details"}
                  </button>
                  <RowMenu label={`More actions for ${row.name}`} items={[]} />
                </div>,
              ]}
            >
              <div className="mb-3 flex justify-end">
                <span className="text-accent inline-flex items-center gap-1 text-xs">
                  Open connection <ArrowUpRight size={12} aria-hidden />
                </span>
              </div>
              <div className="flex flex-col gap-4">
                <section className="border-border-soft bg-card-strong/55 rounded-xl border p-4 shadow-[0_10px_30px_var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="bg-accent/10 text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                        <HeartPulse size={17} />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold">
                          Dataset sync health
                        </h3>
                        <p className="text-muted-foreground mt-0.5 text-xs leading-5">
                          Freshness and reliability for each enabled dataset,
                          independent of connection verification.
                        </p>
                      </div>
                    </div>
                    <span className="border-foreground/15 bg-background/70 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium">
                      <RefreshCw size={13} />
                      Refresh
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {demoDatasets.map((entry) => (
                      <article
                        key={entry.key}
                        className="border-border-soft bg-background/45 rounded-xl border p-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {entry.name}
                            </p>
                            <p className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]">
                              {entry.key}
                            </p>
                          </div>
                          <StatusBadge status="success">Healthy</StatusBadge>
                        </div>
                        <dl className="border-border-soft mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                          <div>
                            <dt className="text-muted-foreground">
                              Last successful
                            </dt>
                            <dd className="mt-1 font-medium">
                              {entry.lastSuccessful}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Schedule</dt>
                            <dd className="mt-1 font-medium">
                              {entry.schedule}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                </section>
                <div className="border-border-soft bg-card-strong/55 flex flex-col justify-between gap-4 rounded-xl border px-4 py-3.5 shadow-[0_10px_30px_var(--shadow-card)] sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="bg-success/10 text-success flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                      <CalendarClock size={17} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="text-sm font-semibold">
                          Automatic sync
                        </h3>
                        <span className="bg-success h-1.5 w-1.5 rounded-full" />
                        <span className="text-muted-foreground text-xs">
                          5 of 5 schedules enabled
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Each dataset refreshes on its own schedule.
                      </p>
                    </div>
                  </div>
                  <span className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-xs font-medium sm:self-auto">
                    <RefreshCw size={13} /> Sync now
                  </span>
                </div>
              </div>
            </ExpandableRow>
          );
        })}
      </ExpandableTable>
    </div>
  );
}
