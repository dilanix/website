"use client";

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BellRing,
  Building2,
  ChevronDown,
  CircleDollarSign,
  Cloud,
  Database,
  Globe,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  Network,
  Plug,
  RefreshCw,
  Server,
  Settings,
  Sun,
  TrendingDown,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  demoCostByService,
  demoDatasets,
  demoRecommendations,
  demoSpendTrend,
  formatUsd,
} from "@/components/product/demo-data";
import { cn } from "@/lib/utils";

type DemoView = "cost" | "recommendations" | "infrastructure" | "sync";

const AUTOPLAY_MS = 7000;

const tabs: {
  id: DemoView;
  label: string;
  section: string;
  icon: LucideIcon;
  story: string;
}[] = [
  {
    id: "cost",
    label: "Cost",
    section: "Products",
    icon: CircleDollarSign,
    story: "See where the money goes — effective cost from your FOCUS bill.",
  },
  {
    id: "recommendations",
    label: "Recommendations",
    section: "Workspace",
    icon: Lightbulb,
    story: "Act on ranked, reviewed savings with verified How to fix steps.",
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    section: "Products",
    icon: Network,
    story: "Understand what depends on what, with the evidence for every link.",
  },
  {
    id: "sync",
    label: "Sync",
    section: "Manage",
    icon: RefreshCw,
    story: "Know your data is fresh — every dataset on its own schedule.",
  },
];

const idleItems: { label: string; icon: LucideIcon }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Integrations", icon: Plug },
  { label: "Notifications", icon: BellRing },
  { label: "API Keys", icon: KeyRound },
  { label: "Settings", icon: Settings },
];

function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-border-soft bg-dashboard-panel rounded-[1.1rem] border p-3.5 shadow-[0_12px_30px_var(--shadow-card)] sm:p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "accent";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[8.5px] font-semibold whitespace-nowrap",
        tone === "success" && "border-success/25 bg-success/10 text-success",
        tone === "warning" &&
          "border-amber-500/25 bg-amber-500/10 text-amber-500",
        tone === "accent" && "border-accent/25 bg-accent/10 text-accent",
      )}
    >
      <span
        className={cn(
          "size-1 rounded-full",
          tone === "success" && "bg-success",
          tone === "warning" && "bg-amber-500",
          tone === "accent" && "bg-accent",
        )}
      />
      {children}
    </span>
  );
}

