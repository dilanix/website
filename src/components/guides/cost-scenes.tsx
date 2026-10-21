"use client";

import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bookmark,
  Check,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Mail,
  PieChart,
  RefreshCw,
  Send,
  Wallet,
} from "lucide-react";
import {
  anim,
  At,
  Bars,
  Cursor,
  Highlight,
  LineChart,
  Lines,
  MockBadge,
  MockButton,
  MockField,
  MockTabs,
  MockWindow,
  Node,
  ProviderTile,
  Until,
  type MockTone,
} from "./scene-kit";

const SECTIONS = [
  {
    name: "Overview",
    text: "How much, against last period",
    icon: <LayoutDashboard size={16} />,
  },
  {
    name: "Explorer",
    text: "Any spend question",
    icon: <BarChart3 size={16} />,
  },
  { name: "Budgets", text: "Limits and alerts", icon: <Wallet size={16} /> },
  {
    name: "Allocations",
    text: "Which team spent what",
    icon: <PieChart size={16} />,
  },
  {
    name: "Anomalies",
    text: "Unexpected spikes",
    icon: <Activity size={16} />,
  },
  {
    name: "Saved Views",
    text: "Questions you ask often",
    icon: <Bookmark size={16} />,
  },
  {
    name: "Reports",
    text: "Delivered as CSV or PDF",
    icon: <FileText size={16} />,
  },
];

