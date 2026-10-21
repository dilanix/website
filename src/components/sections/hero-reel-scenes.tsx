"use client";

import Image from "next/image";
import type { ComponentType, ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  Boxes,
  Clock,
  Eye,
  KeyRound,
  Layers,
  Lightbulb,
  Lock,
  Receipt,
  ShieldCheck,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import { ResourceCategoryIcon } from "@/components/dashboard/resource-category-icon";
import { EVIDENCE_STYLES } from "@/components/dashboard/infrastructure/resource-visuals";
import {
  anim,
  At,
  Highlight,
  LineChart,
  Lines,
  MockBadge,
  MockButton,
  MockProgress,
  MockTabs,
  ProviderTile,
  Typing,
  Until,
} from "@/components/guides/scene-kit";
import { demoRecommendations, formatUsd } from "@/components/product/demo-data";
import { cn } from "@/lib/utils";

/** The reel's own canvas: taller than a guide's, to sit beside the hero. */
export const REEL_WIDTH = 720;
export const REEL_HEIGHT = 600;

const PANEL =
  "border-border-soft bg-card-strong/92 rounded-2xl border shadow-[0_18px_44px_var(--shadow-card)]";

/** A shot's title: its chapter, then two lines whose words land one by one —
 *  the second in the brand gradient. */
function Headline({
  chapter,
  lines,
  top = 36,
  center,
}: {
  chapter?: string;
  lines: readonly [string, string];
  top?: number;
  center?: boolean;
}) {
  const offset = lines[0].split(" ").length;
  return (
    <div
      className={cn("absolute inset-x-10", center && "text-center")}
      style={{ top }}
    >
      {chapter ? (
        <p
          className="text-accent text-[13px] font-semibold tracking-[0.22em] uppercase"
          style={anim("guide-fade-in", 0, 300)}
        >
          {chapter}
        </p>
      ) : null}
      <h3 className="mt-2.5 text-[40px] leading-[1.06] font-semibold tracking-[-0.045em]">
        {lines.map((line, lineIndex) => (
          <span key={lineIndex} className="block">
            {line.split(" ").map((word, wordIndex) => (
              <span
                key={wordIndex}
                className={cn(
                  "mr-[0.22em] inline-block",
                  lineIndex === 1 &&
                    "from-accent to-accent-secondary bg-gradient-to-r bg-clip-text text-transparent",
                )}
                style={anim(
                  "guide-appear-up",
                  80 + (lineIndex * offset + wordIndex) * 55,
                  420,
                )}
              >
                {word}
              </span>
            ))}
          </span>
        ))}
      </h3>
    </div>
  );
}

function Logo({ className }: { className: string }) {
  return (
    <>
      <Image
        src="/dilanix-logo.png"
        alt=""
        width={2172}
        height={724}
        className={cn(className, "dark:hidden")}
      />
      <Image
        src="/dilanix-logo-dark.png"
        alt=""
        width={2172}
        height={724}
        className={cn(className, "hidden dark:block")}
      />
    </>
  );
}

function IconTile({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: "accent" | "success" | "danger";
}) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        tone === "accent" && "bg-accent/12 text-accent",
        tone === "success" && "bg-success/12 text-success",
        tone === "danger" && "bg-red-500/12 text-red-500",
      )}
    >
      {children}
    </span>
  );
}

// ── 1. Your whole cloud ─────────────────────────────────────────────────────

const CLOUD = [
  { label: "EC2", category: "compute" },
  { label: "RDS", category: "database" },
  { label: "ECS", category: "container" },
  { label: "S3", category: "storage" },
  { label: "Lambda", category: "compute" },
  { label: "ALB", category: "network" },
  { label: "NAT Gateway", category: "network" },
  { label: "DynamoDB", category: "database" },
  { label: "ElastiCache", category: "cache" },
  { label: "EKS", category: "orchestration" },
] as const;
const CORE = { x: 360, y: 388 };