function CostPanel() {
  const total = demoCostByService.reduce(
    (sum, item) => sum + item.amountUsd,
    0,
  );
  const max = Math.max(...demoCostByService.map((item) => item.amountUsd));
  const trendMax = Math.max(...demoSpendTrend);
  const trendMin = Math.min(...demoSpendTrend);
  const range = trendMax - trendMin || 1;
  const points = demoSpendTrend
    .map((value, index) => {
      const x = (index / (demoSpendTrend.length - 1)) * 560;
      const y = 130 - ((value - trendMin) / range) * 95;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const ready = demoRecommendations
    .filter((item) => item.status === "ready")
    .reduce((sum, item) => sum + item.savingUsd, 0);

  const kpis = [
    {
      label: "Month to date",
      value: formatUsd(total),
      detail: "−6.4% vs previous period",
      positive: true,
    },
    {
      label: "Budget · USD",
      value: "On track",
      detail: "$79,800 projected of $85,000",
    },
    {
      label: "Ready to fix",
      value: formatUsd(ready),
      detail: "per month · 3 recommendations",
      positive: true,
    },
    { label: "Anomalies", value: "0 open", detail: "Checked daily" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {["Summary", "Services", "Resources", "Trends"].map((tab, index) => (
          <span
            key={tab}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[9px] font-semibold",
              index === 0
                ? "bg-accent/12 text-accent"
                : "text-muted-foreground",
            )}
          >
            {tab}
          </span>
        ))}
        <span className="border-border-soft text-muted-foreground ml-auto rounded-full border px-2 py-0.5 text-[8.5px]">
          ● FOCUS 1.2 · effective cost
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Panel key={kpi.label} className="p-3 sm:p-3">
            <p className="text-muted-foreground text-[7.5px] font-semibold tracking-wide uppercase">
              {kpi.label}
            </p>
            <p
              className={cn(
                "mt-2 font-mono text-[15px] font-semibold tracking-tight",
                kpi.positive && "text-success",
              )}
            >
              {kpi.value}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[8px]">
              {kpi.detail}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold">Daily spend</p>
              <p className="text-muted-foreground mt-0.5 text-[8px]">
                Last 14 days · all accounts
              </p>
            </div>
            <span className="text-success bg-success/8 flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-semibold">
              <TrendingDown size={10} /> 6.4%
            </span>
          </div>
          <svg
            viewBox="0 0 560 150"
            preserveAspectRatio="none"
            className="mt-3 h-28 w-full overflow-visible"
            aria-label="Sample 14-day spend trend"
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
              points={`0,145 ${points} 560,145`}
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
        </Panel>

        <Panel>
          <p className="text-[10px] font-semibold">Cost by service</p>
          <div className="mt-3 space-y-2.5">
            {demoCostByService.map((item, index) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-[9px]">
                  <span className="truncate font-medium">{item.label}</span>
                  <span className="font-mono">{formatUsd(item.amountUsd)}</span>
                </div>
                <div className="bg-foreground/[0.055] h-1.5 overflow-hidden rounded-full">
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
        </Panel>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Panel>
          <p className="text-[10px] font-semibold">Allocations · by team</p>
          <div className="bg-foreground/[0.055] mt-3 flex h-2.5 overflow-hidden rounded-full">
            {demoAllocations.map((team) => (
              <span
                key={team.label}
                className={cn("h-full", team.className)}
                style={{ width: `${team.share}%` }}
              />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {demoAllocations.map((team) => (
              <span
                key={team.label}
                className="text-muted-foreground flex items-center gap-1.5 text-[8.5px]"
              >
                <span className={cn("size-1.5 rounded-full", team.className)} />
                {team.label} · {team.share}%
              </span>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold">Budget pacing · USD</p>
            <StatusPill tone="success">On track</StatusPill>
          </div>
          <div className="bg-foreground/[0.055] relative mt-3 h-2.5 overflow-hidden rounded-full">
            <div
              className="bg-success h-full origin-left animate-[demo-bar_.8s_ease-out_both] rounded-full motion-reduce:animate-none"
              style={{ width: "51%" }}
            />
            <span
              className="bg-foreground/50 absolute inset-y-0 w-px"
              style={{ left: "94%" }}
            />
          </div>
          <p className="text-muted-foreground mt-2.5 text-[8.5px]">
            $43,420 spent · $79,800 projected · $85,000 budget
          </p>
        </Panel>
      </div>
    </div>
  );
}

const demoAllocations = [
  { label: "Platform", share: 46, className: "bg-accent" },
  { label: "Data", share: 31, className: "bg-accent-secondary" },
  { label: "Web", share: 17, className: "bg-success" },
  { label: "Unallocated", share: 6, className: "bg-muted-foreground/50" },
];

const fixTabs = ["AWS Console", "Terraform", "AWS CLI"] as const;
type FixTab = (typeof fixTabs)[number];

function RecommendationsPanel() {
  const [fixTab, setFixTab] = useState<FixTab>("AWS CLI");
  const top = demoRecommendations[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <p className="text-[10px]">
          <span className="text-accent font-mono text-base font-semibold">
            11
          </span>{" "}
          recommendations
        </p>
        <p className="text-[10px]">
          <span className="font-mono text-base font-semibold text-amber-500">
            1
          </span>{" "}
          needs your input
        </p>
        <p className="text-[10px]">
          <span className="text-success font-mono text-base font-semibold">
            7
          </span>{" "}
          ready to fix
        </p>
      </div>

      <div className="border-border-soft bg-dashboard-panel overflow-hidden rounded-[1.1rem] border shadow-[0_12px_30px_var(--shadow-card)]">
        <div className="text-muted-foreground border-border-soft hidden grid-cols-[minmax(0,1fr)_7rem_5.5rem_6rem] gap-3 border-b px-4 py-2 text-[8px] font-semibold md:grid">
          <span>Recommendation</span>
          <span>Resource</span>
          <span>Savings / mo</span>
          <span>Status</span>
        </div>
        {demoRecommendations.map((item, index) => {
          const open = index === 0;
          return (
            <div
              key={item.rank}
              className={cn(
                "border-border-soft border-b last:border-b-0",
                open && "bg-accent/[0.04]",
              )}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 md:grid-cols-[minmax(0,1fr)_7rem_5.5rem_6rem]">
                <div className="flex min-w-0 items-center gap-2">
                  <ChevronDown
                    size={12}
                    className={cn(
                      "text-muted-foreground shrink-0 transition-transform",
                      !open && "-rotate-90",
                    )}
                  />
                  <span className="bg-accent/15 text-accent rounded px-1 font-mono text-[8.5px] font-semibold">
                    #{item.rank}
                  </span>
                  <span className="truncate text-[10px] font-semibold">
                    {item.title}
                  </span>
                </div>
                <span className="text-muted-foreground hidden truncate text-[9px] md:block">
                  {item.resource}
                </span>
                <span className="text-success font-mono text-[10px] font-semibold">
                  {formatUsd(item.savingUsd)}
                </span>
                <span className="hidden md:block">
                  {item.status === "ready" ? (
                    <StatusPill tone="success">Ready to fix</StatusPill>
                  ) : (
                    <StatusPill tone="warning">Needs your input</StatusPill>
                  )}
                </span>
              </div>

              {open ? (
                <div className="grid gap-3 px-4 pb-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="text-[9px] leading-4">
                    <p className="font-semibold">Why this matters</p>
                    <p className="text-muted-foreground mt-1">
                      {top.resource} peaked at 31% CPU and 42% memory over 14
                      days. One size down keeps headroom above the observed peak
                      and halves the instance price.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <StatusPill tone="success">high confidence</StatusPill>
                      <StatusPill tone="accent">low effort</StatusPill>
                    </div>
                    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-2.5">
                      <p className="flex items-center gap-1.5 font-semibold text-amber-500">
                        <AlertTriangle size={11} /> Before you continue
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Schedule the change in a maintenance window — the
                        instance restarts while its class changes.
                      </p>
                    </div>
                  </div>

                  <div className="border-border-soft overflow-hidden rounded-xl border bg-[#060b16] text-[#d7e3f4]">
                    <div
                      role="tablist"
                      aria-label="How to fix"
                      className="flex border-b border-white/8"
                    >
                      {fixTabs.map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          role="tab"
                          aria-selected={fixTab === tab}
                          onClick={() => setFixTab(tab)}
                          className={cn(
                            "px-3 py-1.5 text-[8.5px] font-semibold transition-colors",
                            fixTab === tab
                              ? "border-b border-emerald-300 text-white"
                              : "text-white/50 hover:text-white/80",
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="min-h-[6.5rem] px-3 py-2.5 font-mono text-[9px] leading-[1.6]">
                      {fixTab === "AWS CLI" ? (
                        <p className="break-all">
                          <span className="text-emerald-300">$ </span>
                          {top.command}
                        </p>
                      ) : fixTab === "Terraform" ? (
                        <pre className="whitespace-pre-wrap">
                          {`resource "aws_db_instance" "orders" {
  # Generic example — match it to your code
  instance_class = "db.r6g.xlarge"
}`}
                        </pre>
                      ) : (
                        <ol className="list-decimal space-y-0.5 pl-4 font-sans">
                          <li>Open RDS → Databases → {top.resource}</li>
                          <li>Choose Modify → DB instance class</li>
                          <li>Select db.r6g.xlarge</li>
                          <li>Apply in the next maintenance window</li>
                        </ol>
                      )}
                    </div>
                    <p className="flex items-center gap-1 border-t border-white/8 px-3 py-1.5 text-[8px] text-emerald-300">
                      <BadgeCheck size={10} />
                      {fixTab === "Terraform"
                        ? "Checked against the AWS provider docs"
                        : fixTab === "AWS CLI"
                          ? `Verified against ${top.verifiedAgainst}`
                          : "Steps for your resource and region"}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  icon: LucideIcon;
  x: number;
  y: number;
  cost: string;
  links: string[];
}

const graphNodes: GraphNode[] = [
  {
    id: "internet",
    label: "Internet",
    type: "External traffic",
    icon: Globe,
    x: 50,
    y: 130,
    cost: "—",
    links: ["web-alb · Observed in ALB access logs"],
  },
  {
    id: "alb",
    label: "web-alb",
    type: "Application Load Balancer",
    icon: Network,
    x: 175,
    y: 130,
    cost: "$212 / mo",
    links: [
      "orders-api · Configured target group",
      "orders-api · Observed in ALB access logs",
    ],
  },
  {
    id: "api",
    label: "orders-api",
    type: "ECS service · Fargate",
    icon: Server,
    x: 315,
    y: 75,
    cost: "$1,480 / mo",
    links: [
      "orders-db · Observed in VPC flow logs (5432)",
      "sessions · Observed in VPC flow logs (6379)",
    ],
  },
  {
    id: "worker",
    label: "billing-worker",
    type: "ECS service · Fargate",
    icon: Zap,
    x: 315,
    y: 190,
    cost: "$640 / mo",
    links: [
      "orders-db · Observed in VPC flow logs (5432)",
      "invoices · Allowed by IAM policy",
    ],
  },
  {
    id: "db",
    label: "orders-db",
    type: "RDS · PostgreSQL",
    icon: Database,
    x: 470,
    y: 55,
    cost: "$3,690 / mo",
    links: ["Used by orders-api and billing-worker"],
  },
  {
    id: "cache",
    label: "sessions",
    type: "ElastiCache · Valkey",
    icon: Database,
    x: 470,
    y: 135,
    cost: "$410 / mo",
    links: ["Used by orders-api"],
  },
  {
    id: "bucket",
    label: "invoices",
    type: "S3 bucket",
    icon: HardDrive,
    x: 470,
    y: 215,
    cost: "$96 / mo",
    links: ["Written by billing-worker"],
  },
];

const graphEdges: [string, string, "observed" | "configured"][] = [
  ["internet", "alb", "observed"],
  ["alb", "api", "observed"],
  ["api", "db", "observed"],
  ["api", "cache", "observed"],
  ["worker", "db", "observed"],
  ["worker", "bucket", "configured"],
];

function InfrastructurePanel() {
  const [selectedId, setSelectedId] = useState("api");
  const selected =
    graphNodes.find((node) => node.id === selectedId) ?? graphNodes[0];
  const byId = Object.fromEntries(graphNodes.map((node) => [node.id, node]));

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(12rem,0.6fr)]">
      <Panel className="p-2 sm:p-2">
        <div className="relative aspect-[560/260] w-full">
          <svg
            viewBox="0 0 560 260"
            className="absolute inset-0 size-full"
            aria-hidden="true"
          >
            {graphEdges.map(([from, to, kind]) => {
              const a = byId[from];
              const b = byId[to];
              const active = from === selectedId || to === selectedId;
              return (
                <g key={`${from}-${to}`}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={
                      kind === "observed"
                        ? "var(--accent)"
                        : "var(--muted-foreground)"
                    }
                    strokeOpacity={active ? 0.45 : 0.18}
                    strokeWidth={1.4}
                    strokeDasharray={kind === "configured" ? "4 4" : undefined}
                  />
                  {kind === "observed" ? (
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="var(--accent)"
                      strokeOpacity={active ? 1 : 0.45}
                      strokeDasharray="6 11"
                      className="graph-edge-flow"
                    />
                  ) : null}
                </g>
              );
            })}
          </svg>
          {graphNodes.map((node) => {
            const Icon = node.icon;
            const active = node.id === selectedId;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedId(node.id)}
                onMouseEnter={() => setSelectedId(node.id)}
                aria-pressed={active}
                className={cn(
                  "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-lg border px-1.5 py-1 text-[8.5px] font-semibold whitespace-nowrap transition-all sm:px-2",
                  active
                    ? "border-accent/60 bg-dashboard-panel-strong text-foreground shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_14%,transparent)]"
                    : "border-border-soft bg-dashboard-panel text-muted-foreground hover:text-foreground",
                )}
                style={{
                  left: `${(node.x / 560) * 100}%`,
                  top: `${(node.y / 260) * 100}%`,
                }}
              >
                <Icon
                  size={11}
                  className={active ? "text-accent" : undefined}
                  aria-hidden
                />
                <span className="hidden sm:inline">{node.label}</span>
              </button>
            );
          })}
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 px-2 pb-1 text-[8px]">
          <span className="flex items-center gap-1.5">
            <span className="bg-accent h-px w-4" /> Observed traffic
          </span>
          <span className="flex items-center gap-1.5">
            <span className="border-muted-foreground w-4 border-t border-dashed" />{" "}
            Configured access
          </span>
        </div>
      </Panel>

      <Panel key={selected.id} className="animate-[demo-panel-in_.3s_ease-out]">
        <p className="text-muted-foreground text-[7.5px] font-semibold tracking-wide uppercase">
          {selected.type}
        </p>
        <p className="mt-1 text-xs font-semibold">{selected.label}</p>
        <p className="text-muted-foreground mt-2 text-[8px]">Monthly cost</p>
        <p className="font-mono text-sm font-semibold">{selected.cost}</p>
        <p className="text-muted-foreground border-border-soft mt-3 border-t pt-2 text-[8px] font-semibold tracking-wide uppercase">
          Evidence
        </p>
        <ul className="mt-1.5 space-y-1.5">
          {selected.links.map((link) => (
            <li key={link} className="flex gap-1.5 text-[9px] leading-4">
              <BadgeCheck size={11} className="text-accent mt-0.5 shrink-0" />
              {link}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid grid-cols-3 gap-2.5 lg:col-span-2">
        {[
          { label: "Resources", value: "248", detail: "across 3 accounts" },
          { label: "Connections", value: "61", detail: "with evidence" },
          {
            label: "Evidence sources",
            value: "5",
            detail: "config, IAM, logs, traces",
          },
        ].map((stat) => (
          <Panel key={stat.label} className="p-3 sm:p-3">
            <p className="text-muted-foreground text-[7.5px] font-semibold tracking-wide uppercase">
              {stat.label}
            </p>
            <p className="mt-1.5 font-mono text-[15px] font-semibold">
              {stat.value}
            </p>
            <p className="text-muted-foreground text-[8px]">{stat.detail}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function SyncPanel() {
  return (
    <div className="space-y-3">
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/10 text-orange-400">
            <Cloud size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold">AWS · Northwind</p>
            <p className="text-muted-foreground text-[8.5px]">
              3 accounts: Production, Staging, Shared services
            </p>
          </div>
          <StatusPill tone="accent">Syncing</StatusPill>
          <span className="border-border-soft text-muted-foreground hidden rounded-lg border px-2 py-1 text-[8.5px] font-semibold sm:inline">
            Sync now
          </span>
        </div>
      </Panel>

      <div className="border-border-soft bg-dashboard-panel overflow-hidden rounded-[1.1rem] border shadow-[0_12px_30px_var(--shadow-card)]">
        <div className="text-muted-foreground border-border-soft grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b px-4 py-2 text-[8px] font-semibold sm:grid-cols-[minmax(0,1fr)_8rem_5rem_6rem]">
          <span>Dataset</span>
          <span className="hidden sm:block">Source</span>
          <span className="hidden sm:block">Last sync</span>
          <span>Status</span>
        </div>
        {demoDatasets.map((dataset, index) => (
          <div
            key={dataset.name}
            className="border-border-soft grid animate-[demo-panel-in_.4s_ease-out_both] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_8rem_5rem_6rem]"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <span className="truncate text-[10px] font-semibold">
              {dataset.name}
            </span>
            <span className="text-muted-foreground hidden truncate text-[9px] sm:block">
              {dataset.source}
            </span>
            <span className="text-muted-foreground hidden text-[9px] sm:block">
              {dataset.lastSync}
            </span>
            <span>
              {dataset.status === "syncing" ? (
                <span className="text-accent inline-flex items-center gap-1 text-[8.5px] font-semibold">
                  <RefreshCw
                    size={10}
                    className="animate-spin-slow motion-reduce:animate-none"
                  />
                  Syncing
                </span>
              ) : (
                <StatusPill tone="success">Healthy</StatusPill>
              )}
            </span>
          </div>
        ))}
      </div>

      <Panel>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold">Recent runs</p>
          <span className="text-muted-foreground text-[8.5px]">
            Last 24 hours
          </span>
        </div>
        <div className="mt-3 flex h-8 items-end gap-1">
          {demoRuns.map((height, index) => (
            <span
              key={index}
              className={cn(
                "flex-1 origin-bottom animate-[demo-panel-in_.4s_ease-out_both] rounded-sm",
                index === demoRuns.length - 1 ? "bg-accent" : "bg-success/70",
              )}
              style={{
                height: `${height}%`,
                animationDelay: `${index * 25}ms`,
              }}
            />
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-[8.5px]">
          24 runs · 23 succeeded · 1 running
        </p>
      </Panel>
    </div>
  );
}

const demoRuns = [
  55, 70, 48, 62, 80, 52, 66, 58, 74, 49, 63, 71, 57, 68, 50, 76, 61, 54, 69,
  59, 72, 47, 65, 40,
];

export function GuidedDashboardDemo() {
  const [activeView, setActiveView] = useState<DemoView>("cost");
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
    }, AUTOPLAY_MS);
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

  const active = tabs.find((tab) => tab.id === activeView) ?? tabs[0];
  const progress = autoplay && !paused && !reducedMotion;

  function navButton(tab: (typeof tabs)[number]) {
    const Icon = tab.icon;
    const current = activeView === tab.id;
    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => selectView(tab.id)}
        aria-current={current ? "page" : undefined}
        className={cn(
          "relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg border px-2.5 py-2 text-left text-[10.5px] font-medium transition-colors",
          current
            ? "border-border-soft bg-dashboard-panel-strong text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground border-transparent",
        )}
      >
        {current ? (
          <span className="bg-accent absolute top-1/2 left-0 h-3.5 w-0.5 -translate-y-1/2 rounded-r-full" />
        ) : null}
        <Icon
          size={13}
          className={current ? "text-accent" : "text-muted-foreground/70"}
        />
        <span className="truncate">{tab.label}</span>
        {current && progress ? (
          <span
            key={activeView}
            className="bg-accent absolute inset-x-2 bottom-0.5 h-px origin-left animate-[demo-progress_7s_linear]"
          />
        ) : null}
      </button>
    );
  }

  function idle(label: string, Icon: LucideIcon) {
    return (
      <span
        key={label}
        className="text-muted-foreground/50 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[10.5px] font-medium"
      >
        <Icon size={13} />
        <span className="truncate">{label}</span>
      </span>
    );
  }

  const byId = Object.fromEntries(tabs.map((tab) => [tab.id, tab]));

  return (
    <div
      className="border-border-soft bg-card-strong/82 relative overflow-hidden rounded-[1.65rem] border p-2 shadow-[0_34px_90px_var(--shadow-brand)] backdrop-blur-xl sm:p-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="border-border-soft bg-background/55 overflow-hidden rounded-[1.25rem] border">
        <div className="flex min-h-[34rem]">
          <aside className="border-border-soft bg-dashboard-sidebar/95 hidden w-52 shrink-0 flex-col border-r p-3.5 md:flex">
            <div className="flex items-center justify-between px-0.5">
              <span className="flex items-center gap-2">
                <span className="from-accent to-accent-secondary text-accent-foreground flex size-7 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-bold shadow-[0_8px_20px_var(--shadow-brand)]">
                  D
                </span>
                <span className="text-[11px] font-semibold tracking-tight">
                  Dilanix
                </span>
              </span>
              <span className="border-accent/15 bg-accent/8 text-accent shrink-0 rounded-full border px-1.5 py-0.5 text-[6.5px] font-semibold tracking-wide uppercase">
                Sample data
              </span>
            </div>

            <div className="border-border-soft bg-dashboard-panel mt-4 flex items-center gap-2.5 rounded-xl border p-2.5">
              <span className="border-accent/15 bg-accent/10 text-accent flex size-7 shrink-0 items-center justify-center rounded-lg border">
                <Building2 size={13} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-[6.5px] font-semibold tracking-[0.14em] uppercase">
                  Active workspace
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-semibold">
                  Northwind
                </span>
              </span>
              <span className="bg-success size-1.5 shrink-0 rounded-full shadow-[0_0_6px_var(--success)]" />
            </div>

            <nav aria-label="Sample product navigation" className="mt-5 flex-1">
              <p className="text-muted-foreground mb-1.5 px-1.5 text-[7.5px] font-semibold tracking-[0.14em] uppercase">
                Workspace
              </p>
              <div className="flex flex-col gap-1">
                {idle(idleItems[0].label, idleItems[0].icon)}
                {navButton(byId.recommendations)}
              </div>
              <p className="text-muted-foreground mt-4 mb-1.5 px-1.5 text-[7.5px] font-semibold tracking-[0.14em] uppercase">
                Products
              </p>
              <div className="flex flex-col gap-1">
                {navButton(byId.cost)}
                {navButton(byId.infrastructure)}
              </div>
              <p className="text-muted-foreground mt-4 mb-1.5 px-1.5 text-[7.5px] font-semibold tracking-[0.14em] uppercase">
                Manage
              </p>
              <div className="flex flex-col gap-1">
                {idle(idleItems[1].label, idleItems[1].icon)}
                {navButton(byId.sync)}
                {idleItems.slice(2).map((item) => idle(item.label, item.icon))}
              </div>
            </nav>

            <div className="border-border-soft mt-3 flex items-center gap-2.5 border-t pt-3">
              <span className="from-accent/18 to-accent-secondary/18 text-accent flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[9px] font-semibold">
                JD
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-semibold">
                  Jordan Diaz
                </span>
                <span className="text-muted-foreground block truncate text-[8px]">
                  Platform lead
                </span>
              </span>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="border-border-soft bg-dashboard-header/90 flex min-h-12 items-center justify-between gap-3 border-b px-3 py-2 sm:px-5">
              <div className="min-w-0">
                <p className="text-muted-foreground text-[7px] font-semibold tracking-[0.14em] uppercase">
                  {active.section}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-semibold tracking-tight">
                  {active.label}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="border-border-soft bg-dashboard-panel text-muted-foreground hidden size-7 items-center justify-center rounded-lg border sm:flex">
                  <Sun size={12} />
                </span>
                <span className="border-border-soft bg-dashboard-panel text-muted-foreground flex size-7 items-center justify-center rounded-lg border">
                  <BellRing size={12} />
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-5">
              <div
                role="tablist"
                aria-label="Product tour views"
                className="border-border-soft bg-foreground/[0.025] grid grid-cols-2 gap-1 rounded-xl border p-1 md:hidden"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const current = activeView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`demo-tab-${tab.id}`}
                      type="button"
                      role="tab"
                      aria-selected={current}
                      aria-controls="guided-demo-panel"
                      tabIndex={current ? 0 : -1}
                      onClick={() => selectView(tab.id)}
                      onKeyDown={handleTabKeyDown}
                      className={cn(
                        "relative flex min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-lg px-2 py-2 text-[9px] font-semibold transition-all",
                        current
                          ? "border-border-soft bg-card-strong text-foreground border shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon size={12} />
                      <span className="truncate">{tab.label}</span>
                      {current && progress ? (
                        <span
                          key={activeView}
                          className="bg-accent absolute inset-x-1 bottom-0 h-px origin-left animate-[demo-progress_7s_linear]"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <p className="text-muted-foreground mt-3 mb-3 text-[10px] md:mt-0">
                {active.story}
              </p>

              <div
                key={activeView}
                id="guided-demo-panel"
                role="tabpanel"
                aria-labelledby={`demo-tab-${activeView}`}
                className="animate-[demo-panel-in_.35s_ease-out] motion-reduce:animate-none"
              >
                {activeView === "cost" ? (
                  <CostPanel />
                ) : activeView === "recommendations" ? (
                  <RecommendationsPanel />
                ) : activeView === "infrastructure" ? (
                  <InfrastructurePanel />
                ) : (
                  <SyncPanel />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
