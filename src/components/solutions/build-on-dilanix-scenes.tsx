"use client";

import Image from "next/image";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import {
  BadgeCheck,
  ChartPie,
  Check,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  CreditCard,
  Database,
  HeartPulse,
  LifeBuoy,
  Network,
  RefreshCw,
  Scale,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  anim,
  At,
  Cursor,
  Highlight,
  Lines,
  MockBadge,
  MockField,
  MockProgress,
  MockWindow,
  Node,
} from "@/components/guides/scene-kit";
import { cn } from "@/lib/utils";

function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "border-border-soft bg-card-strong rounded-2xl border p-4 shadow-[0_18px_44px_var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Where the project is: the step, as on the page's How we work. */
function Step({ children }: { children: ReactNode }) {
  return (
    <At x={40} y={24} from="fade">
      <p className="text-accent text-[11px] font-semibold tracking-[0.16em] uppercase">
        {children}
      </p>
    </At>
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

const SYSTEMS = [
  { name: "Payments", detail: "invoices and plans", icon: CreditCard },
  { name: "CRM", detail: "customers and owners", icon: Users },
  { name: "Support desk", detail: "tickets", icon: LifeBuoy },
  { name: "Product database", detail: "usage per customer", icon: Database },
  { name: "AWS", detail: "the cloud bill", icon: Cloud },
];

const CORE_BLOCKS = [
  "Accounts and roles",
  "Plans and limits",
  "Integrations",
  "Sync",
  "Allocation",
  "Recommendations",
];

/** Your systems → Dilanix Core → your product. */
export function IntroScene() {
  const centre = 271;
  return (
    <>
      <Lines
        flow
        paths={[
          ...SYSTEMS.map((_, index) => {
            const y = 87 + index * 92;
            return {
              d: `M 250 ${y} C 290 ${y} 290 ${centre} 330 ${centre}`,
              at: 900 + index * 150,
            };
          }),
          { d: `M 630 ${centre} L 710 ${centre}`, at: 3000 },
        ]}
      />
      {SYSTEMS.map((system, index) => (
        <At
          key={system.name}
          x={40}
          y={60 + index * 92}
          w={210}
          at={index * 150}
          from="left"
        >
          <Node
            icon={<system.icon size={15} />}
            title={system.name}
            detail={system.detail}
          />
        </At>
      ))}
      <At x={330} y={181} w={300} at={600} from="scale">
        <Card className="border-accent/40 shadow-[0_24px_60px_var(--shadow-brand)]">
          <div className="flex items-center justify-between">
            <Logo className="h-7 w-auto" />
            <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
              Core
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {CORE_BLOCKS.map((block, index) => (
              <span
                key={block}
                className="border-border-soft bg-background flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium"
                style={anim("guide-appear-scale", 1300 + index * 180, 300)}
              >
                <Check size={11} className="text-success shrink-0" />
                {block}
              </span>
            ))}
          </div>
        </Card>
      </At>
      <At x={330} y={374} w={300} at={2600} from="fade">
        <p className="text-muted-foreground text-center text-[11px]">
          Already running Cost and Infrastructure
        </p>
      </At>
      <At x={710} y={244} w={210} at={3200} from="scale">
        <Node
          tone="accent"
          icon={<ChartPie size={15} />}
          title="Customer margin"
          detail="your product"
        />
      </At>
      <At x={710} y={312} at={3800} from="fade">
        <MockBadge tone="accent">Built for you</MockBadge>
      </At>
    </>
  );
}

const SOURCES = [
  { name: "Payments", holds: "Invoices and plans", ready: false },
  { name: "CRM", holds: "Customers and owners", ready: false },
  { name: "Support desk", holds: "Tickets per customer", ready: false },
  { name: "Product database", holds: "Usage per customer", ready: false },
  { name: "AWS", holds: "The cloud bill, line by line", ready: true },
];

/** The brief: the goal, the decision, the systems behind them. */
export function DiscoveryScene() {
  return (
    <>
      <Step>Step 1 · Discovery</Step>
      <At x={40} y={64} w={420} at={0}>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Project brief</p>
            <MockBadge tone="neutral">Sample</MockBadge>
          </div>
          <div className="mt-4 space-y-3">
            <MockField
              label="Goal"
              value="See what each customer really costs"
              at={400}
            />
            <MockField
              label="Decide"
              value="Which customers to reprice"
              at={2500}
            />
            <MockField
              label="Used by"
              value="Finance, sales and support"
              at={4100}
            />
          </div>
        </Card>
      </At>
      <At x={500} y={64} w={420} at={4800}>
        <Card>
          <p className="text-sm font-semibold">Where the data lives</p>
          <div className="mt-3 space-y-2">
            {SOURCES.map((source, index) => (
              <div
                key={source.name}
                className="border-border-soft flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs"
                style={anim("guide-appear-left", 5100 + index * 350)}
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{source.name}</span>
                  <span className="text-muted-foreground text-[11px]">
                    {source.holds}
                  </span>
                </span>
                {source.ready ? (
                  <MockBadge tone="success">
                    <BadgeCheck size={11} /> Connector ready
                  </MockBadge>
                ) : (
                  <MockBadge tone="accent">Connector to build</MockBadge>
                )}
              </div>
            ))}
          </div>
        </Card>
      </At>
      <At x={40} y={470} w={880} at={7800} from="fade">
        <p className="text-muted-foreground text-xs">
          Discovery ends with a clear goal, the systems involved, and what the
          product must show and decide.
        </p>
      </At>
    </>
  );
}

const NEEDS = [
  { need: "Sign-in, organizations and roles", built: true },
  { need: "Plans and usage limits", built: true },
  { need: "The AWS bill", built: true },
  { need: "Sync with schedules and retries", built: true },
  { need: "Cost split per customer", built: true },
  { need: "Ranked suggestions", built: true },
  { need: "Payments, CRM and support connectors", built: false },
  { need: "Margin screens and repricing rules", built: false },
];

function Share({
  label,
  count,
  pct,
  at,
  barClassName,
}: {
  label: string;
  count: string;
  pct: number;
  at: number;
  barClassName: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className="font-mono text-sm font-semibold">{count}</span>
      </div>
      <div className="bg-foreground/10 mt-2 h-1.5 overflow-hidden rounded-full">
        <div
          className={cn("h-full origin-left rounded-full", barClassName)}
          style={{ width: `${pct}%`, ...anim("guide-grow-x", at, 900) }}
        />
      </div>
    </div>
  );
}

/** Every need mapped onto the platform: most are already built. */
export function DesignScene() {
  const built = NEEDS.filter((item) => item.built).length;
  return (
    <>
      <Step>Step 2 · Design</Step>
      <At x={40} y={64} w={560} at={0}>
        <Card className="p-0">
          <div className="border-border-soft text-muted-foreground flex justify-between border-b px-4 py-3 text-[11px] font-semibold tracking-wide uppercase">
            <span>What the product needs</span>
            <span>On Dilanix</span>
          </div>
          <div className="px-4 py-1">
            {NEEDS.map((item, index) => (
              <div
                key={item.need}
                className="border-border-soft flex items-center justify-between gap-3 border-b py-2 text-xs last:border-b-0"
                style={anim("guide-appear-left", 300 + index * 420)}
              >
                <span className="font-medium">{item.need}</span>
                <MockBadge
                  tone={item.built ? "success" : "accent"}
                  style={anim("guide-appear-scale", 550 + index * 420, 300)}
                >
                  {item.built ? (
                    <>
                      <Check size={11} /> Already built
                    </>
                  ) : (
                    "We build"
                  )}
                </MockBadge>
              </div>
            ))}
          </div>
        </Card>
      </At>
      <At x={630} y={64} w={290} at={4000}>
        <Card className="space-y-4">
          <Share
            label="Already built"
            count={`${built} of ${NEEDS.length}`}
            pct={(built / NEEDS.length) * 100}
            at={4300}
            barClassName="bg-success"
          />
          <Share
            label="We build for you"
            count={`${NEEDS.length - built} of ${NEEDS.length}`}
            pct={((NEEDS.length - built) / NEEDS.length) * 100}
            at={4800}
            barClassName="bg-accent"
          />
        </Card>
      </At>
      <At x={630} y={232} w={290} at={6600}>
        <Card className="flex items-start gap-2.5">
          <span className="bg-success/12 text-success flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Check size={15} />
          </span>
          <span className="text-xs leading-5">
            <span className="block font-semibold">Scope agreed with you</span>
            <span className="text-muted-foreground">
              The part to build and its timeline, before the build starts.
            </span>
          </span>
        </Card>
      </At>
    </>
  );
}

const CONNECTORS = [
  {
    name: "Payments",
    icon: CreditCard,
    dataset: "Invoices",
    source: "from Payments",
  },
  { name: "CRM", icon: Users, dataset: "Customers", source: "from CRM" },
  {
    name: "Support desk",
    icon: LifeBuoy,
    dataset: "Tickets",
    source: "from Support desk",
  },
  {
    name: "AWS",
    icon: Cloud,
    dataset: "Cloud bill",
    source: "FOCUS export",
  },
];

/** Connectors verified, then synced like any Dilanix dataset. */
export function ConnectScene() {
  return (
    <>
      <Step>Step 3 · Build</Step>
      <Lines
        flow
        paths={CONNECTORS.map((_, index) => {
          const from = 107 + index * 100;
          const to = 137 + index * 58;
          return {
            d: `M 270 ${from} C 355 ${from} 355 ${to} 440 ${to}`,
            at: 2600 + index * 200,
          };
        })}
      />
      {CONNECTORS.map((connector, index) => (
        <At
          key={connector.name}
          x={40}
          y={80 + index * 100}
          w={230}
          at={200 + index * 250}
          from="left"
        >
          <div className="relative">
            <Node
              icon={<connector.icon size={15} />}
              title={connector.name}
              detail="connection"
            />
            <MockBadge
              tone="success"
              className="absolute top-4 right-3"
              style={anim("guide-appear-scale", 1500 + index * 300, 300)}
            >
              <BadgeCheck size={11} /> Verified
            </MockBadge>
          </div>
        </At>
      ))}
      <At x={440} y={64} w={480} at={2200}>
        <Card className="px-4 py-0">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold">
              Sync · Customer margin
            </span>
            <MockBadge tone="accent">
              <RefreshCw size={11} /> Every hour
            </MockBadge>
          </div>
          {CONNECTORS.map((connector, index) => {
            const start = 3200 + index * 500;
            return (
              <div
                key={connector.name}
                className="border-border-soft flex h-[58px] items-center gap-3 border-t"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold">
                    {connector.dataset}
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    {connector.source}
                  </span>
                </span>
                <MockProgress at={start} duration={1400} className="w-32" />
                <span className="w-[84px] text-right">
                  <MockBadge
                    tone="success"
                    style={anim("guide-appear-scale", start + 1400, 300)}
                  >
                    Succeeded
                  </MockBadge>
                </span>
              </div>
            );
          })}
        </Card>
      </At>
      <div className="absolute top-[400px] left-[440px] flex w-[480px] flex-wrap gap-2">
        {["Checkpoints", "Automatic retries", "Isolated per organization"].map(
          (fact, index) => (
            <MockBadge
              key={fact}
              tone="neutral"
              style={anim("guide-appear-up", 6800 + index * 250, 400)}
            >
              {index === 2 ? <ShieldCheck size={11} /> : <Check size={11} />}
              {fact}
            </MockBadge>
          ),
        )}
      </div>
    </>
  );
}

const RULES = [
  {
    priority: 10,
    label: "Customer tag",
    scope: "Cloud resources tagged with a customer",
  },
  {
    priority: 20,
    label: "Support tickets",
    scope: "Support cost by each ticket's customer",
  },
];

const CUSTOMER_COSTS = [
  { name: "Brightline", cloud: 3300, support: 820 },
  { name: "Kestrel Labs", cloud: 1700, support: 1160 },
  { name: "Orbit Foods", cloud: 900, support: 1040 },
  { name: "Juniper Health", cloud: 1050, support: 260 },
];
const UNALLOCATED = 420;

function usd(amount: number) {
  return `$${amount.toLocaleString("en-US")}`;
}

/** Rules claim every cost for a customer; the rest stays visible. */
export function AllocateScene() {
  const max = Math.max(...CUSTOMER_COSTS.map((row) => row.cloud + row.support));
  const total =
    CUSTOMER_COSTS.reduce((sum, row) => sum + row.cloud + row.support, 0) +
    UNALLOCATED;
  return (
    <>
      <Step>Allocation</Step>
      <At x={40} y={64} w={400} at={0}>
        <Card>
          <p className="text-sm font-semibold">Allocation rules</p>
          <div className="mt-3 space-y-2">
            {RULES.map((rule, index) => (
              <div
                key={rule.label}
                className="border-border-soft flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs"
                style={anim("guide-appear-left", 400 + index * 450)}
              >
                <span className="bg-accent/12 text-accent flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-semibold">
                  {rule.priority}
                </span>
                <span>
                  <span className="block font-semibold">{rule.label}</span>
                  <span className="text-muted-foreground text-[11px]">
                    {rule.scope}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p
            className="text-muted-foreground mt-3 text-[11px]"
            style={anim("guide-fade-in", 1500, 400)}
          >
            The first matching rule claims each cost.
          </p>
        </Card>
      </At>
      <At x={470} y={64} w={450} at={1900}>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Cost per customer</p>
            <span className="text-muted-foreground font-mono text-xs">
              {Math.round(((total - UNALLOCATED) / total) * 100)}% allocated
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {CUSTOMER_COSTS.map((row, index) => {
              const at = 2200 + index * 400;
              return (
                <div
                  key={row.name}
                  className="grid grid-cols-[104px_1fr_64px] items-center gap-3 text-xs"
                  style={anim("guide-appear-up", at)}
                >
                  <span className="font-medium">{row.name}</span>
                  <span className="flex h-3 overflow-hidden rounded-full">
                    <span
                      className="bg-accent h-full origin-left"
                      style={{
                        width: `${(row.cloud / max) * 100}%`,
                        ...anim("guide-grow-x", at + 200, 500),
                      }}
                    />
                    <span
                      className="h-full origin-left bg-violet-500"
                      style={{
                        width: `${(row.support / max) * 100}%`,
                        ...anim("guide-grow-x", at + 500, 500),
                      }}
                    />
                  </span>
                  <span className="text-right font-mono">
                    {usd(row.cloud + row.support)}
                  </span>
                </div>
              );
            })}
            <div
              className="border-border-soft grid grid-cols-[104px_1fr_64px] items-center gap-3 border-t pt-3 text-xs"
              style={anim("guide-appear-up", 4000)}
            >
              <span className="font-medium">Unallocated</span>
              <span>
                <MockBadge tone="warning">Needs a rule</MockBadge>
              </span>
              <span className="text-right font-mono">{usd(UNALLOCATED)}</span>
            </div>
          </div>
          <div
            className="text-muted-foreground mt-4 flex items-center gap-4 text-[11px]"
            style={anim("guide-fade-in", 4400, 400)}
          >
            <span className="flex items-center gap-1.5">
              <span className="bg-accent size-2.5 rounded-full" /> Cloud
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-violet-500" /> Support
            </span>
          </div>
        </Card>
      </At>
      <At x={40} y={470} w={880} at={6800} from="fade">
        <p className="text-muted-foreground text-xs">
          Every cost lands on a customer — or shows up as Unallocated, never
          lost.
        </p>
      </At>
    </>
  );
}

const MARGINS = [
  { name: "Brightline", revenue: 18400, cost: 4120 },
  { name: "Kestrel Labs", revenue: 12900, cost: 2860 },
  { name: "Orbit Foods", revenue: 1730, cost: 1940 },
  { name: "Juniper Health", revenue: 9600, cost: 1310 },
];

function marginPct(revenue: number, cost: number) {
  return Math.round(((revenue - cost) / revenue) * 100);
}

/** The product's own page, beside Cost and Infrastructure. */
export function ScreensScene() {
  const revenue = MARGINS.reduce((sum, row) => sum + row.revenue, 0);
  const cost = MARGINS.reduce((sum, row) => sum + row.cost, 0) + UNALLOCATED;
  const kpis = [
    { label: "Revenue", value: usd(revenue) },
    { label: "Cost", value: usd(cost) },
    { label: "Margin", value: `${marginPct(revenue, cost)}%` },
  ];
  return (
    <>
      <MockWindow
        url="app.dilanix.com/dashboard/customer-margin"
        x={40}
        y={20}
        w={880}
        h={500}
      >
        <div className="flex h-full">
          <div className="border-border-soft w-44 shrink-0 space-y-1 border-r p-3 text-xs">
            <p className="text-muted-foreground px-2 pb-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
              Products
            </p>
            <span className="text-muted-foreground flex items-center gap-2 rounded-lg px-2 py-1.5">
              <CircleDollarSign size={14} /> Cost
            </span>
            <span className="text-muted-foreground flex items-center gap-2 rounded-lg px-2 py-1.5">
              <Network size={14} /> Infrastructure
            </span>
            <span
              className="bg-accent/10 text-accent flex items-center gap-2 rounded-lg px-2 py-1.5 font-semibold"
              style={anim("guide-appear-scale", 500, 400)}
            >
              <ChartPie size={14} /> Customer margin
            </span>
          </div>
          <div className="min-w-0 flex-1 p-5">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold">Customer margin</p>
              <MockBadge tone="neutral">This month</MockBadge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {kpis.map((kpi, index) => (
                <div
                  key={kpi.label}
                  className="border-border-soft rounded-xl border px-3 py-2.5"
                  style={anim("guide-appear-up", 900 + index * 200)}
                >
                  <p className="text-muted-foreground text-[11px]">
                    {kpi.label}
                  </p>
                  <p className="mt-0.5 font-mono text-lg font-semibold">
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-border-soft mt-4 rounded-xl border text-xs">
              <div className="border-border-soft text-muted-foreground grid grid-cols-[1.6fr_1fr_1fr_1.4fr] gap-3 border-b px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase">
                <span>Customer</span>
                <span className="text-right">Revenue</span>
                <span className="text-right">Cost</span>
                <span className="text-right">Margin</span>
              </div>
              {MARGINS.map((row, index) => {
                const pct = marginPct(row.revenue, row.cost);
                const losing = pct < 0;
                return (
                  <div
                    key={row.name}
                    data-cursor={losing ? "losing-row" : undefined}
                    className="border-border-soft relative grid grid-cols-[1.6fr_1fr_1fr_1.4fr] items-center gap-3 border-b px-4 py-3 last:border-b-0"
                    style={anim("guide-appear-left", 1800 + index * 300)}
                  >
                    {losing ? <Highlight at={4700} /> : null}
                    <span className="font-medium">{row.name}</span>
                    <span className="text-right font-mono">
                      {usd(row.revenue)}
                    </span>
                    <span className="text-right font-mono">
                      {usd(row.cost)}
                    </span>
                    <span className="flex items-center justify-end gap-2">
                      {losing ? (
                        <MockBadge
                          tone="danger"
                          style={anim("guide-appear-scale", 5200, 300)}
                        >
                          Loses money
                        </MockBadge>
                      ) : null}
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          losing ? "text-red-500" : "text-success",
                        )}
                      >
                        {losing ? "−" : ""}
                        {Math.abs(pct)}%
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </MockWindow>
      <Cursor
        points={[
          { x: 760, y: 470, at: 0 },
          { x: 760, y: 470, at: 3600 },
          { to: "losing-row", dx: -150, at: 4500, click: true },
          { to: "losing-row", dx: -110, at: 9000 },
        ]}
      />
    </>
  );
}

const PIPELINE = [
  { label: "Detect", icon: Search },
  { label: "Review", icon: ShieldCheck },
  { label: "Rank", icon: Scale },
];

const SUGGESTIONS = [
  {
    title: "Move Orbit Foods to the Growth plan",
    reason: "Costs $1,940 a month and pays $1,730",
    impact: "+$650/mo",
    confidence: "High confidence",
    effort: "Low effort",
  },
  {
    title: "Bring Kestrel Labs' support back to plan",
    reason: "Tickets at three times their plan's average",
    impact: "+$380/mo",
    confidence: "Medium confidence",
    effort: "Medium effort",
  },
  {
    title: "Tag the shared reporting database",
    reason: "$420 a month is Unallocated",
    impact: "$420/mo allocated",
    confidence: "High confidence",
    effort: "Low effort",
  },
];

/** Your rules on the engine: detected, reviewed, ranked, explained. */
export function RecommendScene() {
  return (
    <>
      <At x={40} y={24} at={0} from="fade">
        <div className="flex items-center gap-2">
          {PIPELINE.map((stage, index) => (
            <span key={stage.label} className="flex items-center gap-2">
              {index > 0 ? (
                <ChevronRight
                  size={14}
                  className="text-muted-foreground"
                  style={anim("guide-fade-in", index * 500, 300)}
                />
              ) : null}
              <span
                className="border-accent/40 bg-accent/10 text-accent flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                style={anim("guide-appear-scale", index * 500, 350)}
              >
                <stage.icon size={13} /> {stage.label}
              </span>
            </span>
          ))}
        </div>
      </At>
      <At x={40} y={76} w={880} at={1400}>
        <Card className="px-4 py-0">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold">
              Recommendations · Customer margin
            </span>
            <span className="text-muted-foreground text-xs">
              Ranked by impact, confidence and effort
            </span>
          </div>
          {SUGGESTIONS.map((item, index) => (
            <div
              key={item.title}
              className="border-border-soft relative grid grid-cols-[32px_1fr_auto] items-center gap-3 border-t py-3"
              style={anim("guide-appear-left", 1800 + index * 600)}
            >
              {index === 0 ? <Highlight at={4300} /> : null}
              <span className="bg-accent/12 text-accent flex size-7 items-center justify-center rounded-lg font-mono text-xs font-semibold">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {item.title}
                </span>
                <span className="text-muted-foreground block text-[11px]">
                  {item.reason}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <MockBadge tone="success">{item.impact}</MockBadge>
                <MockBadge tone="accent">{item.confidence}</MockBadge>
                <MockBadge tone="neutral">{item.effort}</MockBadge>
              </span>
            </div>
          ))}
        </Card>
      </At>
      <At x={40} y={352} w={880} at={4600}>
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={15} className="text-accent" /> Why Orbit Foods
            </span>
            <MockBadge
              tone="success"
              style={anim("guide-appear-scale", 6600, 300)}
            >
              <BadgeCheck size={11} /> Checked against your data
            </MockBadge>
          </div>
          <p
            className="text-muted-foreground mt-2 text-xs leading-5"
            style={anim("guide-fade-in", 5000, 500)}
          >
            Their support tickets doubled since March while their plan stayed
            the same, so this month they cost $210 more than they pay. The
            Growth plan covers the support they use.
          </p>
        </Card>
      </At>
    </>
  );
}

const MEMBERS = [
  { initials: "MR", team: "Finance", role: "Admin" },
  { initials: "LK", team: "Sales", role: "Member" },
  { initials: "AP", team: "Support", role: "Viewer" },
];

const PRODUCTS = [
  { name: "Cost", icon: CircleDollarSign, yours: false },
  { name: "Infrastructure", icon: Network, yours: false },
  { name: "Customer margin", icon: ChartPie, yours: true },
];

const RUNNING = [
  { icon: Server, text: "Hosted and operated by Dilanix" },
  { icon: HeartPulse, text: "Every sync healthy" },
  { icon: Sparkles, text: "New features planned with you" },
];

/** Live in the customer's organization, run by Dilanix. */
export function LaunchScene() {
  return (
    <>
      <Step>Step 4 · Launch and run</Step>
      <At x={150} y={60} w={660} at={0} from="scale">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Logo className="h-6 w-auto" />
            <span className="bg-foreground/15 h-5 w-px" />
            <span className="text-sm font-semibold">Acme Subscriptions</span>
            <MockBadge tone="neutral" className="ml-auto">
              Your organization
            </MockBadge>
          </div>
          <p className="text-muted-foreground mt-5 text-[10px] font-semibold tracking-[0.14em] uppercase">
            Products
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {PRODUCTS.map((product, index) => (
              <div
                key={product.name}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5",
                  product.yours
                    ? "border-accent/45 bg-accent/10"
                    : "border-border-soft",
                )}
                style={anim("guide-appear-scale", 300 + index * 250, 350)}
              >
                <span className="bg-accent/12 text-accent flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <product.icon size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">
                    {product.name}
                  </span>
                  {product.yours ? (
                    <MockBadge
                      tone="success"
                      className="mt-0.5"
                      style={anim("guide-appear-scale", 1400, 300)}
                    >
                      Live
                    </MockBadge>
                  ) : (
                    <span className="text-muted-foreground block text-[11px]">
                      Included
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <p
            className="text-muted-foreground mt-5 text-[10px] font-semibold tracking-[0.14em] uppercase"
            style={anim("guide-fade-in", 2000, 300)}
          >
            Your team
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {MEMBERS.map((member, index) => (
              <div
                key={member.initials}
                className="border-border-soft flex items-center gap-2.5 rounded-xl border px-3 py-2"
                style={anim("guide-appear-up", 2300 + index * 350)}
              >
                <span className="bg-foreground/8 flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold">
                  {member.initials}
                </span>
                <span className="min-w-0 flex-1 text-xs font-medium">
                  {member.team}
                </span>
                <MockBadge tone="accent">{member.role}</MockBadge>
              </div>
            ))}
          </div>
        </Card>
      </At>
      <div className="absolute top-[392px] left-[150px] grid w-[660px] grid-cols-3 gap-3">
        {RUNNING.map((item, index) => (
          <Card
            key={item.text}
            className="flex items-center gap-2.5 p-3"
            style={anim("guide-appear-up", 4800 + index * 300, 450)}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                index === 1
                  ? "bg-success/12 text-success"
                  : "bg-accent/12 text-accent",
              )}
            >
              <item.icon size={15} />
            </span>
            <span className="text-xs leading-4 font-medium">{item.text}</span>
          </Card>
        ))}
      </div>
    </>
  );
}

/** The explainer's visuals, by scene id (`buildOnDilanixVideo`). */
export const BUILD_ON_DILANIX_VISUALS: Record<string, ComponentType> = {
  intro: IntroScene,
  discovery: DiscoveryScene,
  design: DesignScene,
  connect: ConnectScene,
  allocate: AllocateScene,
  screens: ScreensScene,
  recommend: RecommendScene,
  launch: LaunchScene,
};