function IntroShot() {
  const chips = CLOUD.map((chip, index) => {
    const angle = (index / CLOUD.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...chip,
      x: CORE.x + Math.cos(angle) * 272,
      y: CORE.y + Math.sin(angle) * 166,
    };
  });
  return (
    <>
      <Headline
        chapter="Dilanix"
        lines={["Your whole cloud,", "finally explained."]}
      />
      <div
        aria-hidden
        className="guide-motion-only bg-accent/25 absolute size-56 rounded-full blur-3xl"
        style={{
          left: CORE.x - 112,
          top: CORE.y - 112,
          animation: "reel-glow 2400ms ease-in-out 600ms infinite both",
        }}
      />
      <Lines
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        flow
        paths={chips.map((chip, index) => ({
          d: `M ${chip.x} ${chip.y} L ${CORE.x} ${CORE.y}`,
          at: 850 + index * 35,
          duration: 420,
        }))}
      />
      {chips.map((chip, index) => (
        <At
          key={chip.label}
          x={chip.x - 63}
          y={chip.y - 18}
          w={126}
          from="scale"
          at={120 + index * 55}
          duration={380}
        >
          <span className="border-border-soft bg-card-strong text-foreground flex h-9 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-[12px] font-semibold shadow-[0_10px_24px_var(--shadow-card)]">
            <span className="text-accent">
              <ResourceCategoryIcon category={chip.category} size={13} />
            </span>
            {chip.label}
          </span>
        </At>
      ))}
      <At x={CORE.x - 125} y={CORE.y - 50} w={250} from="scale" at={620}>
        <div
          className={cn(
            PANEL,
            "border-accent/40 flex flex-col items-center gap-2 px-4 py-3.5 shadow-[0_24px_60px_var(--shadow-brand)]",
          )}
        >
          <Logo className="h-8 w-auto" />
          <span
            className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium"
            style={anim("guide-fade-in", 1250, 350)}
          >
            <span className="text-foreground font-semibold">1,284</span>
            resources
            <span className="bg-foreground/20 size-1 rounded-full" />
            <span className="text-foreground font-semibold">$84,120</span>
            this month
          </span>
        </div>
      </At>
    </>
  );
}

// ── 2. Connect ──────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { name: "production", id: "4821 7730 1192" },
  { name: "staging", id: "1937 5521 0846" },
  { name: "data", id: "7712 0094 3358" },
];

const CONNECT_FACTS = [
  {
    icon: KeyRound,
    title: "No access keys",
    text: "An IAM role only Dilanix can assume",
  },
  {
    icon: Eye,
    title: "Read-only",
    text: "It reads — it can never change anything",
  },
  {
    icon: Layers,
    title: "Every account",
    text: "Many AWS accounts on one connection",
  },
];

