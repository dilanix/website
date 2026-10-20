"use client";

import type { ReactNode } from "react";
import {
  Boxes,
  Check,
  Expand,
  Filter,
  Globe,
  Lightbulb,
  Maximize2,
  Minus,
  Network,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { ResourceCategoryIcon } from "@/components/dashboard/resource-category-icon";
import { EVIDENCE_STYLES } from "@/components/dashboard/infrastructure/resource-visuals";
import { cn } from "@/lib/utils";
import {
  anim,
  At,
  Cursor,
  Highlight,
  LineChart,
  Lines,
  MockBadge,
  MockButton,
  MockTabs,
  MockWindow,
  Node,
  ProviderTile,
  Typing,
  Until,
  type MockTone,
} from "./scene-kit";

type Evidence = keyof typeof EVIDENCE_STYLES;

interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  category: string;
  at?: number;
  /** Fades to the background from this time. */
  dimAt?: number;
  /** A "hidden neighbours" count shown on it. */
  hidden?: number;
}

interface GraphEdge {
  from: string;
  to: string;
  evidence: Evidence;
  at?: number;
  dimAt?: number;
}

interface GraphBox {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  at?: number;
  tone?: "vpc" | "subnet" | "security";
}

const NODE_W = 132;
const NODE_H = 40;