function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-border-soft bg-card-strong rounded-2xl border p-4 shadow-[0_18px_44px_var(--shadow-card)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function Money({
  amount,
  currency = "USD",
  className,
}: {
  amount: string;
  currency?: string;
  className?: string;
}) {
  return (
    <span className={`font-mono font-semibold ${className ?? ""}`}>
      {amount}{" "}
      <span className="text-muted-foreground text-[0.7em]">{currency}</span>
    </span>
  );
}

/** The seven sections of Cost. */
export function CostIntroScene() {
  return (
    <>
      <At x={60} y={40} w={840} at={0} from="fade">
        <p className="text-accent text-[11px] font-semibold tracking-[0.16em] uppercase">
          Cost
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          Seven sections, one bill
        </p>
      </At>
      {SECTIONS.map((section, index) => (
        <At
          key={section.name}
          x={60 + (index % 4) * 212}
          y={140 + Math.floor(index / 4) * 150}
          w={196}
          at={600 + index * 350}
          from="scale"
        >
          <Card className="h-[120px]">
            <span className="bg-accent/12 text-accent flex size-9 items-center justify-center rounded-lg">
              {section.icon}
            </span>
            <p className="mt-3 text-sm font-semibold">{section.name}</p>
            <p className="text-muted-foreground text-[11px]">{section.text}</p>
          </Card>
        </At>
      ))}
    </>
  );
}

/** Two billing datasets, one source per number. */
export function CostDataScene() {
  return (
    <>
      <Lines
        flow
        paths={[
          { d: "M 230 270 C 280 270 280 150 330 150", at: 900 },
          { d: "M 230 270 C 280 270 280 390 330 390", at: 1300 },
          { d: "M 590 150 C 630 150 630 260 660 260", at: 3200 },
          { d: "M 590 390 C 630 390 630 280 660 280", at: 3200 },
        ]}
      />
      <At x={40} y={200} w={190} at={0}>
        <Card>
          <ProviderTile code="AWS" />
          <p className="mt-3 text-sm font-semibold">Account that pays</p>
          <p className="text-muted-foreground text-[11px]">
            the management account of your organization
          </p>
        </Card>
      </At>
      <At x={330} y={110} w={260} at={1000} from="scale">
        <Node
          icon={<CircleDollarSign size={16} />}
          title="Cost Explorer summary"
          detail="billing.cost_summary · daily totals"
        />
      </At>
      <At x={330} y={350} w={260} at={1400} from="scale">
        <Node
          icon={<FileText size={16} />}
          title="FOCUS export"
          detail="billing.cost_usage · every line item"
        />
      </At>
      <At x={660} y={170} w={260} at={3300} from="scale">
        <Card>
          <p className="text-muted-foreground text-[11px]">
            Complete for everything in view?
          </p>
          <div className="mt-2 flex gap-2 text-[11px]">
            <MockBadge tone="success">yes → FOCUS</MockBadge>
            <MockBadge tone="neutral">no → Cost Explorer</MockBadge>
          </div>
          <div
            className="border-border-soft mt-4 border-t pt-3"
            style={anim("guide-appear-up", 4600)}
          >
            <Money amount="12,480.22" className="text-xl" />
            <p className="text-muted-foreground mt-1 text-[11px]">
              Source: FOCUS · never mixed
            </p>
          </div>
          <div style={anim("guide-appear-up", 5400)}>
            <Money amount="1,020.00" currency="EUR" className="mt-2 block" />
            <p className="text-muted-foreground text-[11px]">
              a second currency — its own total
            </p>
          </div>
        </Card>
      </At>
      <At x={330} y={470} w={560} at={6800} from="fade">
        <span className="text-muted-foreground flex items-center gap-2 text-[11px]">
          <RefreshCw size={13} className="text-accent" /> Recent months are read
          again on every sync — AWS corrects charges late.
        </span>
      </At>
    </>
  );
}

/** Choosing whose spend; it carries over. */
export function CostScopeScene() {
  const options = [
    { label: "All connections", depth: 0 },
    { label: "AWS Production", depth: 0 },
    { label: "Prod · 111111111111", depth: 1 },
    { label: "Dev · 222222222222", depth: 1 },
    { label: "AWS Finance", depth: 0 },
  ];
  return (
    <>
      <At x={80} y={50} w={420} at={0}>
        <Card>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Cost data scope
          </p>
          <div
            data-cursor="scope"
            className="border-foreground/15 bg-background mt-2 flex h-10 items-center justify-between rounded-xl border px-3 text-sm"
          >
            <span className="relative">
              <Until until={3600}>All connections</Until>
              <span
                className="absolute top-0 left-0 whitespace-nowrap"
                style={anim("guide-fade-in", 3600, 200)}
              >
                AWS Production · Prod
              </span>
            </span>
            <span className="text-muted-foreground">▾</span>
          </div>
          <div
            className="border-foreground/10 mt-1.5 overflow-hidden rounded-xl border"
            style={anim("guide-appear-up", 900, 300)}
          >
            <Until until={3700}>
              {options.map((option) => (
                <div
                  key={option.label}
                  data-cursor={
                    option.label.startsWith("Prod") ? "prod" : undefined
                  }
                  className="px-3 py-2 text-xs"
                  style={{ paddingLeft: 12 + option.depth * 18 }}
                >
                  {option.label}
                </div>
              ))}
            </Until>
          </div>
        </Card>
      </At>
      <At x={560} y={60} w={340} at={4200}>
        <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-wide uppercase">
          The same scope on
        </p>
        {["Overview", "Explorer", "Allocations"].map((page, index) => (
          <div
            key={page}
            className="mb-2"
            style={anim("guide-appear-left", 4300 + index * 300)}
          >
            <Node
              tone="success"
              icon={<Check size={15} />}
              title={page}
              detail="AWS Production · Prod"
            />
          </div>
        ))}
      </At>
      <At x={80} y={420} w={820} at={6000} from="fade">
        <p className="text-muted-foreground text-xs">
          Only connections with billing access are listed.
        </p>
      </At>
      <Cursor
        points={[
          { x: 300, y: 500, at: 0 },
          { to: "scope", at: 700, click: true },
          { to: "scope", at: 1400 },
          { to: "prod", at: 3000, click: true },
          { to: "prod", at: 3600 },
          { x: 300, y: 500, at: 5200 },
        ]}
      />
    </>
  );
}

/** Effective, billed, list and contracted cost side by side. */
export function CostMeasuresScene() {
  const measures = [
    {
      name: "Effective",
      amount: "8,920",
      text: "What you really pay — discounts in, commitments spread over the time they cover",
      main: true,
    },
    { name: "Billed", amount: "9,400", text: "What the invoice shows" },
    { name: "List", amount: "11,300", text: "Public on-demand prices" },
    { name: "Contracted", amount: "10,150", text: "Your negotiated rates" },
  ];
  return (
    <>
      {measures.map((measure, index) => (
        <At
          key={measure.name}
          x={50 + index * 220}
          y={110}
          w={200}
          at={500 + index * 900}
          from="scale"
        >
          <div
            className={
              measure.main
                ? "border-accent/50 bg-accent/10 relative h-[260px] rounded-2xl border p-4 shadow-[0_18px_44px_var(--shadow-brand)]"
                : "border-border-soft bg-card-strong h-[260px] rounded-2xl border p-4"
            }
          >
            <p className="text-sm font-semibold">{measure.name} cost</p>
            {measure.main ? (
              <MockBadge tone="accent" className="mt-1">
                default
              </MockBadge>
            ) : null}
            <Money amount={measure.amount} className="mt-6 block text-2xl" />
            <p className="text-muted-foreground mt-4 text-xs leading-5">
              {measure.text}
            </p>
          </div>
        </At>
      ))}
      <At x={50} y={420} w={860} at={4400} from="fade">
        <p className="text-muted-foreground text-xs">
          The same spend, four ways — pick one in Explorer, Allocations and the
          overview.
        </p>
      </At>
    </>
  );
}

/** Period chips, totals per currency and budget pacing. */
export function CostPeriodScene() {
  return (
    <>
      <At x={50} y={36} w={860} at={0}>
        <MockTabs
          tabs={[
            "Month to date",
            "1 day",
            "3 days",
            "Week",
            "30 days",
            "Custom",
          ]}
          active="Month to date"
        />
      </At>
      <At x={50} y={100} w={400} at={700}>
        <Card>
          <p className="text-muted-foreground text-[11px]">Spend this period</p>
          <Money amount="12,480.22" className="mt-2 block text-3xl" />
          <p className="text-success mt-1 text-xs font-medium">
            ▼ 4.2% vs the previous 20 days
          </p>
          <div
            className="border-border-soft mt-4 border-t pt-3"
            style={anim("guide-appear-up", 1800)}
          >
            <Money amount="1,020.00" currency="EUR" className="text-lg" />
            <p className="text-xs font-medium text-amber-600 dark:text-amber-300">
              ▲ 2.1% — a separate total
            </p>
          </div>
        </Card>
      </At>
      <At x={480} y={100} w={430} at={2600}>
        <Card className="h-[300px]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Budget pacing</p>
            <MockBadge tone="warning">Forecast to overrun</MockBadge>
          </div>
          <div className="relative mt-4 h-[200px]">
            <div className="border-foreground/30 absolute inset-x-0 top-[40px] border-t border-dashed" />
            <span className="text-muted-foreground absolute top-[24px] right-0 text-[10px]">
              budget 14,000
            </span>
            <div className="absolute bottom-0 left-0">
              <LineChart
                points={[0, 12, 25, 36, 52, 61, 76, 88, 104, 118]}
                w={250}
                h={150}
                at={3000}
              />
            </div>
            <div className="absolute top-[-10px] left-[250px]">
              <span style={anim("guide-fade-in", 4500, 400)} className="block">
                <svg width="140" height="60" className="overflow-visible">
                  <path
                    d="M 0 60 L 140 0"
                    className="stroke-amber-500"
                    strokeWidth={2.5}
                    strokeDasharray="6 5"
                  />
                </svg>
              </span>
            </div>
          </div>
        </Card>
      </At>
      <At x={50} y={430} w={860} at={5200} from="fade">
        <p className="text-muted-foreground text-xs">
          Every panel compares the period with the one just before, of equal
          length. Green means spend went down.
        </p>
      </At>
    </>
  );
}

/** Summary, Services, Resources, Trends. */
export function CostViewsScene() {
  const panels = [
    {
      tab: "Summary",
      at: 0,
      until: 2400,
      rows: ["Totals", "Breakdown", "Drivers", "Trend"],
    },
    {
      tab: "Services",
      at: 2400,
      until: 4600,
      rows: ["Amazon EC2 · 4,980", "Amazon RDS · 2,050", "AWS Lambda · 640"],
    },
    {
      tab: "Resources",
      at: 4600,
      until: 6800,
      rows: ["i-0a1 api · 1,210", "db-orders · 980", "nat-0f2 · 410"],
    },
    { tab: "Trends", at: 6800, until: 0, rows: [] },
  ];
  return (
    <>
      <MockWindow
        url="app.dilanix.com/dashboard/products/cost"
        x={60}
        y={30}
        w={840}
        h={480}
      >
        <div className="p-5">
          <div className="relative h-9">
            {panels.map((panel, index) => (
              <div
                key={panel.tab}
                className="absolute inset-0"
                style={
                  index === 0 ? undefined : anim("guide-fade-in", panel.at, 150)
                }
              >
                {panel.until ? (
                  <Until until={panel.until}>
                    <MockTabs
                      tabs={["Summary", "Services", "Resources", "Trends"]}
                      active={panel.tab}
                      cursorPrefix={index === 0 ? "view" : undefined}
                    />
                  </Until>
                ) : (
                  <MockTabs
                    tabs={["Summary", "Services", "Resources", "Trends"]}
                    active={panel.tab}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="relative mt-5 h-[330px]">
            {panels.map((panel, index) => (
              <div
                key={panel.tab}
                className="absolute inset-0"
                style={
                  index === 0
                    ? undefined
                    : anim("guide-appear-up", panel.at, 400)
                }
              >
                {panel.until ? (
                  <Until until={panel.until} className="h-full">
                    <div className="grid grid-cols-2 gap-3">
                      {panel.rows.map((row) => (
                        <div
                          key={row}
                          className="border-border-soft bg-card-strong rounded-xl border p-4 text-sm font-medium"
                        >
                          {row}
                        </div>
                      ))}
                    </div>
                    {panel.tab !== "Summary" ? (
                      <p className="text-muted-foreground mt-3 text-[11px]">
                        Detailed charges for one connection.
                      </p>
                    ) : null}
                  </Until>
                ) : (
                  <div className="border-border-soft bg-card-strong h-full rounded-xl border p-5">
                    <p className="text-sm font-semibold">
                      This period vs the one before
                    </p>
                    <div className="relative mt-6">
                      <LineChart
                        points={[3, 5, 4, 7, 8, 7, 10, 12]}
                        w={720}
                        h={180}
                        at={7100}
                      />
                      <div className="absolute inset-0">
                        <LineChart
                          points={[4, 4, 5, 6, 6, 7, 8, 9]}
                          w={720}
                          h={180}
                          at={7400}
                          className="stroke-muted-foreground/50"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </MockWindow>
      <Cursor
        points={[
          { x: 400, y: 500, at: 0 },
          { to: "view-Services", at: 2100, click: true },
          { to: "view-Services", at: 2600 },
          { to: "view-Resources", at: 4300, click: true },
          { to: "view-Resources", at: 4800 },
          { to: "view-Trends", at: 6500, click: true },
          { to: "view-Trends", at: 7000 },
          { x: 400, y: 500, at: 8600 },
        ]}
      />
    </>
  );
}

/** The Needs attention strip, then all clear. */
export function CostAttentionScene() {
  return (
    <>
      <At x={60} y={80} w={840} at={0}>
        <Card>
          <p className="text-sm font-semibold">Needs attention</p>
          <div className="mt-3 space-y-2">
            {[
              {
                icon: <Wallet size={15} />,
                text: "Production AWS — monthly · forecast to overrun by 8%",
                tone: "warning" as MockTone,
                badge: "Budget",
                at: 600,
              },
              {
                icon: <AlertTriangle size={15} />,
                text: "Oct 18 · 1,920 USD against 676 expected · +184%",
                tone: "danger" as MockTone,
                badge: "Anomaly",
                at: 1300,
              },
            ].map((item) => (
              <div
                key={item.badge}
                className="border-border-soft flex items-center justify-between rounded-xl border px-4 py-3 text-xs"
                style={anim("guide-appear-left", item.at)}
              >
                <span className="flex items-center gap-2">
                  <span className="text-amber-500">{item.icon}</span>
                  {item.text}
                </span>
                <span className="flex items-center gap-2">
                  <MockBadge tone={item.tone}>{item.badge}</MockBadge>
                  <span className="text-accent text-[11px] font-medium">
                    Open →
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </At>
      <At x={60} y={330} w={840} at={4200} from="scale">
        <div className="border-success/40 bg-success/[0.07] flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm">
          <span className="bg-success text-accent-foreground flex size-7 items-center justify-center rounded-full">
            <Check size={15} />
          </span>
          When nothing needs you: one all-clear line.
        </div>
      </At>
    </>
  );
}

const BREAKDOWN = [
  {
    name: "Amazon EC2",
    last: "4,210",
    now: "4,980",
    status: "Up",
    tone: "warning" as MockTone,
    change: "+18%",
  },
  {
    name: "Amazon RDS",
    last: "2,100",
    now: "2,050",
    status: "Down",
    tone: "success" as MockTone,
    change: "−2%",
  },
  {
    name: "AWS Lambda",
    last: "—",
    now: "640",
    status: "New",
    tone: "accent" as MockTone,
    change: "",
  },
  {
    name: "Amazon S3",
    last: "820",
    now: "823",
    status: "Flat",
    tone: "neutral" as MockTone,
    change: "0%",
  },
  {
    name: "Amazon Redshift",
    last: "1,300",
    now: "—",
    status: "Gone",
    tone: "neutral" as MockTone,
    change: "",
  },
];

/** Breakdown with statuses, then a drill-down into regions. */
export function CostBreakdownScene() {
  return (
    <>
      <At x={50} y={30} w={860} at={0}>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            "Provider",
            "Billing account ID",
            "Service",
            "Region",
            "Resource ID",
            "Tag",
          ].map((dimension) => (
            <span
              key={dimension}
              className={
                dimension === "Service"
                  ? "border-accent/50 bg-accent/10 text-accent rounded-full border px-3 py-1 font-medium"
                  : "border-border-soft text-muted-foreground rounded-full border px-3 py-1"
              }
            >
              {dimension}
            </span>
          ))}
        </div>
      </At>
      <At x={50} y={80} w={860} at={300}>
        <Card className="p-0">
          <div className="border-border-soft text-muted-foreground grid grid-cols-[1.6fr_1fr_1fr_0.8fr_0.8fr] gap-3 border-b px-5 py-2.5 text-[10px] font-semibold uppercase">
            <span>
              <span className="relative">
                <Until until={5200}>All spend</Until>
                <span
                  className="text-accent absolute top-0 left-0 whitespace-nowrap normal-case"
                  style={anim("guide-fade-in", 5200, 200)}
                >
                  All spend › Amazon EC2 · by region
                </span>
              </span>
            </span>
            <span>Last period</span>
            <span>This period</span>
            <span>Change</span>
            <span>Status</span>
          </div>
          <div className="relative h-[290px]">
            <Until until={5100} className="absolute inset-0">
              {BREAKDOWN.map((row, index) => (
                <div
                  key={row.name}
                  data-cursor={index === 0 ? "ec2" : undefined}
                  className="border-border-soft grid grid-cols-[1.6fr_1fr_1fr_0.8fr_0.8fr] items-center gap-3 border-b px-5 py-3 text-xs"
                  style={anim("guide-appear-up", 600 + index * 250)}
                >
                  <span className="font-semibold">{row.name}</span>
                  <span className="font-mono">{row.last}</span>
                  <span className="font-mono">{row.now}</span>
                  <span className="font-mono">{row.change}</span>
                  <MockBadge tone={row.tone} className="w-fit">
                    {row.status}
                  </MockBadge>
                </div>
              ))}
            </Until>
            <div className="absolute inset-0">
              {[
                ["eu-central-1", "2,900", "3,640", "+26%", "Up"],
                ["us-east-1", "1,310", "1,340", "+2%", "Flat"],
              ].map(([region, last, now, change, status], index) => (
                <div
                  key={region}
                  className="border-border-soft grid grid-cols-[1.6fr_1fr_1fr_0.8fr_0.8fr] items-center gap-3 border-b px-5 py-3 text-xs"
                  style={anim("guide-appear-up", 5300 + index * 250)}
                >
                  <span className="font-mono font-semibold">{region}</span>
                  <span className="font-mono">{last}</span>
                  <span className="font-mono">{now}</span>
                  <span className="font-mono">{change}</span>
                  <MockBadge
                    tone={status === "Up" ? "warning" : "neutral"}
                    className="w-fit"
                  >
                    {status}
                  </MockBadge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </At>
      <Cursor
        points={[
          { x: 500, y: 520, at: 0 },
          { to: "ec2", dx: -60, at: 4300 },
          { to: "ec2", dx: -60, at: 4800, click: true },
          { to: "ec2", dx: -60, at: 5400 },
          { x: 500, y: 520, at: 7000 },
        ]}
      />
    </>
  );
}

/** Drivers of change and the cumulative trajectory with an anomaly. */
export function CostDriversScene() {
  const drivers = [
    { name: "Amazon EC2", delta: 770, label: "+770" },
    { name: "AWS Lambda", delta: 640, label: "+640 new" },
    { name: "Amazon RDS", delta: -50, label: "−50" },
    { name: "Amazon Redshift", delta: -1300, label: "−1,300 gone" },
  ];
  return (
    <>
      <At x={40} y={40} w={420} at={0}>
        <Card className="h-[420px]">
          <p className="text-sm font-semibold">Why did spend change?</p>
          <div className="mt-5 space-y-5">
            {drivers.map((driver, index) => (
              <div key={driver.name}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{driver.name}</span>
                  <span className="font-mono">{driver.label}</span>
                </div>
                <div className="relative mt-1.5 h-2.5">
                  <span className="bg-foreground/20 absolute top-0 left-1/2 h-full w-px" />
                  <span
                    className={`absolute top-0 h-full rounded ${driver.delta > 0 ? "left-1/2 origin-left bg-amber-500" : "right-1/2 origin-right bg-emerald-500"}`}
                    style={{
                      width: `${(Math.abs(driver.delta) / 1300) * 50}%`,
                      ...anim("guide-grow-x", 600 + index * 300, 700),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </At>
      <At x={490} y={40} w={430} at={2400}>
        <Card className="h-[420px]">
          <p className="text-sm font-semibold">Spend trajectory</p>
          <div className="relative mt-8 h-[300px]">
            <div className="absolute bottom-0 left-0">
              <LineChart
                points={[0, 8, 17, 24, 33, 60, 68, 77, 86]}
                w={260}
                h={250}
                at={2700}
              />
            </div>
            <span
              className="absolute size-4 rounded-full border-2 border-white bg-red-500 shadow-[0_0_12px_rgb(239_68_68)]"
              style={{
                left: 154,
                top: 116,
                ...anim("guide-appear-scale", 4300, 300),
              }}
            />
            <span
              className="absolute text-[10px] font-semibold text-red-500"
              style={{
                left: 120,
                top: 92,
                ...anim("guide-fade-in", 4400, 300),
              }}
            >
              anomaly · Oct 18
            </span>
            <div className="absolute top-[10px] left-[260px]">
              <span className="block" style={anim("guide-fade-in", 5200, 400)}>
                <svg width="120" height="40" className="overflow-visible">
                  <path
                    d="M 0 40 L 120 0"
                    className="stroke-accent"
                    strokeWidth={2.5}
                    strokeDasharray="6 5"
                  />
                </svg>
              </span>
            </div>
            <span
              className="text-muted-foreground absolute top-0 right-0 text-[10px]"
              style={anim("guide-fade-in", 5400, 300)}
            >
              forecast to period end
            </span>
          </div>
        </Card>
      </At>
    </>
  );
}

/** A waterfall from gross usage to net cost. */
export function CostNetScene() {
  const steps = [
    { name: "Usage", value: 14200, base: 0, tone: "bg-accent" },
    { name: "Tax", value: 1100, base: 14200, tone: "bg-amber-500" },
    { name: "Credits", value: -2400, base: 15300, tone: "bg-emerald-500" },
    { name: "Other", value: -420, base: 12900, tone: "bg-emerald-500" },
    { name: "Net cost", value: 12480, base: 0, tone: "bg-foreground" },
  ];
  const scale = 300 / 15300;
  return (
    <>
      <At x={60} y={40} w={540} at={0}>
        <Card className="h-[440px]">
          <p className="text-sm font-semibold">Net cost breakdown</p>
          <div className="relative mt-6 flex h-[330px] items-end gap-6 px-4">
            {steps.map((step, index) => {
              const top = step.value >= 0 ? step.base + step.value : step.base;
              const height = Math.abs(step.value) * scale;
              return (
                <div key={step.name} className="relative h-full flex-1">
                  <span
                    className={`absolute inset-x-0 origin-bottom rounded-md ${step.tone}`}
                    style={{
                      bottom: (top - Math.abs(step.value)) * scale,
                      height,
                      ...anim("guide-grow-y", 500 + index * 600, 500),
                    }}
                  />
                  <span
                    className="absolute inset-x-0 text-center font-mono text-[10px] font-semibold"
                    style={{
                      bottom: top * scale + 6,
                      ...anim("guide-fade-in", 800 + index * 600, 300),
                    }}
                  >
                    {step.value > 0 && index > 0 && index < 4 ? "+" : ""}
                    {step.value.toLocaleString("en-US")}
                  </span>
                  <span className="text-muted-foreground absolute inset-x-0 -bottom-5 text-center text-[10px]">
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </At>
      <At x={630} y={40} w={290} at={3600}>
        <Card>
          <p className="text-muted-foreground text-[11px]">Discounts saved</p>
          <Money amount="3,120" className="text-success mt-1 block text-2xl" />
          <p className="text-muted-foreground text-[11px]">
            against list prices
          </p>
        </Card>
      </At>
      <At x={630} y={210} w={290} at={4600}>
        <Card>
          <p className="text-sm font-semibold">By charge type</p>
          <div className="mt-3 space-y-2 text-xs">
            {[
              ["Usage", "14,200"],
              ["Purchase", "860"],
              ["Credit", "−2,400"],
              ["Tax", "1,100"],
            ].map(([type, amount], index) => (
              <div
                key={type}
                className="flex justify-between"
                style={anim("guide-appear-left", 4800 + index * 200)}
              >
                <span>{type}</span>
                <span className="font-mono">{amount}</span>
              </div>
            ))}
          </div>
        </Card>
      </At>
    </>
  );
}

/** Explorer's controls, one by one. */
export function ExplorerBuildScene() {
  return (
    <>
      <MockWindow
        url="app.dilanix.com/dashboard/products/cost/explorer"
        x={40}
        y={24}
        w={880}
        h={492}
      >
        <div className="space-y-4 p-5 text-xs">
          <div className="grid grid-cols-4 gap-3">
            <MockField label="Start date" value="2026-09-01" mono at={500} />
            <MockField label="End date" value="2026-09-30" mono at={1200} />
            <MockField label="Cost measure" value="Effective cost" />
            <div>
              <p className="mb-1 text-[11px] font-medium">Granularity</p>
              <MockTabs
                tabs={["Daily", "Weekly", "Monthly"]}
                active="Daily"
                next="Monthly"
                switchAt={2600}
                cursorPrefix="granularity"
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-medium">Group by</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Provider",
                "Billing account ID",
                "Service",
                "Region",
                "Charge type",
              ].map((dimension) => (
                <span
                  key={dimension}
                  data-cursor={`group-${dimension}`}
                  className="border-border-soft relative rounded-full border px-3 py-1"
                >
                  {dimension === "Service" || dimension === "Region" ? (
                    <span
                      className="border-accent/50 bg-accent/10 absolute inset-[-1px] rounded-full border"
                      style={anim(
                        "guide-fade-in",
                        dimension === "Service" ? 3500 : 4200,
                        200,
                      )}
                    />
                  ) : null}
                  <span className="relative">{dimension}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <MockField
              label="Tag key"
              value="team"
              at={5000}
              className="w-48"
            />
            <MockButton variant="outline">Group by tag</MockButton>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-medium">Filters</p>
            <div
              className="border-border-soft flex items-center gap-2 rounded-xl border px-3 py-2"
              style={anim("guide-appear-up", 6400)}
            >
              <MockBadge tone="neutral">Service</MockBadge>
              <span>is</span>
              <MockBadge tone="accent">Amazon EC2</MockBadge>
            </div>
          </div>
          <MockButton cursor="run">Run query</MockButton>
        </div>
      </MockWindow>
      <Cursor
        points={[
          { x: 480, y: 520, at: 0 },
          { to: "granularity-Monthly", at: 2300, click: true },
          { to: "granularity-Monthly", at: 2800 },
          { to: "group-Service", at: 3300, click: true },
          { to: "group-Region", at: 4000, click: true },
          { to: "group-Region", at: 4500 },
          { to: "run", at: 7600, click: true },
          { to: "run", at: 8200 },
        ]}
      />
    </>
  );
}

/** Totals, charge types, Summary and Detailed. */
export function ExplorerResultsScene() {
  return (
    <>
      <At x={40} y={30} w={420} at={0}>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-muted-foreground text-[11px]">Total</p>
            <Money amount="4,980.40" className="mt-1 block text-xl" />
          </Card>
          <Card>
            <p className="text-muted-foreground text-[11px]">Rows</p>
            <p className="mt-1 font-mono text-xl font-semibold">24</p>
          </Card>
        </div>
      </At>
      <At x={480} y={30} w={440} at={800}>
        <Card>
          <p className="text-sm font-semibold">By charge type</p>
          <div className="mt-2 flex gap-2 text-[11px]">
            <MockBadge tone="neutral">Usage 5,210</MockBadge>
            <MockBadge tone="success">Credit −310</MockBadge>
            <MockBadge tone="neutral">Tax 80</MockBadge>
          </div>
        </Card>
      </At>
      <At x={40} y={150} w={880} at={1600}>
        <Card className="h-[340px]">
          <MockTabs
            tabs={["Summary", "Detailed"]}
            active="Summary"
            next="Detailed"
            switchAt={5200}
            cursorPrefix="results"
          />
          <div className="relative mt-4">
            <Until until={5200} className="space-y-2.5">
              {[
                ["Sep · Amazon EC2 · eu-central-1", 92],
                ["Sep · Amazon EC2 · us-east-1", 55],
                ["Sep · Amazon EC2 · eu-west-1", 30],
              ].map(([label, width], index) => (
                <div
                  key={label as string}
                  className="flex items-center gap-3 text-xs"
                >
                  <span className="w-64">{label}</span>
                  <span className="bg-foreground/10 h-2 flex-1 overflow-hidden rounded">
                    <span
                      className="bg-accent block h-full origin-left rounded"
                      style={{
                        width: `${width}%`,
                        ...anim("guide-grow-x", 2000 + index * 300, 700),
                      }}
                    />
                  </span>
                </div>
              ))}
            </Until>
            <div
              className="absolute inset-x-0 top-0"
              style={anim("guide-fade-in", 5300, 300)}
            >
              <div className="text-muted-foreground grid grid-cols-5 gap-2 border-b pb-2 text-[10px] font-semibold uppercase">
                <span>Period</span>
                <span>Service</span>
                <span>Region</span>
                <span>Currency</span>
                <span>Cost</span>
              </div>
              {[
                ["Sep", "Amazon EC2", "eu-central-1", "USD", "2,580.10"],
                ["Sep", "Amazon EC2", "us-east-1", "USD", "1,540.30"],
              ].map((row) => (
                <div
                  key={row[2]}
                  className="grid grid-cols-5 gap-2 py-2 font-mono text-xs"
                >
                  {row.map((cell) => (
                    <span key={cell}>{cell}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </At>
      <Cursor
        points={[
          { x: 480, y: 520, at: 0 },
          { to: "results-Detailed", at: 4800, click: true },
          { to: "results-Detailed", at: 5400 },
          { x: 480, y: 520, at: 7200 },
        ]}
      />
    </>
  );
}

/** Create a saved view, share it, run it in Explorer. */
export function SavedViewsScene() {
  return (
    <>
      <At x={40} y={30} w={440} at={0} from="scale">
        <div className="border-foreground/15 bg-background rounded-xl border p-5 shadow-2xl">
          <p className="text-base font-semibold">Create saved view</p>
          <div className="mt-4 space-y-3">
            <MockField
              label="Name"
              value="Production spend by service"
              at={500}
            />
            <div className="flex gap-3">
              <div>
                <p className="mb-1 text-[11px] font-medium">Granularity</p>
                <MockTabs
                  tabs={["Daily", "Weekly", "Monthly"]}
                  active="Monthly"
                />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-medium">Visibility</p>
                <MockTabs
                  tabs={["Only me", "Everyone in the org"]}
                  active="Only me"
                  next="Everyone in the org"
                  switchAt={2700}
                  cursorPrefix="visibility"
                />
              </div>
            </div>
            <p className="text-[11px] font-medium">
              Group by · Service, Region
            </p>
            <p className="text-[11px] font-medium">
              Scope · Tag environment is production
            </p>
            <MockButton cursor="create-view">Create saved view</MockButton>
          </div>
        </div>
      </At>
      <At x={520} y={30} w={400} at={4200}>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Production spend by service</p>
            <MockBadge tone="accent">Organization</MockBadge>
          </div>
          <p className="text-muted-foreground mt-1 text-[11px]">
            Monthly · Service, Region · created by you — only you can edit it
          </p>
        </Card>
      </At>
      <At x={520} y={180} w={400} at={5600}>
        <Card>
          <p className="text-muted-foreground text-[11px] font-semibold uppercase">
            Explorer
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="border-foreground/15 flex-1 rounded-lg border px-3 py-1.5 text-xs">
              Saved view: Production spend by service
            </span>
            <MockButton cursor="run-view">Run view</MockButton>
          </div>
          <p className="text-muted-foreground mt-2 text-[11px]">
            Applied to whatever dates you set.
          </p>
        </Card>
      </At>
      <Cursor
        points={[
          { x: 480, y: 520, at: 0 },
          { to: "visibility-Everyone in the org", at: 2400, click: true },
          { to: "visibility-Everyone in the org", at: 2900 },
          { to: "create-view", at: 3800, click: true },
          { to: "create-view", at: 4300 },
          { to: "run-view", at: 6600, click: true },
          { to: "run-view", at: 7200 },
        ]}
      />
    </>
  );
}

/** A budget's form, field by field. */
export function BudgetCreateScene() {
  return (
    <>
      <At x={180} y={24} w={600} at={0} from="scale">
        <div className="border-foreground/15 bg-background rounded-xl border p-5 shadow-2xl">
          <p className="text-base font-semibold">Create budget</p>
          <div className="mt-4 space-y-3">
            <MockField label="Name" value="Production AWS — monthly" at={500} />
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <MockField label="Amount" value="10000" mono at={2000} />
              <MockField label="Currency" value="USD" />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium">Period</p>
              <MockTabs
                tabs={["Monthly", "Quarterly", "Annual", "Custom range"]}
                active="Monthly"
              />
              <p
                className="text-muted-foreground mt-1.5 text-[11px]"
                style={anim("guide-fade-in", 3600, 400)}
              >
                Follows the calendar in UTC and restarts on its own — a budget
                created on the 20th covers the whole month.
              </p>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-medium">Scope</p>
              <div
                className="border-border-soft flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"
                style={anim("guide-appear-up", 5600)}
              >
                <MockBadge tone="neutral">Tag environment</MockBadge>
                <span>is</span>
                <MockBadge tone="accent">production</MockBadge>
              </div>
              <p
                className="text-muted-foreground mt-1.5 text-[11px]"
                style={anim("guide-fade-in", 6400, 400)}
              >
                Empty means all spend; a charge must match every condition.
              </p>
            </div>
          </div>
        </div>
      </At>
    </>
  );
}

/** Thresholds firing as spend climbs; the forecast and the badge. */
export function BudgetAlertsScene() {
  // The bar fills to 98% of the amount (82% of a 0–120% track) over 3.2 s,
  // so 50% and 80% are crossed at these times.
  const thresholds = [
    { pct: 50, at: 2250 },
    { pct: 80, at: 3200 },
    { pct: 100 },
    { pct: 120 },
  ];
  return (
    <>
      <At x={60} y={40} w={840} at={0}>
        <Card>
          <div className="flex items-center justify-between">
            <span>
              <span className="block text-sm font-semibold">
                Production AWS — monthly
              </span>
              <span className="text-muted-foreground text-[11px]">
                10,000 USD · Monthly · Active · 2 recipients
              </span>
            </span>
            <span className="relative">
              <Until until={4400}>
                <MockBadge tone="success">On track</MockBadge>
              </Until>
              <span
                className="absolute top-0 right-0 whitespace-nowrap"
                style={anim("guide-appear-scale", 4400, 300)}
              >
                <MockBadge tone="warning">Forecast to overrun</MockBadge>
              </span>
            </span>
          </div>
          <div className="relative mt-8 h-4">
            <div className="bg-foreground/10 absolute inset-0 overflow-hidden rounded-full">
              <div
                className="bg-accent h-full w-[82%] origin-left rounded-full"
                style={anim("guide-grow-x", 600, 3200, "linear")}
              />
            </div>
            {thresholds.map((threshold) => (
              <span
                key={threshold.pct}
                className="bg-foreground/40 absolute -top-1 h-6 w-px"
                style={{ left: `${(threshold.pct / 120) * 100}%` }}
              />
            ))}
            <span
              className="absolute -top-2 h-8 w-1 rounded bg-amber-500"
              style={{ left: "90%", ...anim("guide-appear-scale", 4300, 300) }}
            />
          </div>
          <div className="text-muted-foreground relative mt-1 h-4 text-[10px]">
            {thresholds.map((threshold) => (
              <span
                key={threshold.pct}
                className="absolute -translate-x-1/2"
                style={{ left: `${(threshold.pct / 120) * 100}%` }}
              >
                {threshold.pct}%
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            {thresholds.map((threshold) => (
              <span key={threshold.pct} className="relative">
                <MockBadge tone="neutral">{threshold.pct}%</MockBadge>
                {threshold.at ? (
                  <span
                    className="absolute inset-0"
                    style={anim("guide-appear-scale", threshold.at, 300)}
                  >
                    <MockBadge tone="warning">
                      <Bell size={10} /> {threshold.pct}%
                    </MockBadge>
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </Card>
      </At>
      {[2300, 3250].map((at, index) => (
        <At key={at} x={140 + index * 260} y={330} w={240} at={at} from="up">
          <div className="border-border-soft bg-card-strong flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs shadow-lg">
            <Mail size={14} className="text-accent" />
            {index === 0
              ? "50% reached — email sent"
              : "80% reached — email sent"}
          </div>
        </At>
      ))}
      <At x={60} y={420} w={840} at={5400} from="fade">
        <p className="text-muted-foreground text-xs">
          Each threshold emails once per period and resets next period. Pause
          stops alerts without losing the budget.
        </p>
      </At>
    </>
  );
}

/** Rules by priority claiming charges; the split by target. */
export function AllocationsScene() {
  const rules = [
    { priority: 10, label: "Platform team", scope: "Tag team is platform" },
    {
      priority: 20,
      label: "Data team",
      scope: "Billing account is 222222222222",
    },
    { priority: 100, label: "Shared", scope: "empty — claims what's left" },
  ];
  const split = [
    { label: "Platform team", pct: 46, tone: "bg-accent" },
    { label: "Data team", pct: 31, tone: "bg-violet-500" },
    { label: "Shared", pct: 15, tone: "bg-emerald-500" },
    { label: "Unallocated", pct: 8, tone: "bg-amber-500" },
  ];
  return (
    <>
      <At x={40} y={30} w={430} at={0}>
        <Card>
          <p className="text-sm font-semibold">Allocation rules</p>
          <div className="mt-3 space-y-2">
            {rules.map((rule, index) => (
              <div
                key={rule.label}
                className="border-border-soft flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs"
                style={anim("guide-appear-left", 400 + index * 400)}
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
            style={anim("guide-fade-in", 2000, 400)}
          >
            Lowest number first: the first enabled match claims the charge.
          </p>
        </Card>
      </At>
      <At x={500} y={30} w={420} at={2600}>
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Spend by target</p>
            <span className="text-muted-foreground font-mono text-xs">
              92% allocated
            </span>
          </div>
          <div className="mt-3 flex h-4 overflow-hidden rounded-full">
            {split.map((part, index) => (
              <span
                key={part.label}
                className={`${part.tone} h-full origin-left`}
                style={{
                  width: `${part.pct}%`,
                  ...anim("guide-grow-x", 2900 + index * 350, 500),
                }}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {split.map((part, index) => (
              <div
                key={part.label}
                className="flex items-center justify-between text-xs"
                style={anim("guide-appear-up", 3100 + index * 350)}
              >
                <span className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${part.tone}`} />
                  {part.label}
                </span>
                <span className="flex items-center gap-2">
                  {part.label === "Unallocated" ? (
                    <MockBadge tone="warning">Needs allocation</MockBadge>
                  ) : null}
                  <span className="font-mono">{part.pct}%</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </At>
      <At x={40} y={430} w={880} at={5600} from="fade">
        <p className="text-muted-foreground text-xs">
          Disable a rule and its spend falls to the next match. Rules apply when
          the breakdown runs, so past periods re-split too.
        </p>
      </At>
    </>
  );
}

/** Yesterday against the 7-day average. */
export function AnomalyDetectScene() {
  return (
    <>
      <At x={60} y={30} w={560} at={0}>
        <Card className="h-[440px]">
          <p className="text-sm font-semibold">Daily spend</p>
          <div className="relative mt-6">
            <Bars
              values={[640, 690, 655, 702, 668, 690, 680, 1920]}
              at={400}
              height={300}
              highlight={7}
            />
            <div
              className="absolute inset-x-0 border-t-2 border-dashed border-amber-500/80"
              style={{
                bottom: (676 / 1920) * 300,
                ...anim("guide-fade-in", 1800, 400),
              }}
            />
            <span
              className="absolute right-0 text-[10px] font-semibold text-amber-600 dark:text-amber-300"
              style={{
                bottom: (676 / 1920) * 300 + 4,
                ...anim("guide-fade-in", 1900, 300),
              }}
            >
              7-day average 676
            </span>
          </div>
          <div className="text-muted-foreground mt-2 flex justify-between text-[10px]">
            <span>7 days before</span>
            <span>yesterday</span>
          </div>
        </Card>
      </At>
      <At x={650} y={30} w={270} at={2600} from="scale">
        <Card>
          <p className="text-muted-foreground text-[11px]">Yesterday</p>
          <Money amount="1,920" className="mt-1 block text-2xl text-red-500" />
          <p className="mt-1 text-xs font-semibold text-red-500">
            +184% above average
          </p>
          <MockBadge tone="danger" className="mt-3">
            medium severity
          </MockBadge>
        </Card>
      </At>
      <At x={650} y={230} w={270} at={3800}>
        <div className="space-y-2 text-xs">
          {[
            ["low", "50–99% above", "neutral"],
            ["medium", "100–299%", "warning"],
            ["high", "300% or more", "danger"],
          ].map(([name, range, tone], index) => (
            <div
              key={name}
              className="border-border-soft bg-card-strong flex items-center justify-between rounded-xl border px-3 py-2"
              style={anim("guide-appear-left", 3900 + index * 300)}
            >
              <MockBadge tone={tone as MockTone}>{name}</MockBadge>
              <span className="text-muted-foreground">{range}</span>
            </div>
          ))}
          <p
            className="text-muted-foreground pt-1 text-[11px]"
            style={anim("guide-fade-in", 5200, 400)}
          >
            Checked every hour, per currency. Drops never count.
          </p>
        </div>
      </At>
    </>
  );
}

/** Open → Acknowledged → Resolved. */
export function AnomalyTriageScene() {
  const states = [
    {
      name: "Open",
      text: "Nobody has looked yet",
      tone: "danger" as MockTone,
      at: 300,
    },
    {
      name: "Acknowledged",
      text: "Someone is on it",
      tone: "warning" as MockTone,
      at: 2200,
    },
    {
      name: "Resolved",
      text: "Explained or fixed — final",
      tone: "success" as MockTone,
      at: 4200,
    },
  ];
  return (
    <>
      <Lines
        paths={[
          { d: "M 300 200 L 360 200", at: 2000 },
          { d: "M 600 200 L 660 200", at: 4000 },
        ]}
      />
      {states.map((state, index) => (
        <At
          key={state.name}
          x={60 + index * 300}
          y={130}
          w={240}
          at={state.at}
          from="scale"
        >
          <Card>
            <MockBadge tone={state.tone} className="text-xs">
              {state.name}
            </MockBadge>
            <p className="text-muted-foreground mt-2 text-xs">{state.text}</p>
            {index < 2 ? (
              <span className="relative mt-3 inline-block">
                <MockButton
                  variant="outline"
                  cursor={index === 0 ? "acknowledge" : "resolve"}
                >
                  {index === 0 ? "Acknowledge" : "Resolve"}
                </MockButton>
              </span>
            ) : null}
          </Card>
        </At>
      ))}
      <At x={60} y={340} w={840} at={5600}>
        <Card>
          <p className="text-sm font-semibold">Also on the Cost overview</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Needs attention · marked on the spend trajectory · Recent anomalies.
            A new spike after Resolve is a new anomaly.
          </p>
        </Card>
      </At>
      <Cursor
        points={[
          { x: 480, y: 520, at: 0 },
          { to: "acknowledge", at: 1700, click: true },
          { to: "acknowledge", at: 2200 },
          { to: "resolve", at: 3700, click: true },
          { to: "resolve", at: 4200 },
          { x: 480, y: 520, at: 6000 },
        ]}
      />
    </>
  );
}

/** A report's settings, Generate & send, its history. */
export function ReportsScene() {
  const destinations = [
    "Email · finance",
    "Slack · #finops",
    "Telegram · CFO",
    "Webhook",
  ];
  return (
    <>
      <At x={40} y={24} w={460} at={0} from="scale">
        <div className="border-foreground/15 bg-background rounded-xl border p-5 shadow-2xl">
          <p className="text-base font-semibold">Monthly cost — finance</p>
          <div className="mt-4 space-y-3 text-xs">
            <div>
              <p className="mb-1 text-[11px] font-medium">Format</p>
              <MockTabs
                tabs={["CSV", "PDF"]}
                active="CSV"
                next="PDF"
                switchAt={1200}
              />
            </div>
            <MockField label="Cost period" value="Last calendar month" />
            <MockField label="Schedule" value="Monthly · day 1 · 08:00 UTC" />
            <div>
              <p className="mb-1.5 text-[11px] font-medium">Destinations</p>
              <div className="flex flex-wrap gap-1.5">
                {destinations.map((destination, index) => (
                  <span
                    key={destination}
                    style={anim("guide-appear-scale", 2200 + index * 250, 250)}
                  >
                    <MockBadge tone="accent">{destination}</MockBadge>
                  </span>
                ))}
              </div>
            </div>
            <MockButton cursor="send">
              <Send size={12} /> Generate &amp; send
            </MockButton>
          </div>
        </div>
      </At>
      <Lines
        flow
        paths={[0, 1, 2, 3].map((index) => ({
          d: `M 500 300 C 580 300 580 ${90 + index * 70} 650 ${90 + index * 70}`,
          at: 5000 + index * 150,
        }))}
      />
      {destinations.map((destination, index) => (
        <At
          key={destination}
          x={650}
          y={66 + index * 70}
          w={270}
          at={5300 + index * 200}
          from="left"
        >
          <div className="border-border-soft bg-card-strong flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs shadow-lg">
            <FileText size={14} className="text-red-500" /> cost-2026-09.pdf →{" "}
            {destination}
          </div>
        </At>
      ))}
      <At x={40} y={440} w={880} at={7200} from="fade">
        <p className="text-muted-foreground text-xs">
          History keeps every copy to view, download or delete. Disable pauses
          the schedule; Generate &amp; send still works.
        </p>
      </At>
      <Cursor
        points={[
          { x: 480, y: 520, at: 0 },
          { to: "send", at: 4300, click: true },
          { to: "send", at: 4900 },
          { x: 480, y: 520, at: 6600 },
        ]}
      />
    </>
  );
}

/** Recommendations and notifications. */
export function CostSavingsScene() {
  return (
    <>
      <At x={40} y={40} w={460} at={0}>
        <Card>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb size={16} className="text-accent" /> Recommendations
          </p>
          {[
            ["#1", "Schedule environment dev off hours", "−451 USD / month"],
            ["#2", "Stop idle NAT gateway", "−32 USD / month"],
            ["#3", "Buy a Compute Savings Plan", "−118 USD / month"],
          ].map(([rank, title, saving], index) => (
            <div
              key={rank}
              className="border-border-soft mt-2 flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs"
              style={anim("guide-appear-up", 400 + index * 300)}
            >
              <span className="bg-accent text-accent-foreground rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold">
                {rank}
              </span>
              <span className="flex-1">{title}</span>
              <span className="text-success font-mono">{saving}</span>
            </div>
          ))}
        </Card>
      </At>
      <At x={530} y={40} w={390} at={2600}>
        <Card>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Bell size={16} className="text-accent" /> Notifications
          </p>
          {[
            ["Budget threshold reached", "email to its recipients"],
            ["Report generated", "with the file, to its destinations"],
            ["High-priority recommendation", "to your destinations"],
          ].map(([event, where], index) => (
            <div
              key={event}
              className="border-border-soft mt-2 rounded-xl border px-3 py-2.5 text-xs"
              style={anim("guide-appear-left", 2900 + index * 350)}
            >
              <span className="block font-semibold">{event}</span>
              <span className="text-muted-foreground">{where}</span>
            </div>
          ))}
        </Card>
      </At>
    </>
  );
}

/** Each page has its own tour. */
export function CostOutroScene() {
  return (
    <>
      {SECTIONS.map((section, index) => (
        <At
          key={section.name}
          x={60 + (index % 4) * 212}
          y={70 + Math.floor(index / 4) * 150}
          w={196}
          at={200 + index * 200}
          from="scale"
        >
          <Card className="relative h-[120px]">
            <span className="bg-accent/12 text-accent flex size-9 items-center justify-center rounded-lg">
              {section.icon}
            </span>
            <p className="mt-3 text-sm font-semibold">{section.name}</p>
            <span
              className="absolute top-4 right-4"
              style={anim("guide-appear-scale", 1800 + index * 150, 250)}
            >
              <MockBadge tone="success">tour</MockBadge>
            </span>
            <Highlight at={1800 + index * 150} />
          </Card>
        </At>
      ))}
      <At x={300} y={390} w={360} at={3400}>
        <div className="border-border-soft bg-card-strong rounded-2xl border p-3 shadow-[0_18px_44px_var(--shadow-card)]">
          <p className="text-muted-foreground px-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
            Help &amp; Support
          </p>
          <div className="mt-2 flex items-center justify-between rounded-xl px-2 py-1.5 text-xs">
            <span className="font-medium">Cost</span>
            <span className="text-muted-foreground">1 video · 7 tours</span>
          </div>
        </div>
      </At>
    </>
  );
}