function ConnectShot() {
  return (
    <>
      <Headline
        chapter="Connect"
        lines={["Connect AWS once.", "Read-only. No keys."]}
      />
      <Lines
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        flow
        paths={[{ d: "M 292 300 L 428 300", at: 600, duration: 450 }]}
      />
      <At x={40} y={196} w={252} from="left" at={220}>
        <div className={cn(PANEL, "p-3.5")}>
          <div className="flex items-center gap-2.5">
            <ProviderTile code="AWS" />
            <div>
              <p className="text-sm font-semibold">Amazon Web Services</p>
              <p className="text-muted-foreground text-[11px]">3 accounts</p>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {ACCOUNTS.map((account, index) => (
              <div
                key={account.name}
                className="bg-foreground/[0.03] flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5"
              >
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold">
                    {account.name}
                  </span>
                  <span className="text-muted-foreground block font-mono text-[10px]">
                    {account.id}
                  </span>
                </span>
                <MockBadge
                  tone="success"
                  style={anim("guide-appear-scale", 1350 + index * 150, 300)}
                >
                  <BadgeCheck size={11} /> Verified
                </MockBadge>
              </div>
            ))}
          </div>
        </div>
      </At>
      <At x={300} y={284} w={120} from="scale" at={850} duration={400}>
        <span className="border-accent/40 bg-card-strong text-accent flex h-8 items-center justify-center gap-1.5 rounded-full border text-[12px] font-semibold shadow-[0_10px_24px_var(--shadow-brand)]">
          <Lock size={12} /> IAM role
        </span>
      </At>
      <At x={300} y={322} w={120} from="fade" at={1050}>
        <p className="text-muted-foreground text-center text-[10px]">
          via CloudFormation
        </p>
      </At>
      <At x={428} y={252} w={252} from="scale" at={420}>
        <div className={cn(PANEL, "flex flex-col items-start gap-3 p-4")}>
          <Logo className="h-7 w-auto" />
          <div className="flex w-full items-center justify-between gap-2">
            <span className="text-muted-foreground text-[11px]">
              Connection · prod-org
            </span>
            <MockBadge
              tone="success"
              style={anim("guide-appear-scale", 1150, 300)}
            >
              Connected
            </MockBadge>
          </div>
        </div>
      </At>
      <div className="absolute top-[440px] left-10 grid w-[640px] grid-cols-3 gap-3">
        {CONNECT_FACTS.map((fact, index) => (
          <div
            key={fact.title}
            className={cn(PANEL, "flex items-start gap-2.5 p-3")}
            style={anim("guide-appear-up", 1600 + index * 120, 450)}
          >
            <IconTile>
              <fact.icon size={16} />
            </IconTile>
            <span>
              <span className="block text-[13px] font-semibold">
                {fact.title}
              </span>
              <span className="text-muted-foreground mt-0.5 block text-[11px] leading-4">
                {fact.text}
              </span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── 3. Sync ─────────────────────────────────────────────────────────────────

const DATASETS = [
  {
    icon: Boxes,
    name: "Inventory",
    detail: "Resources and runtime interactions",
    done: "1,284 resources",
    at: 400,
  },
  {
    icon: Receipt,
    name: "Billing",
    detail: "FOCUS line items · Cost Explorer",
    done: "Succeeded",
    at: 550,
  },
  {
    icon: Activity,
    name: "Metrics",
    detail: "CloudWatch utilization",
    done: "Succeeded",
    at: 700,
  },
];

function SyncShot() {
  return (
    <>
      <Headline
        chapter="Sync"
        lines={["Resources, bills, metrics —", "synced on schedule."]}
      />
      <At x={40} y={186} w={640} at={180}>
        <div className={cn(PANEL, "px-4")}>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold">Sync · prod-org</span>
            <MockButton variant="outline">Sync now</MockButton>
          </div>
          {DATASETS.map((dataset) => {
            const finish = dataset.at + 950;
            return (
              <div
                key={dataset.name}
                className="border-border-soft flex items-center gap-3.5 border-t py-3"
              >
                <IconTile>
                  <dataset.icon size={17} />
                </IconTile>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {dataset.name}
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    {dataset.detail}
                  </span>
                </span>
                <MockProgress
                  at={dataset.at}
                  duration={900}
                  className="w-36"
                  barClassName="bg-gradient-to-r from-accent to-accent-secondary"
                />
                <span className="relative w-32">
                  <Until until={finish}>
                    <MockBadge tone="accent">Running</MockBadge>
                  </Until>
                  <span
                    className="absolute top-0 left-0"
                    style={anim("guide-appear-scale", finish, 300)}
                  >
                    <MockBadge tone="success">
                      <BadgeCheck size={11} /> {dataset.done}
                    </MockBadge>
                  </span>
                </span>
              </div>
            );
          })}
          <div
            className="border-border-soft text-muted-foreground flex items-center gap-1.5 border-t py-3 text-[11px]"
            style={anim("guide-fade-in", 1800, 400)}
          >
            <Clock size={12} /> Next scheduled run in 5 h 42 min — or whenever
            you ask
          </div>
        </div>
      </At>
      <At x={40} y={512} w={640} from="fade" at={2000}>
        <p className="text-muted-foreground flex items-center justify-center gap-2 text-[12px]">
          Every product reads the same data:
          <MockBadge tone="accent">Cost</MockBadge>
          <MockBadge tone="accent">Infrastructure</MockBadge>
          <MockBadge tone="accent">Recommendations</MockBadge>
        </p>
      </At>
    </>
  );
}

// ── 4. Infrastructure ───────────────────────────────────────────────────────

type Evidence = keyof typeof EVIDENCE_STYLES;

const MAP_NODES = [
  { id: "alb", label: "edge-alb", category: "network", x: 150, y: 270 },
  { id: "api", label: "api", category: "container", x: 360, y: 270 },
  { id: "db", label: "orders-db", category: "database", x: 570, y: 270 },
  { id: "assets", label: "assets", category: "storage", x: 150, y: 440 },
  { id: "queue", label: "events", category: "orchestration", x: 360, y: 440 },
  { id: "worker", label: "worker", category: "compute", x: 570, y: 440 },
] as const;

const MAP_EDGES: readonly { from: string; to: string; evidence: Evidence }[] = [
  { from: "alb", to: "api", evidence: "observed" },
  { from: "api", to: "db", evidence: "observed" },
  { from: "api", to: "queue", evidence: "observed" },
  { from: "queue", to: "worker", evidence: "configured" },
  { from: "worker", to: "db", evidence: "permitted" },
  { from: "api", to: "assets", evidence: "inferred" },
];

const LEGEND: readonly Evidence[] = [
  "observed",
  "configured",
  "permitted",
  "inferred",
];

function MapShot() {
  const byId = new Map<string, (typeof MAP_NODES)[number]>(
    MAP_NODES.map((node) => [node.id, node]),
  );
  return (
    <>
      <Headline
        chapter="Infrastructure"
        lines={["Every resource,", "and how it really connects."]}
      />
      <div
        className="absolute rounded-2xl border-2 border-dashed border-violet-400/45 bg-violet-400/[0.04]"
        style={{
          left: 40,
          top: 186,
          width: 640,
          height: 340,
          ...anim("guide-fade-in", 100, 500),
        }}
      >
        <span className="text-muted-foreground absolute top-2.5 left-3.5 text-[10px] font-semibold tracking-wide uppercase">
          vpc-prod · eu-west-1
        </span>
      </div>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fill="none"
      >
        {MAP_EDGES.map((edge, index) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          if (!from || !to) return null;
          const style = EVIDENCE_STYLES[edge.evidence];
          const at = 850 + index * 110;
          const d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
          return (
            <g key={`${edge.from}-${edge.to}`}>
              {style.dash ? (
                <path
                  d={d}
                  stroke={style.color}
                  strokeWidth={2.5}
                  strokeDasharray={style.dash}
                  style={anim("guide-fade-in", at, 400)}
                />
              ) : (
                <path
                  d={d}
                  pathLength={1}
                  strokeDasharray={1}
                  stroke={style.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  style={{
                    animation: `guide-draw 450ms ease-out ${at}ms both`,
                  }}
                />
              )}
              {edge.evidence === "observed" ? (
                <path
                  d={d}
                  stroke={style.color}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeDasharray="3 13"
                  className="guide-motion-only"
                  style={{
                    animation: `guide-fade-in 300ms ease-out ${at + 450}ms both, guide-flow 700ms linear ${at}ms infinite`,
                  }}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      {MAP_NODES.map((node, index) => (
        <At
          key={node.id}
          x={node.x - 68}
          y={node.y - 21}
          w={136}
          from="scale"
          at={200 + index * 70}
          duration={400}
        >
          <span className="border-border-soft bg-card-strong relative flex h-[42px] items-center gap-2 rounded-xl border px-2.5 text-[12px] font-semibold shadow-[0_12px_28px_var(--shadow-card)]">
            <span className="bg-accent/12 text-accent flex size-7 items-center justify-center rounded-lg">
              <ResourceCategoryIcon category={node.category} size={14} />
            </span>
            {node.label}
            {node.id === "api" ? <Highlight at={2000} /> : null}
          </span>
        </At>
      ))}
      <At x={398} y={318} w={236} from="scale" at={2150} duration={350}>
        <div className={cn(PANEL, "p-3")}>
          <p className="text-[12px] font-semibold">api → orders-db</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px]">
            <span
              className="size-2 rounded-full"
              style={{ background: EVIDENCE_STYLES.observed.color }}
            />
            Observed in VPC flow logs
          </p>
        </div>
      </At>
      <div className="absolute top-[544px] left-10 flex w-[640px] items-center justify-center gap-4">
        {LEGEND.map((evidence, index) => {
          const style = EVIDENCE_STYLES[evidence];
          return (
            <span
              key={evidence}
              className="text-muted-foreground flex items-center gap-1.5 text-[12px] font-medium"
              style={anim("guide-fade-in", 1600 + index * 80, 300)}
            >
              <svg aria-hidden width="22" height="6">
                <line
                  x1="1"
                  y1="3"
                  x2="21"
                  y2="3"
                  stroke={style.color}
                  strokeWidth="2.5"
                  strokeDasharray={style.dash}
                  strokeLinecap="round"
                />
              </svg>
              {style.label}
            </span>
          );
        })}
      </div>
    </>
  );
}

// ── 5. Cost ─────────────────────────────────────────────────────────────────

const SERVICES = [
  { name: "Amazon RDS", amount: 28410 },
  { name: "Amazon EC2", amount: 21960 },
  { name: "AWS Fargate", amount: 12300 },
  { name: "NAT Gateway", amount: 6840, anomaly: true },
  { name: "Amazon S3", amount: 5120 },
];

function CostShot() {
  const max = Math.max(...SERVICES.map((service) => service.amount));
  return (
    <>
      <Headline chapter="Cost" lines={["Know where", "every dollar goes."]} />
      <At x={40} y={186} w={306} at={180}>
        <div className={cn(PANEL, "p-4")}>
          <p className="text-muted-foreground text-[11px] font-medium">
            Effective cost · month to date
          </p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <span className="text-[34px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
              $84,120
            </span>
            <MockBadge tone="warning" style={anim("guide-fade-in", 700, 300)}>
              ↑ 6.2%
            </MockBadge>
          </div>
          <div className="mt-3">
            <LineChart
              points={[22, 26, 24, 31, 29, 34, 33, 38, 36, 42, 41, 47]}
              w={272}
              h={40}
              at={500}
              duration={900}
            />
          </div>
        </div>
      </At>
      <At x={360} y={186} w={320} at={320}>
        <div className={cn(PANEL, "p-4")}>
          <p className="text-muted-foreground text-[11px] font-medium">
            Budget · Production
          </p>
          <p className="mt-1 text-[15px] font-semibold tabular-nums">
            $84,120{" "}
            <span className="text-muted-foreground text-[12px] font-normal">
              of $110,000
            </span>
          </p>
          <div className="bg-foreground/10 mt-3 h-2 overflow-hidden rounded-full">
            <div
              className="from-accent to-accent-secondary h-full w-[76%] origin-left rounded-full bg-gradient-to-r"
              style={anim("guide-grow-x", 600, 800)}
            />
          </div>
          <MockBadge
            tone="success"
            className="mt-3"
            style={anim("guide-appear-scale", 1350, 300)}
          >
            Forecast $103,400 · on track
          </MockBadge>
        </div>
      </At>
      <At x={40} y={368} w={640} at={450}>
        <div className={cn(PANEL, "px-4 py-3")}>
          <p className="text-muted-foreground mb-1 text-[11px] font-medium">
            By service
          </p>
          {SERVICES.map((service, index) => (
            <div
              key={service.name}
              className="relative flex items-center gap-3 rounded-lg py-[5px]"
            >
              <span className="flex w-44 items-center gap-1.5 text-[12px] font-medium">
                {service.name}
                {service.anomaly ? (
                  <MockBadge
                    tone="danger"
                    className="px-1.5 text-[10px]"
                    style={anim("guide-appear-scale", 1950, 300)}
                  >
                    <TriangleAlert size={10} /> +38%
                  </MockBadge>
                ) : null}
              </span>
              <span className="bg-foreground/[0.06] relative h-2.5 flex-1 overflow-hidden rounded-full">
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 origin-left rounded-full",
                    service.anomaly ? "bg-red-500/80" : "bg-accent/75",
                  )}
                  style={{
                    width: `${(service.amount / max) * 100}%`,
                    ...anim("guide-grow-x", 700 + index * 90, 600),
                  }}
                />
              </span>
              <span className="w-16 text-right text-[12px] font-semibold tabular-nums">
                {formatUsd(service.amount)}
              </span>
              {service.anomaly ? <Highlight at={1950} /> : null}
            </div>
          ))}
        </div>
      </At>
    </>
  );
}

// ── 6. Recommendations ──────────────────────────────────────────────────────

const savingsTotal = demoRecommendations.reduce(
  (sum, item) => sum + item.savingUsd,
  0,
);
const readyCount = demoRecommendations.filter(
  (item) => item.status === "ready",
).length;

function SavingsShot() {
  return (
    <>
      <Headline
        chapter="Recommendations"
        lines={["The savings worth making,", "ranked for you."]}
      />
      <At x={40} y={184} w={640} at={180}>
        <div
          className={cn(
            PANEL,
            "border-success/30 flex items-center gap-3 px-4 py-3",
          )}
        >
          <IconTile tone="success">
            <Lightbulb size={18} />
          </IconTile>
          <span className="flex-1">
            <span className="text-muted-foreground block text-[11px] font-medium">
              Savings found
            </span>
            <span className="text-success block text-[26px] leading-tight font-semibold tracking-[-0.03em] tabular-nums">
              {formatUsd(Math.round(savingsTotal))}
              <span className="text-muted-foreground ml-1 text-[13px] font-medium tracking-normal">
                / month
              </span>
            </span>
          </span>
          <span className="text-muted-foreground text-right text-[11px] leading-5">
            {demoRecommendations.length} recommendations
            <br />
            {readyCount} ready to fix
          </span>
        </div>
      </At>
      {demoRecommendations.map((item, index) => (
        <At
          key={item.id}
          x={40}
          y={266 + index * 72}
          w={640}
          from="left"
          at={450 + index * 110}
          duration={450}
        >
          <div
            className={cn(
              PANEL,
              "relative flex items-center gap-3 px-3.5 py-2.5",
            )}
          >
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold",
                index === 0
                  ? "bg-accent text-accent-foreground"
                  : "bg-foreground/[0.06] text-muted-foreground",
              )}
            >
              #{item.rank}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">
                {item.title}
              </span>
              <span className="text-muted-foreground flex items-center gap-2 text-[11px]">
                <span className="truncate">
                  {item.resourceName} · {item.resourceKind}
                </span>
                {index === 0 ? (
                  <MockBadge
                    tone="accent"
                    className="px-1.5 py-0 text-[10px]"
                    style={anim("guide-appear-scale", 1750, 300)}
                  >
                    Peak CPU 31% · 14 days
                  </MockBadge>
                ) : null}
              </span>
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className="text-success font-mono text-[13px] font-semibold">
                {formatUsd(item.savingUsd)}/mo
              </span>
              <MockBadge
                tone={item.state.tone}
                className="px-1.5 py-0 text-[10px]"
              >
                {item.state.label}
              </MockBadge>
            </span>
            {index === 0 ? <Highlight at={1600} /> : null}
          </div>
        </At>
      ))}
    </>
  );
}

// ── 7. Fix ──────────────────────────────────────────────────────────────────

const fix = demoRecommendations[0];
const FIX_LINES = fix.command.split(" --");
const FIX_TYPE_MS = 340;

function FixShot() {
  return (
    <>
      <Headline
        chapter="Fix"
        lines={["Verified steps.", "Nothing auto-applied."]}
      />
      <At x={40} y={182} at={180}>
        <MockTabs
          tabs={["Console", "Terraform", "AWS CLI"]}
          active="Console"
          next="AWS CLI"
          switchAt={450}
          className="text-[13px]"
        />
      </At>
      <At x={40} y={232} w={640} at={300}>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#060b16] text-[#d7e3f4] shadow-[0_24px_60px_var(--shadow-brand)]">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-white/70">
              <Terminal size={13} /> How to fix · AWS CLI
            </span>
            <span
              className="flex items-center gap-1 rounded-full bg-emerald-400/12 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300"
              style={anim(
                "guide-appear-scale",
                550 + FIX_LINES.length * FIX_TYPE_MS + 150,
                350,
              )}
            >
              <BadgeCheck size={12} /> Verified: {fix.verifiedAgainst}
            </span>
          </div>
          <pre className="px-4 py-3.5 font-mono text-[14px] leading-7">
            {FIX_LINES.map((line, index) => {
              const last = index === FIX_LINES.length - 1;
              const text = `${index === 0 ? line : `    --${line}`}${last ? "" : " \\"}`;
              return (
                <span key={index} className="block">
                  {index === 0 ? (
                    <span
                      className="text-emerald-300"
                      style={anim("guide-fade-in", 500, 150)}
                    >
                      ${" "}
                    </span>
                  ) : null}
                  <Typing
                    text={text}
                    at={550 + index * FIX_TYPE_MS}
                    duration={FIX_TYPE_MS - 20}
                  />
                </span>
              );
            })}
          </pre>
        </div>
      </At>
      <At x={40} y={482} w={640} from="up" at={2350}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground flex items-center gap-1.5 text-[12px]">
            <ShieldCheck size={14} className="text-success" />
            You review and run every step — Dilanix never changes your account.
          </span>
          <MockBadge tone="success" className="text-[12px]">
            −{formatUsd(fix.savingUsd)}/mo
          </MockBadge>
        </div>
      </At>
    </>
  );
}

// ── 8. Dilanix ──────────────────────────────────────────────────────────────

function OutroShot() {
  return (
    <>
      <div
        aria-hidden
        className="guide-motion-only from-accent/30 to-accent-secondary/20 absolute top-[90px] left-[180px] size-[360px] rounded-full bg-gradient-to-br blur-3xl"
        style={{ animation: "reel-glow 2600ms ease-in-out infinite both" }}
      />
      <At x={210} y={150} w={300} from="scale" at={100} duration={600}>
        <div className="flex justify-center">
          <Logo className="h-16 w-auto" />
        </div>
      </At>
      <Headline
        top={248}
        center
        lines={["One platform for your cloud's", "cost and infrastructure."]}
      />
      <At x={40} y={404} w={640} from="fade" at={1100}>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <MockBadge tone="success" className="px-3 py-1 text-[13px]">
            <span className="bg-success size-1.5 rounded-full" /> AWS today
          </MockBadge>
          <MockBadge tone="neutral" className="px-3 py-1 text-[13px]">
            Read-only access
          </MockBadge>
          <MockBadge tone="neutral" className="px-3 py-1 text-[13px]">
            Savings from your real bill
          </MockBadge>
          <MockBadge tone="neutral" className="px-3 py-1 text-[13px]">
            Verified fixes
          </MockBadge>
        </div>
      </At>
    </>
  );
}

export interface ReelShot {
  id: string;
  /** Names the shot in the progress bar. */
  chapter: string;
  /** How long it plays, ending in a dissolve into the next. */
  durationMs: number;
  Visual: ComponentType;
}

/** The landing reel's shots, in order; it loops. */
export const REEL_SHOTS: readonly ReelShot[] = [
  { id: "intro", chapter: "Dilanix", durationMs: 2800, Visual: IntroShot },
  { id: "connect", chapter: "Connect", durationMs: 3000, Visual: ConnectShot },
  { id: "sync", chapter: "Sync", durationMs: 2900, Visual: SyncShot },
  { id: "map", chapter: "Infrastructure", durationMs: 3400, Visual: MapShot },
  { id: "cost", chapter: "Cost", durationMs: 3300, Visual: CostShot },
  {
    id: "savings",
    chapter: "Recommendations",
    durationMs: 3200,
    Visual: SavingsShot,
  },
  { id: "fix", chapter: "Fix", durationMs: 3600, Visual: FixShot },
  { id: "outro", chapter: "One platform", durationMs: 3000, Visual: OutroShot },
];