/** A small, animated stand-in for the Infrastructure graph. */
function GraphMock({
  nodes,
  edges = [],
  boxes = [],
}: {
  nodes: readonly GraphNode[];
  edges?: readonly GraphEdge[];
  boxes?: readonly GraphBox[];
}) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return (
    <>
      {boxes.map((box) => (
        <div
          key={box.label}
          className={cn(
            "absolute rounded-2xl border-2 border-dashed",
            box.tone === "subnet"
              ? "border-sky-400/45 bg-sky-400/[0.04]"
              : box.tone === "security"
                ? "border-amber-400/55 bg-amber-400/[0.04]"
                : "border-violet-400/45 bg-violet-400/[0.04]",
          )}
          style={{
            left: box.x,
            top: box.y,
            width: box.w,
            height: box.h,
            ...anim("guide-fade-in", box.at ?? 0, 500),
          }}
        >
          <span className="text-muted-foreground absolute top-2 left-3 text-[10px] font-semibold tracking-wide uppercase">
            {box.label}
          </span>
        </div>
      ))}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={960}
        height={540}
        fill="none"
      >
        {edges.map((edge) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          if (!from || !to) return null;
          const style = EVIDENCE_STYLES[edge.evidence];
          const at = edge.at ?? 0;
          return (
            <g
              key={`${edge.from}-${edge.to}`}
              style={
                edge.dimAt !== undefined
                  ? {
                      animation: `guide-fade-out 400ms ease-out ${edge.dimAt}ms both`,
                    }
                  : undefined
              }
            >
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={style.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={style.dash}
                style={anim("guide-fade-in", at, 500)}
              />
            </g>
          );
        })}
      </svg>
      {nodes.map((node) => (
        <div
          key={node.id}
          data-cursor={`node-${node.id}`}
          className="absolute"
          style={{
            left: node.x - NODE_W / 2,
            top: node.y - NODE_H / 2,
            width: NODE_W,
            ...anim("guide-appear-scale", node.at ?? 0, 450),
          }}
        >
          <div
            className="border-border-soft bg-card-strong relative flex h-10 items-center gap-2 rounded-xl border px-2.5 shadow-[0_10px_26px_var(--shadow-card)]"
            style={
              node.dimAt !== undefined
                ? { animation: `guide-dim 400ms ease-out ${node.dimAt}ms both` }
                : undefined
            }
          >
            <span className="bg-accent/12 text-accent flex size-6 shrink-0 items-center justify-center rounded-md">
              <ResourceCategoryIcon category={node.category} size={13} />
            </span>
            <span className="truncate text-[11px] font-semibold">
              {node.label}
            </span>
            {node.hidden ? (
              <span
                data-cursor={`hidden-${node.id}`}
                className="bg-accent text-accent-foreground absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full text-[10px] font-bold"
              >
                {node.hidden}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </>
  );
}

function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border-soft bg-card-strong rounded-2xl border p-4 shadow-[0_18px_44px_var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

const APP_NODES: GraphNode[] = [
  { id: "alb", x: 230, y: 170, label: "orders-alb", category: "network" },
  { id: "ecs", x: 430, y: 170, label: "orders-service", category: "container" },
  { id: "rds", x: 640, y: 170, label: "orders-db", category: "database" },
  {
    id: "lambda",
    x: 430,
    y: 330,
    label: "invoice-worker",
    category: "compute",
  },
  { id: "cache", x: 640, y: 330, label: "sessions-cache", category: "cache" },
];

const APP_EDGES: GraphEdge[] = [
  { from: "alb", to: "ecs", evidence: "observed" },
  { from: "ecs", to: "rds", evidence: "configured" },
  { from: "ecs", to: "cache", evidence: "permitted" },
  { from: "ecs", to: "lambda", evidence: "inferred" },
];

/** Graph and Resources side by side. */
export function InfraIntroScene() {
  return (
    <>
      <At x={40} y={50} w={520} at={0}>
        <Card className="relative h-[420px] overflow-hidden">
          <p className="text-sm font-semibold">Graph</p>
          <p className="text-muted-foreground text-[11px]">
            how your resources connect
          </p>
        </Card>
      </At>
      {/* Scaled from its top-left, so the map sits inside the Graph card. */}
      <div className="absolute top-[20px] left-[-60px] origin-top-left scale-[0.8]">
        <GraphMock
          nodes={APP_NODES.map((node, index) => ({
            ...node,
            at: 400 + index * 200,
          }))}
          edges={APP_EDGES.map((edge, index) => ({
            ...edge,
            at: 1500 + index * 200,
          }))}
          boxes={[
            { x: 150, y: 110, w: 590, h: 290, label: "vpc-prod", at: 300 },
          ]}
        />
      </div>
      <At x={590} y={50} w={330} at={2400}>
        <Card className="h-[420px]">
          <p className="text-sm font-semibold">Resources</p>
          <p className="text-muted-foreground text-[11px]">
            every resource, with its full details
          </p>
          <div className="mt-4 space-y-2">
            {APP_NODES.map((node, index) => (
              <div
                key={node.id}
                className="border-border-soft flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                style={anim("guide-appear-left", 2700 + index * 200)}
              >
                <ResourceCategoryIcon category={node.category} size={13} />
                <span className="flex-1 font-medium">{node.label}</span>
                <MockBadge tone="success">active</MockBadge>
              </div>
            ))}
          </div>
        </Card>
      </At>
    </>
  );
}

const SOURCES = [
  "Service configuration",
  "IAM policies",
  "AWS X-Ray",
  "VPC Flow Logs",
  "DNS query logs",
  "ALB access logs",
  "AI inference",
];

/** Inventory and runtime interactions feed the graph. */
export function InfraDataScene() {
  return (
    <>
      <Lines
        flow
        paths={[
          { d: "M 220 270 C 270 270 270 130 320 130", at: 800 },
          { d: "M 220 270 C 270 270 270 340 320 340", at: 1200 },
          { d: "M 580 130 C 640 130 640 250 700 250", at: 4600 },
          { d: "M 580 340 C 640 340 640 270 700 270", at: 4600 },
        ]}
      />
      <At x={30} y={210} w={190} at={0}>
        <Card>
          <ProviderTile code="AWS" />
          <p className="mt-3 text-sm font-semibold">Your accounts</p>
          <p className="text-muted-foreground text-[11px]">Inventory Read</p>
        </Card>
      </At>
      <At x={320} y={90} w={260} at={900} from="scale">
        <Node
          icon={<Boxes size={16} />}
          title="Inventory Resources"
          detail="every resource and its configuration"
        />
      </At>
      <At x={320} y={300} w={260} at={1300} from="scale">
        <Node
          icon={<Network size={16} />}
          title="Runtime Interactions"
          detail="how they work together"
        />
      </At>
      <div className="absolute top-[370px] left-[320px] flex w-[380px] flex-wrap gap-1.5">
        {SOURCES.map((source, index) => (
          <span
            key={source}
            style={anim("guide-appear-scale", 1900 + index * 250, 250)}
          >
            <MockBadge tone="neutral">{source}</MockBadge>
          </span>
        ))}
      </div>
      <At x={700} y={200} w={230} at={4800} from="scale">
        <Card>
          <p className="text-sm font-semibold">Graph &amp; Resources</p>
          <p className="text-muted-foreground mt-1 text-[11px] leading-4">
            Relationships are worked out minutes after each inventory sync.
          </p>
        </Card>
      </At>
    </>
  );
}

/** Connection, account, region; the size notice. */
export function InfraScopeScene() {
  return (
    <>
      <At x={60} y={60} w={840} at={0}>
        <Card>
          <div className="flex flex-wrap items-end gap-3">
            {[
              ["Connection", "AWS · Production", "connection"],
              ["Account", "Prod · 111111111111", "account"],
              ["Region", "All regions", "region"],
            ].map(([label, value, id]) => (
              <div key={id} className="min-w-52">
                <p className="text-muted-foreground mb-1 text-[11px] font-medium">
                  {label}
                </p>
                <div
                  data-cursor={id}
                  className="border-foreground/15 bg-background flex h-9 items-center justify-between rounded-lg border px-3 text-xs"
                >
                  {id === "region" ? (
                    <span className="relative">
                      <Until until={4400}>{value}</Until>
                      <span
                        className="absolute top-0 left-0 whitespace-nowrap"
                        style={anim("guide-fade-in", 4400, 200)}
                      >
                        eu-central-1
                      </span>
                    </span>
                  ) : (
                    value
                  )}
                  <span className="text-muted-foreground">▾</span>
                </div>
              </div>
            ))}
            <span className="text-muted-foreground ml-auto text-[11px]">
              Relationships resolved 4m ago
            </span>
          </div>
        </Card>
      </At>
      <At x={60} y={190} w={840} at={1800}>
        <Until until={4500}>
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/[0.07] px-4 py-3 text-xs">
            Showing 300 of 1,240 resources — pick a region to see them all.
          </div>
        </Until>
      </At>
      <At x={60} y={190} w={840} at={4600}>
        <div className="border-success/40 bg-success/[0.07] flex items-center gap-2 rounded-xl border px-4 py-3 text-xs">
          <Check size={14} className="text-success" /> eu-central-1 · 412
          resources, all drawn
        </div>
      </At>
      <At x={60} y={280} w={840} at={5400} from="fade">
        <p className="text-muted-foreground text-xs leading-5">
          One account at a time — switch accounts above. Only connections whose
          inventory your organization can access are listed.
        </p>
      </At>
      <Cursor
        points={[
          { x: 480, y: 500, at: 0 },
          { to: "region", at: 3800, click: true },
          { to: "region", at: 4400 },
          { x: 480, y: 500, at: 6000 },
        ]}
      />
    </>
  );
}

/** Pan, zoom and collapse a VPC. */
export function InfraMapScene() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ animation: "guide-pan 2400ms ease-in-out 1200ms both" }}
      >
        <GraphMock
          nodes={APP_NODES.map((node) => ({ ...node, at: 0 }))}
          edges={APP_EDGES}
          boxes={[{ x: 150, y: 100, w: 590, h: 300, label: "vpc-prod" }]}
        />
        <div
          className="absolute top-[100px] left-[150px] h-[300px] w-[590px]"
          style={anim("guide-fade-in", 5600, 400)}
        >
          <div className="bg-surface absolute inset-0 rounded-2xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-card-strong flex items-center gap-2 rounded-xl border-2 border-dashed border-violet-400/60 px-4 py-3 text-xs font-semibold">
              vpc-prod · 5 resources
            </span>
          </div>
        </div>
      </div>
      <At x={40} y={460} w={880} at={600} from="fade">
        <p className="text-muted-foreground text-center text-xs">
          Drag to pan · scroll to zoom · double-click a box to collapse it
        </p>
      </At>
      <Cursor
        points={[
          { x: 480, y: 440, at: 0 },
          { x: 820, y: 420, at: 1100, click: true },
          { x: 760, y: 410, at: 3600 },
          { x: 300, y: 125, at: 4800, click: true },
          { x: 300, y: 125, at: 5100, click: true },
          { x: 300, y: 125, at: 6200 },
        ]}
      />
    </>
  );
}

/** Hover to trace, expand hidden neighbours, search. */
export function InfraTraceScene() {
  const nodes: GraphNode[] = [
    {
      id: "alb",
      x: 200,
      y: 200,
      label: "orders-alb",
      category: "network",
      dimAt: 1200,
    },
    {
      id: "ecs",
      x: 420,
      y: 200,
      label: "orders-service",
      category: "container",
      hidden: 3,
    },
    { id: "rds", x: 640, y: 200, label: "orders-db", category: "database" },
    {
      id: "cache",
      x: 640,
      y: 360,
      label: "sessions-cache",
      category: "cache",
      dimAt: 1200,
    },
    {
      id: "q",
      x: 420,
      y: 380,
      label: "orders-queue",
      category: "messaging",
      at: 3400,
    },
    {
      id: "s3",
      x: 200,
      y: 380,
      label: "invoices-bucket",
      category: "storage",
      at: 3550,
    },
    {
      id: "logs",
      x: 420,
      y: 60,
      label: "orders-logs",
      category: "storage",
      at: 3700,
    },
  ];
  const edges: GraphEdge[] = [
    { from: "alb", to: "ecs", evidence: "observed", dimAt: 1200 },
    { from: "ecs", to: "rds", evidence: "configured" },
    { from: "rds", to: "cache", evidence: "permitted", dimAt: 1200 },
    { from: "ecs", to: "q", evidence: "configured", at: 3500 },
    { from: "ecs", to: "s3", evidence: "configured", at: 3650 },
    { from: "ecs", to: "logs", evidence: "observed", at: 3800 },
  ];
  return (
    <>
      <GraphMock nodes={nodes} edges={edges} />
      <At x={720} y={30} w={210} at={5200}>
        <div className="border-foreground/15 bg-background flex h-9 items-center gap-2 rounded-lg border px-3 text-xs shadow-lg">
          <Search size={13} className="text-muted-foreground" />
          <Typing text="orders-db" at={5400} />
        </div>
      </At>
      <At x={720} y={80} w={210} at={6600} from="scale">
        <Card className="p-3">
          <p className="text-sm font-semibold">orders-db</p>
          <p className="text-muted-foreground text-[11px]">
            Database instance · rds.db_instance
          </p>
          <MockBadge tone="success" className="mt-2">
            available
          </MockBadge>
        </Card>
      </At>
      <span
        className="ring-accent pointer-events-none absolute rounded-xl ring-2"
        style={{
          left: 574,
          top: 180,
          width: 132,
          height: 40,
          ...anim("guide-fade-in", 6400, 300),
        }}
      />
      <Cursor
        points={[
          { x: 480, y: 500, at: 0 },
          { to: "node-ecs", at: 900 },
          { to: "node-ecs", at: 2600 },
          { to: "hidden-ecs", at: 3100, click: true },
          { to: "hidden-ecs", at: 3800 },
          { x: 800, y: 50, at: 5000, click: true },
          { x: 800, y: 50, at: 7600 },
        ]}
      />
    </>
  );
}

/** Architecture, Network and Security views. */
export function InfraProvisionedScene() {
  return (
    <>
      <At x={40} y={24} w={600} at={0}>
        <Until until={6300}>
          <MockTabs
            tabs={["Architecture", "Network", "Security"]}
            active="Architecture"
            next="Network"
            switchAt={3200}
            cursorPrefix="view"
          />
        </Until>
      </At>
      <At x={40} y={24} w={600} at={6300} from="fade">
        <MockTabs
          tabs={["Architecture", "Network", "Security"]}
          active="Security"
        />
      </At>
      <GraphMock
        nodes={[
          {
            id: "igw",
            x: 100,
            y: 230,
            label: "internet-gw",
            category: "network",
            at: 3600,
          },
          {
            id: "alb",
            x: 355,
            y: 220,
            label: "orders-alb",
            category: "network",
          },
          {
            id: "nat",
            x: 355,
            y: 320,
            label: "nat-gateway",
            category: "network",
            at: 3800,
          },
          {
            id: "ecs",
            x: 610,
            y: 220,
            label: "orders-service",
            category: "container",
          },
          {
            id: "rds",
            x: 800,
            y: 330,
            label: "orders-db",
            category: "database",
          },
        ]}
        edges={[
          { from: "igw", to: "alb", evidence: "permitted", at: 3900 },
          { from: "alb", to: "ecs", evidence: "configured" },
          { from: "ecs", to: "rds", evidence: "configured" },
          { from: "ecs", to: "nat", evidence: "permitted", at: 4000 },
        ]}
        boxes={[
          { x: 200, y: 90, w: 740, h: 360, label: "vpc-prod" },
          {
            x: 225,
            y: 150,
            w: 260,
            h: 230,
            label: "public subnet",
            tone: "subnet",
            at: 3400,
          },
          {
            x: 505,
            y: 150,
            w: 415,
            h: 280,
            label: "private subnet",
            tone: "subnet",
            at: 3500,
          },
          {
            x: 530,
            y: 185,
            w: 160,
            h: 70,
            label: "sg-app",
            tone: "security",
            at: 6400,
          },
          {
            x: 720,
            y: 295,
            w: 160,
            h: 70,
            label: "sg-db",
            tone: "security",
            at: 6600,
          },
        ]}
      />
      {[
        { at: 600, text: "Architecture — services, grouped by VPC" },
        { at: 3300, text: "Network — subnets, gateways and routing" },
        { at: 6500, text: "Security — security groups and what they apply to" },
      ].map((label, index, all) => (
        <At key={label.text} x={420} y={496} w={520} at={label.at} from="fade">
          {index < all.length - 1 ? (
            <Until until={all[index + 1].at}>
              <span className="text-muted-foreground text-xs">
                {label.text}
              </span>
            </Until>
          ) : (
            <span className="text-muted-foreground text-xs">{label.text}</span>
          )}
        </At>
      ))}
      <Cursor
        points={[
          { x: 480, y: 520, at: 0 },
          { to: "view-Network", at: 2900, click: true },
          { to: "view-Network", at: 3500 },
          { to: "view-Security", at: 6000, click: true },
          { to: "view-Security", at: 6600 },
        ]}
      />
    </>
  );
}

/** A flat flow of how services work together. */
export function InfraRuntimeScene() {
  return (
    <>
      <At x={40} y={24} w={300} at={0}>
        <MockTabs
          tabs={["Provisioned", "Runtime"]}
          active="Provisioned"
          next="Runtime"
          switchAt={900}
        />
      </At>
      <GraphMock
        nodes={[
          {
            id: "web",
            x: 110,
            y: 270,
            label: "Internet",
            category: "network",
            at: 1200,
          },
          {
            id: "alb",
            x: 290,
            y: 270,
            label: "orders-alb",
            category: "network",
            at: 1400,
          },
          {
            id: "ecs",
            x: 480,
            y: 270,
            label: "orders-service",
            category: "container",
            at: 1600,
          },
          {
            id: "rds",
            x: 680,
            y: 170,
            label: "orders-db",
            category: "database",
            at: 1800,
          },
          {
            id: "q",
            x: 680,
            y: 370,
            label: "orders-queue",
            category: "messaging",
            at: 2000,
          },
          {
            id: "lambda",
            x: 860,
            y: 370,
            label: "invoice-worker",
            category: "compute",
            at: 2200,
          },
          {
            id: "ext",
            x: 860,
            y: 170,
            label: "api.stripe.com",
            category: "network",
            at: 2400,
          },
        ]}
        edges={[
          { from: "web", to: "alb", evidence: "observed", at: 2700 },
          { from: "alb", to: "ecs", evidence: "observed", at: 2900 },
          { from: "ecs", to: "rds", evidence: "configured", at: 3100 },
          { from: "ecs", to: "q", evidence: "configured", at: 3300 },
          { from: "q", to: "lambda", evidence: "configured", at: 3500 },
          { from: "ecs", to: "ext", evidence: "observed", at: 3700 },
        ]}
      />
      <At x={780} y={110} at={4000} from="fade">
        <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium">
          <Globe size={11} /> external host
        </span>
      </At>
      <At x={40} y={470} w={880} at={4600} from="fade">
        <p className="text-muted-foreground text-center text-xs">
          Dependencies, traffic and access — no VPC boxes, just the data flow.
        </p>
      </At>
    </>
  );
}

/** The five kinds of evidence. */
export function InfraEvidenceScene() {
  const kinds: { key: Evidence; text: string }[] = [
    { key: "configured", text: "declared in the provider's configuration" },
    {
      key: "permitted",
      text: "rules or routes allow it — not proof it's used",
    },
    { key: "observed", text: "traffic actually seen in flow logs or traces" },
    { key: "inferred", text: "suggested by analysis, with a confidence" },
    { key: "user_confirmed", text: "asserted by someone in your organization" },
  ];
  return (
    <>
      {kinds.map((kind, index) => {
        const style = EVIDENCE_STYLES[kind.key];
        return (
          <At
            key={kind.key}
            x={70}
            y={50 + index * 82}
            w={820}
            at={400 + index * 900}
            from="left"
          >
            <div className="flex items-center gap-5">
              <svg width="160" height="12" className="shrink-0">
                <line
                  x1={4}
                  y1={6}
                  x2={156}
                  y2={6}
                  stroke={style.color}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={style.dash}
                />
              </svg>
              <span className="w-28 text-sm font-semibold">{style.label}</span>
              <span className="text-muted-foreground text-xs">{kind.text}</span>
            </div>
          </At>
        );
      })}
      <At x={70} y={470} w={820} at={5400} from="fade">
        <p className="text-muted-foreground text-xs">
          A line shows its strongest evidence; click it to see every piece.
        </p>
      </At>
    </>
  );
}

/** Interaction sources and their states. */
export function InfraSourcesScene() {
  const rows: { name: string; state: string; tone: MockTone; hint?: string }[] =
    [
      { name: "Service configuration", state: "Collected", tone: "success" },
      { name: "IAM policies", state: "Collected", tone: "success" },
      {
        name: "AWS X-Ray",
        state: "Nothing found",
        tone: "neutral",
        hint: "Instrument services with X-Ray or OpenTelemetry",
      },
      {
        name: "VPC Flow Logs",
        state: "Not enabled",
        tone: "accent",
        hint: "Enable VPC flow logs for each VPC",
      },
      { name: "DNS query logs", state: "Partial", tone: "warning" },
      {
        name: "ALB access logs",
        state: "No permission",
        tone: "warning",
        hint: "Update the stack so the role can read the log bucket",
      },
      { name: "AI inference", state: "Collected", tone: "success" },
    ];
  return (
    <>
      <At x={100} y={24} w={760} at={0}>
        <Card className="p-0">
          <div className="border-border-soft flex items-center justify-between border-b px-5 py-3">
            <p className="text-sm font-semibold">Interaction sources</p>
            <MockBadge tone="neutral">3 of 7 collected</MockBadge>
          </div>
          {rows.map((row, index) => (
            <div
              key={row.name}
              className="border-border-soft flex items-center justify-between gap-4 border-b px-5 py-2.5 text-xs last:border-b-0"
              style={anim("guide-appear-up", 400 + index * 500)}
            >
              <span>
                <span className="block font-medium">{row.name}</span>
                {row.hint ? (
                  <span className="text-muted-foreground text-[11px]">
                    {row.hint}
                  </span>
                ) : null}
              </span>
              <MockBadge tone={row.tone}>{row.state}</MockBadge>
            </div>
          ))}
        </Card>
      </At>
    </>
  );
}

/** Traffic visibility, and why "not visible" isn't "unused". */
export function InfraCoverageScene() {
  return (
    <>
      <At x={50} y={60} w={330} at={0}>
        <Card>
          <div className="flex items-center gap-2">
            <ResourceCategoryIcon category="compute" size={16} />
            <span className="text-sm font-semibold">batch-runner</span>
          </div>
          <MockBadge tone="neutral" className="mt-3">
            Traffic not visible
          </MockBadge>
          <p className="text-muted-foreground mt-3 text-[11px] leading-5">
            No lines to it — but nothing could see its traffic.
          </p>
        </Card>
      </At>
      <At x={410} y={40} w={500} at={1200}>
        <Card>
          <MockTabs
            tabs={["Overview", "Relationships", "Traffic", "Tags"]}
            active="Traffic"
          />
          <div className="mt-4 space-y-2 text-xs">
            {[
              ["Network traffic (VPC flow logs)", "Not visible", "neutral"],
              ["Requests (access logs)", "Not applicable", "neutral"],
              [
                "Name lookups (DNS query logs) — not traffic",
                "Partly visible",
                "warning",
              ],
            ].map(([name, state, tone], index) => (
              <div
                key={name}
                className="border-border-soft flex items-center justify-between rounded-lg border px-3 py-2"
                style={anim("guide-appear-left", 1500 + index * 300)}
              >
                <span>{name}</span>
                <MockBadge tone={tone as MockTone}>{state}</MockBadge>
              </div>
            ))}
            <p
              className="border-accent/30 bg-accent/5 text-accent rounded-lg border px-3 py-2"
              style={anim("guide-fade-in", 2800, 400)}
            >
              Enable VPC flow logs for its VPC — the next Runtime Interactions
              run reads them.
            </p>
          </div>
        </Card>
      </At>
      <At x={50} y={330} w={860} at={4200}>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            ["Visible", "success", "every flow was read — no line means none"],
            ["Partly visible", "warning", "lines may be missing"],
            ["Not visible", "neutral", "nothing read it — never means unused"],
            [
              "Cannot be observed",
              "neutral",
              "not in a network: configuration only",
            ],
          ].map(([state, tone, text], index) => (
            <div
              key={state}
              className="border-border-soft bg-card-strong flex items-center gap-2 rounded-xl border px-3 py-2"
              style={anim("guide-appear-up", 4300 + index * 300)}
            >
              <MockBadge tone={tone as MockTone}>{state}</MockBadge>
              <span className="text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>
      </At>
    </>
  );
}

/** The resource inspector and its tabs. */
export function InfraResourceDetailsScene() {
  const tabs: [string, string][] = [
    ["Overview", "Identifiers, region, zone, first and last seen, capacity"],
    ["Network", "Its VPC, subnets and addresses"],
    ["Security", "Security groups, with inbound and outbound rules"],
    ["Relationships", "Everything it connects to — click one to jump there"],
    ["External", "Outside endpoints it reaches"],
    ["Traffic", "Whether its traffic was visible over the last 7 days"],
    ["Tags · Raw", "Its tags and the full collected configuration"],
  ];
  return (
    <>
      <GraphMock
        nodes={APP_NODES.slice(0, 3).map((node) => ({
          ...node,
          x: node.x - 150,
        }))}
        edges={APP_EDGES.slice(0, 2)}
      />
      <At x={560} y={20} w={380} at={600} from="left">
        <Card className="h-[500px]">
          <div className="flex items-start justify-between">
            <span>
              <span className="block text-sm font-semibold">orders-db</span>
              <span className="text-muted-foreground text-[11px]">
                Database instance · rds.db_instance
              </span>
            </span>
            <MockBadge tone="success">available</MockBadge>
          </div>
          <MockButton variant="outline" className="mt-3">
            Open in Resources
          </MockButton>
          <div className="mt-4 space-y-2">
            {tabs.map(([tab, text], index) => (
              <div
                key={tab}
                className="border-border-soft relative rounded-lg border px-3 py-2 text-xs"
                style={anim("guide-appear-up", 1300 + index * 650)}
              >
                <span className="block font-semibold">{tab}</span>
                <span className="text-muted-foreground text-[11px]">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </At>
      <Cursor
        points={[
          { x: 300, y: 500, at: 0 },
          { to: "node-rds", at: 500, click: true },
          { to: "node-rds", at: 1200 },
          { x: 300, y: 500, at: 2600 },
        ]}
      />
    </>
  );
}

/** A line's details: configured, reachable, observed, internet path. */
export function InfraConnectionDetailsScene() {
  const checks: [string, boolean, string][] = [
    ["Configured", true, "the service's settings name orders-db"],
    ["Reachability", true, "sg-db allows 5432 from sg-app · route exists"],
    ["Observed", true, "1,284 flows in VPC flow logs"],
    ["Internet path", false, "not reachable from the internet"],
  ];
  return (
    <>
      <GraphMock
        nodes={[
          {
            id: "ecs",
            x: 160,
            y: 200,
            label: "orders-service",
            category: "container",
          },
          {
            id: "rds",
            x: 400,
            y: 200,
            label: "orders-db",
            category: "database",
          },
        ]}
        edges={[{ from: "ecs", to: "rds", evidence: "observed" }]}
      />
      <span
        data-cursor="edge"
        className="absolute"
        style={{ left: 270, top: 196, width: 20, height: 8 }}
      />
      <At x={500} y={30} w={430} at={900} from="left">
        <Card>
          <p className="text-sm font-semibold">orders-service → orders-db</p>
          <div className="mt-2">
            <MockTabs
              tabs={["Overview", "Path", "Evidence", "Raw"]}
              active="Overview"
            />
          </div>
          <div className="mt-4 space-y-2.5">
            {checks.map(([name, ok, text], index) => (
              <div
                key={name}
                className="flex items-start gap-3 text-xs"
                style={anim("guide-appear-left", 1500 + index * 700)}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full",
                    ok
                      ? "bg-success/15 text-success"
                      : "bg-foreground/10 text-muted-foreground",
                  )}
                >
                  {ok ? <Check size={12} /> : <X size={12} />}
                </span>
                <span>
                  <span className="block font-semibold">{name}</span>
                  <span className="text-muted-foreground text-[11px]">
                    {text}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </At>
      <Cursor
        points={[
          { x: 300, y: 500, at: 0 },
          { to: "edge", at: 600, click: true },
          { to: "edge", at: 1200 },
          { x: 300, y: 500, at: 2800 },
        ]}
      />
    </>
  );
}

/** Expand, collapse, filter, zoom, fit, reset, minimap, fullscreen. */
export function InfraControlsScene() {
  const controls: { icon: ReactNode; label: string; at: number }[] = [
    { icon: <Expand size={14} />, label: "Expand all", at: 500 },
    { icon: <Boxes size={14} />, label: "Collapse all", at: 1200 },
    { icon: <Filter size={14} />, label: "Filter categories", at: 1900 },
    { icon: <Minus size={14} />, label: "Zoom out", at: 2600 },
    { icon: <Plus size={14} />, label: "Zoom in", at: 2900 },
    { icon: <Search size={14} />, label: "Fit to view", at: 3300 },
    { icon: <RotateCcw size={14} />, label: "Reset view", at: 3800 },
    { icon: <Maximize2 size={14} />, label: "Fullscreen", at: 4400 },
  ];
  return (
    <>
      <div className="absolute top-[30px] left-[40px] flex flex-wrap gap-2">
        {controls.map((control) => (
          <span
            key={control.label}
            className="relative"
            style={anim("guide-appear-up", control.at - 300)}
          >
            <span className="border-border-soft bg-card-strong flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shadow-sm">
              {control.icon}
              {control.label}
            </span>
            <Highlight at={control.at} />
          </span>
        ))}
      </div>
      <GraphMock
        nodes={[
          {
            id: "a",
            x: 220,
            y: 230,
            label: "orders-service",
            category: "container",
          },
          { id: "b", x: 440, y: 230, label: "orders-db", category: "database" },
          {
            id: "c",
            x: 220,
            y: 380,
            label: "invoices-bucket",
            category: "storage",
            dimAt: 2100,
          },
          {
            id: "d",
            x: 440,
            y: 380,
            label: "orders-queue",
            category: "messaging",
          },
        ]}
        edges={[
          { from: "a", to: "b", evidence: "configured" },
          { from: "a", to: "c", evidence: "configured", dimAt: 2100 },
          { from: "a", to: "d", evidence: "observed" },
        ]}
      />
      <At x={620} y={200} w={300} at={2000}>
        <Card className="p-3">
          <p className="mb-2 text-[11px] font-semibold">Categories</p>
          {["Compute", "Database", "Storage", "Messaging"].map((name) => (
            <div
              key={name}
              className="flex items-center justify-between py-1 text-xs"
            >
              {name}
              {name === "Storage" ? (
                <MockBadge tone="neutral">hidden</MockBadge>
              ) : (
                <Check size={13} className="text-success" />
              )}
            </div>
          ))}
        </Card>
      </At>
      <At x={760} y={400} w={160} at={4800} from="scale">
        <div className="border-border-soft bg-card-strong relative h-24 rounded-lg border">
          <span className="border-accent absolute top-4 left-6 h-10 w-16 rounded border-2" />
          <span className="text-muted-foreground absolute bottom-1 left-2 text-[10px]">
            minimap
          </span>
        </div>
      </At>
    </>
  );
}

/** The Resources inventory. */
export function InfraResourcesListScene() {
  const rows: [string, string, string, string, MockTone][] = [
    [
      "orders-db",
      "RDS · Database instance",
      "eu-central-1",
      "available",
      "success",
    ],
    ["orders-service", "ECS · Service", "eu-central-1", "active", "success"],
    ["batch-runner", "EC2 · Instance", "eu-central-1", "stopped", "neutral"],
    ["invoices-bucket", "S3 · Bucket", "eu-central-1", "active", "success"],
  ];
  return (
    <MockWindow
      url="app.dilanix.com/dashboard/products/infrastructure/resources"
      x={40}
      y={24}
      w={880}
      h={492}
    >
      <div className="space-y-3 p-5 text-xs">
        <div className="flex items-center justify-between">
          <div className="border-foreground/15 flex h-9 w-80 items-center gap-2 rounded-lg border px-3">
            <Search size={13} className="text-muted-foreground" />
            <Typing text="orders" at={700} />
          </div>
          <span className="text-muted-foreground">
            20 of 412 resources · Refresh
          </span>
        </div>
        <div
          className="border-border-soft flex flex-wrap items-center gap-4 border-t pt-3"
          style={anim("guide-fade-in", 1600, 400)}
        >
          {[
            ["Category", "Database"],
            ["Type", "All types"],
            ["Region", "Any region"],
          ].map(([label, value]) => (
            <span key={label} className="flex items-center gap-2">
              <span className="text-muted-foreground text-[10px] font-semibold uppercase">
                {label}
              </span>
              <span className="border-foreground/15 rounded-lg border px-2.5 py-1">
                {value}
              </span>
            </span>
          ))}
          <MockTabs
            tabs={["Active", "Missing", "Out of scope"]}
            active="Active"
          />
        </div>
        <div className="border-border-soft overflow-hidden rounded-xl border">
          <div className="text-muted-foreground border-border-soft grid grid-cols-[1.4fr_1.2fr_1fr_0.8fr_0.7fr] gap-3 border-b px-4 py-2 text-[10px] font-semibold uppercase">
            <span>Resource ↕</span>
            <span>Provider / type ↕</span>
            <span>Region ↕</span>
            <span>Status ↕</span>
            <span>Last seen ↕</span>
          </div>
          {rows.map(([name, type, region, status, tone], index) => (
            <div
              key={name}
              className="border-border-soft grid grid-cols-[1.4fr_1.2fr_1fr_0.8fr_0.7fr] items-center gap-3 border-b px-4 py-3 last:border-b-0"
              style={anim("guide-appear-up", 2400 + index * 300)}
            >
              <span className="font-semibold">{name}</span>
              <span className="text-muted-foreground">{type}</span>
              <span className="font-mono">{region}</span>
              <MockBadge tone={tone} className="w-fit">
                {status}
              </MockBadge>
              <span className="text-muted-foreground">12m ago</span>
            </div>
          ))}
        </div>
        <p
          className="text-muted-foreground"
          style={anim("guide-fade-in", 4200, 400)}
        >
          Search covers the loaded resources; filters ask Dilanix. 20 load at a
          time — Load more for the next.
        </p>
      </div>
    </MockWindow>
  );
}

/** Lifecycle against the provider's status. */
export function InfraLifecycleScene() {
  const states: { name: string; tone: MockTone; text: string; at: number }[] = [
    {
      name: "Active",
      tone: "success",
      text: "found by the latest complete sync",
      at: 300,
    },
    {
      name: "Missing",
      tone: "warning",
      text: "a complete sync of its account, region and type no longer found it",
      at: 1800,
    },
    {
      name: "Out of scope",
      tone: "neutral",
      text: "its region was excluded — Dilanix stopped watching",
      at: 3300,
    },
  ];
  return (
    <>
      {states.map((state, index) => (
        <At
          key={state.name}
          x={50 + index * 295}
          y={60}
          w={275}
          at={state.at}
          from="scale"
        >
          <Card className="h-[170px]">
            <MockBadge tone={state.tone} className="text-xs">
              {state.name}
            </MockBadge>
            <p className="text-muted-foreground mt-3 text-xs leading-5">
              {state.text}
            </p>
          </Card>
        </At>
      ))}
      <At x={50} y={260} w={860} at={4800}>
        <Card>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={16} className="text-success" /> Never deleted,
            never by accident
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Records stay as history, and a sync that fails part-way marks
            nothing missing.
          </p>
        </Card>
      </At>
      <At x={50} y={380} w={860} at={6400}>
        <Card>
          <div className="flex items-center justify-between text-xs">
            <span>
              <span className="block font-semibold">
                Status is the provider&apos;s own
              </span>
              <span className="text-muted-foreground">
                A terminated instance AWS still reports stays Active until a
                sync no longer finds it.
              </span>
            </span>
            <span className="flex gap-1.5">
              <MockBadge tone="warning">terminated</MockBadge>
              <MockBadge tone="success">Active</MockBadge>
            </span>
          </div>
        </Card>
      </At>
    </>
  );
}

/** A resource's own page. */
export function InfraResourcePageScene() {
  const sections = [
    "Technical configuration",
    "Provider details",
    "Identity",
    "Inventory record",
    "Tags",
  ];
  return (
    <MockWindow
      url="app.dilanix.com/dashboard/products/infrastructure/resources/…"
      x={40}
      y={24}
      w={880}
      h={492}
    >
      <div className="grid grid-cols-[1.4fr_1fr] gap-4 p-5">
        <div className="space-y-3">
          <div>
            <p className="text-base font-semibold">orders-db</p>
            <p className="text-muted-foreground text-[11px]">
              RDS · Database instance · eu-central-1
            </p>
          </div>
          <Card className="h-[240px]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Utilization metrics</p>
              <MockBadge tone="accent">CloudWatch</MockBadge>
            </div>
            <div className="mt-6">
              <LineChart
                points={[22, 30, 26, 41, 38, 44, 35, 52, 47, 40]}
                w={420}
                h={140}
                at={600}
              />
            </div>
          </Card>
          <p
            className="text-muted-foreground text-[11px]"
            style={anim("guide-fade-in", 2200, 400)}
          >
            Metrics need Metrics Read on the connection.
          </p>
        </div>
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={section}
              className="border-border-soft bg-card-strong rounded-xl border px-4 py-3 text-xs font-semibold"
              style={anim("guide-appear-left", 1200 + index * 450)}
            >
              {section}
            </div>
          ))}
        </div>
      </div>
    </MockWindow>
  );
}

/** What the graph powers. */
export function InfraPowersScene() {
  return (
    <>
      <Lines
        flow
        paths={[
          { d: "M 330 270 C 400 270 400 160 470 160", at: 900 },
          { d: "M 330 270 C 400 270 400 380 470 380", at: 1300 },
        ]}
      />
      <At x={60} y={210} w={270} at={0} from="scale">
        <Node
          icon={<Network size={16} />}
          tone="accent"
          title="Infrastructure graph"
          detail="who depends on whom"
        />
      </At>
      <At x={470} y={100} w={440} at={1100}>
        <Card>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb size={15} className="text-accent" /> Recommendations
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            Something depends on orders-db → Dilanix asks before advising any
            change to it.
          </p>
        </Card>
      </At>
      <At x={470} y={320} w={440} at={1500}>
        <Card>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Boxes size={15} className="text-accent" /> Environments
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            Resources that work together are grouped into an environment — e.g.
            dev — for one recommendation instead of many.
          </p>
        </Card>
      </At>
    </>
  );
}

/** Tours for both sections. */
export function InfraOutroScene() {
  return (
    <>
      {["Graph", "Resources"].map((name, index) => (
        <At
          key={name}
          x={190 + index * 300}
          y={140}
          w={280}
          at={300 + index * 400}
          from="scale"
        >
          <Card className="relative">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {index === 0
                ? "every control, step by step"
                : "scope, filters and lifecycle"}
            </p>
            <span className="absolute top-4 right-4">
              <MockBadge tone="success">tour</MockBadge>
            </span>
            <Highlight at={1300 + index * 300} />
          </Card>
        </At>
      ))}
      <At x={300} y={330} w={360} at={2200}>
        <div className="border-border-soft bg-card-strong rounded-2xl border p-3 shadow-[0_18px_44px_var(--shadow-card)]">
          <p className="text-muted-foreground px-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
            Help &amp; Support
          </p>
          <div className="mt-2 flex items-center justify-between rounded-xl px-2 py-1.5 text-xs">
            <span className="font-medium">Infrastructure</span>
            <span className="text-muted-foreground">1 video · 2 tours</span>
          </div>
        </div>
      </At>
    </>
  );
}
