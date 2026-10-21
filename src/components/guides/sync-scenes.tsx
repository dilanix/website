"use client";

import {
  AlertCircle,
  Boxes,
  CalendarClock,
  Check,
  CircleDollarSign,
  Database,
  Gauge,
  HeartPulse,
  Lightbulb,
  Loader2,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  anim,
  At,
  Cursor,
  Highlight,
  Lines,
  MockBadge,
  MockButton,
  MockCheck,
  MockProgress,
  MockWindow,
  Node,
  ProviderTile,
  Until,
  type MockTone,
} from "./scene-kit";

const SPIN = { animation: "guide-spin 1s linear infinite" };

const DATASETS = [
  { name: "Inventory Resources", icon: <Boxes size={15} /> },
  { name: "Cost Summary", icon: <CircleDollarSign size={15} /> },
  { name: "Cost Usage (FOCUS)", icon: <CircleDollarSign size={15} /> },
  { name: "Utilization Metrics", icon: <Gauge size={15} /> },
  { name: "Runtime Interactions", icon: <Network size={15} /> },
];

const PRODUCTS = [
  { name: "Resources", icon: <Boxes size={15} /> },
  { name: "Infrastructure graph", icon: <Network size={15} /> },
  { name: "Cost", icon: <CircleDollarSign size={15} /> },
  { name: "Recommendations", icon: <Lightbulb size={15} /> },
];

/** Your cloud → datasets → products, refreshing. */
export function SyncIntroScene() {
  return (
    <>
      <Lines
        flow
        paths={[
          ...DATASETS.map((_, index) => ({
            d: `M 240 270 C 300 270 300 ${78 + index * 90} 360 ${78 + index * 90}`,
            at: 900 + index * 180,
          })),
          ...PRODUCTS.map((_, index) => ({
            d: `M 600 270 C 650 270 650 ${105 + index * 108} 700 ${105 + index * 108}`,
            at: 2600 + index * 200,
          })),
        ]}
      />
      <Lines
        className="stroke-border-soft"
        paths={DATASETS.map((_, index) => ({
          d: `M 590 ${78 + index * 90} C 600 ${78 + index * 90} 600 270 600 270`,
          at: 2300,
        }))}
      />
      <At x={40} y={210} w={200} at={0}>
        <div className="border-border-soft bg-card-strong rounded-2xl border p-4 shadow-[0_18px_44px_var(--shadow-card)]">
          <ProviderTile code="AWS" />
          <p className="mt-3 text-sm font-semibold">Your AWS accounts</p>
          <p className="text-muted-foreground text-[11px]">
            read through the connection
          </p>
        </div>
      </At>
      {DATASETS.map((dataset, index) => (
        <At
          key={dataset.name}
          x={360}
          y={52 + index * 90}
          w={230}
          at={1000 + index * 180}
          from="scale"
        >
          <Node icon={dataset.icon} title={dataset.name} detail="dataset" />
        </At>
      ))}
      <At x={448} y={8} at={1800} from="fade">
        <span className="text-accent flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase">
          <RefreshCw size={13} style={SPIN} /> Sync
        </span>
      </At>
      {PRODUCTS.map((product, index) => (
        <At
          key={product.name}
          x={700}
          y={80 + index * 108}
          w={220}
          at={2800 + index * 200}
        >
          <Node tone="success" icon={product.icon} title={product.name} />
        </At>
      ))}
    </>
  );
}

/** Which capability each dataset needs. */
export function DatasetsScene() {
  const rows: {
    name: string;
    brings: string;
    needs: string[];
    at: number;
  }[] = [
    {
      name: "Inventory Resources",
      brings: "Every resource and its configuration",
      needs: ["Inventory Read"],
      at: 600,
    },
    {
      name: "Runtime Interactions",
      brings: "What talks to what — config, IAM, X-Ray, flow logs",
      needs: ["Inventory Read"],
      at: 1600,
    },
    {
      name: "Cost Summary (Cost Explorer)",
      brings: "Daily totals per service",
      needs: ["Billing Read"],
      at: 2600,
    },
    {
      name: "Cost Usage (FOCUS export)",
      brings: "The detailed bill, line by line",
      needs: ["Billing Read", "stack's FOCUS export"],
      at: 3600,
    },
    {
      name: "Utilization Metrics (CloudWatch)",
      brings: "CPU, memory, network, connections",
      needs: ["Metrics Read"],
      at: 4600,
    },
  ];
  return (
    <At x={60} y={40} w={840} at={0}>
      <div className="border-border-soft bg-card-strong overflow-hidden rounded-2xl border shadow-[0_18px_44px_var(--shadow-card)]">
        <div className="border-border-soft text-muted-foreground grid grid-cols-[1.2fr_1.4fr_1fr] gap-4 border-b px-5 py-3 text-[11px] font-semibold tracking-wide uppercase">
          <span>Dataset</span>
          <span>Brings</span>
          <span>Needs</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.name}
            className="border-border-soft grid grid-cols-[1.2fr_1.4fr_1fr] items-center gap-4 border-b px-5 py-4 text-xs last:border-b-0"
            style={anim("guide-appear-left", row.at)}
          >
            <span className="flex items-center gap-2 font-semibold">
              <Database size={14} className="text-accent shrink-0" />
              {row.name}
            </span>
            <span className="text-muted-foreground">{row.brings}</span>
            <span className="flex flex-wrap gap-1">
              {row.needs.map((need) => (
                <MockBadge
                  key={need}
                  tone={need.includes("stack") ? "warning" : "accent"}
                >
                  {need}
                </MockBadge>
              ))}
            </span>
          </div>
        ))}
      </div>
    </At>
  );
}

/** Sync now → Automatic or manual → Start sync. */
export function FirstSyncScene() {
  return (
    <>
      <MockWindow
        url="app.dilanix.com/dashboard/integrations/…?tab=activity"
        x={40}
        y={24}
        w={880}
        h={492}
      >
        <div className="p-5">
          <p className="text-base font-semibold">Sync &amp; Activity</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-muted-foreground text-[11px]">
              Start an on-demand sync to pull the latest data for this
              connection.
            </p>
            <MockButton cursor="sync-now">
              <RefreshCw size={12} /> Sync now
            </MockButton>
          </div>
          <div className="border-border-soft mt-4 rounded-xl border">
            <Until until={7300}>
              <p className="text-muted-foreground px-4 py-6 text-center text-xs">
                No syncs yet
              </p>
            </Until>
            <div
              className="flex items-center gap-2 px-4 py-3 text-xs"
              style={anim("guide-appear-up", 7300)}
            >
              <MockBadge tone="accent">
                <Loader2 size={11} style={SPIN} /> running
              </MockBadge>
              <span className="text-muted-foreground">manual · just now</span>
            </div>
          </div>
        </div>
        <div
          className="absolute inset-0"
          style={anim("guide-fade-in", 1100, 250)}
        >
          <Until until={7000} className="bg-background/70 h-full" />
        </div>
        <At x={240} y={40} w={400} at={1100} from="scale">
          <Until until={7000}>
            <div className="border-foreground/15 bg-background rounded-xl border p-5 shadow-2xl">
              <p className="text-base font-semibold">Start sync</p>
              <p className="text-muted-foreground mt-1 text-[11px]">
                Let Core plan eligible datasets or select a specific subset.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="border-foreground/10 relative rounded-xl border p-3">
                  <Until
                    until={2900}
                    className="border-accent/40 bg-accent/[0.06] absolute inset-[-1px] rounded-xl border"
                  />
                  <p className="relative font-medium">Automatic</p>
                  <p className="text-muted-foreground relative mt-1 text-[10px] leading-4">
                    Every dataset your access and capabilities allow.
                  </p>
                </div>
                <div
                  data-cursor="manual"
                  className="border-foreground/10 relative rounded-xl border p-3"
                >
                  <span
                    className="border-accent/40 bg-accent/[0.06] absolute inset-[-1px] rounded-xl border"
                    style={anim("guide-fade-in", 2900, 200)}
                  />
                  <p className="relative font-medium">Select manually</p>
                  <p className="text-muted-foreground relative mt-1 text-[10px] leading-4">
                    Run only the datasets you tick.
                  </p>
                </div>
              </div>
              <div
                className="mt-3 space-y-1.5"
                style={anim("guide-appear-up", 3300)}
              >
                <MockCheck label="Inventory Resources" checkedAt={3900} />
                <MockCheck label="Cost Usage (AWS FOCUS Data Export)" />
                <MockCheck label="Utilization Metrics" checkedAt={4400} />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <MockButton variant="outline">Cancel</MockButton>
                <MockButton cursor="start">Start sync</MockButton>
              </div>
            </div>
          </Until>
        </At>
        <At x={660} y={400} at={7100}>
          <span className="border-success/40 bg-success/10 text-success flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shadow-lg">
            <Check size={13} /> Sync started
          </span>
        </At>
      </MockWindow>
      <Cursor
        points={[
          { x: 480, y: 510, at: 0 },
          { to: "sync-now", at: 800, click: true },
          { to: "sync-now", at: 1300 },
          { to: "manual", at: 2900, click: true },
          { to: "manual", at: 4800 },
          { to: "start", at: 6300, click: true },
          { to: "start", at: 7000 },
          { x: 480, y: 510, at: 9000 },
        ]}
      />
    </>
  );
}

const JOBS: {
  dataset: string;
  account: string;
  scope: string;
  at: number;
  duration: number;
}[] = [
  {
    dataset: "Inventory Resources",
    account: "Prod",
    scope: "eu-central-1 · instances",
    at: 1400,
    duration: 2600,
  },
  {
    dataset: "Inventory Resources",
    account: "Prod",
    scope: "eu-central-1 · databases",
    at: 1600,
    duration: 3400,
  },
  {
    dataset: "Inventory Resources",
    account: "Dev",
    scope: "us-east-1 · instances",
    at: 1800,
    duration: 2200,
  },
  {
    dataset: "Cost Usage",
    account: "Billing",
    scope: "billing period 2026-10",
    at: 2000,
    duration: 4200,
  },
  {
    dataset: "Utilization Metrics",
    account: "Prod",
    scope: "eu-central-1",
    at: 2200,
    duration: 3000,
  },
];

/** One run fans out into jobs that fill in live. */
export function RunJobsScene() {
  return (
    <>
      <At x={60} y={30} w={840} at={0}>
        <div className="border-accent/40 bg-accent/[0.06] flex items-center justify-between rounded-2xl border px-5 py-3.5">
          <span className="flex items-center gap-3">
            <span className="relative">
              <Until until={7200} className="inline-flex">
                <MockBadge tone="accent">
                  <Loader2 size={11} style={SPIN} /> running
                </MockBadge>
              </Until>
              <span
                className="absolute top-0 left-0"
                style={anim("guide-appear-scale", 7200, 300)}
              >
                <MockBadge tone="success">succeeded</MockBadge>
              </span>
            </span>
            <span className="text-muted-foreground text-xs">
              manual · 5 jobs
            </span>
          </span>
          <span className="text-muted-foreground font-mono text-xs">
            read 1,284 · created 37 · updated 1,190
          </span>
        </div>
      </At>
      <Lines
        className="stroke-accent/40"
        paths={JOBS.map((_, index) => ({
          d: `M 120 88 L 120 ${128 + index * 78}`,
          at: 900 + index * 150,
          duration: 400,
        }))}
      />
      {JOBS.map((job, index) => (
        <At
          key={job.scope}
          x={140}
          y={104 + index * 78}
          w={760}
          at={job.at - 300}
          from="left"
        >
          <div className="border-border-soft bg-card-strong flex items-center gap-4 rounded-xl border px-4 py-3 text-xs shadow-[0_10px_26px_var(--shadow-card)]">
            <span className="w-56 min-w-0">
              <span className="block truncate font-semibold">
                {job.dataset}
              </span>
              <span className="text-muted-foreground block truncate text-[11px]">
                {job.account} · {job.scope}
              </span>
            </span>
            <MockProgress
              className="flex-1"
              at={job.at}
              duration={job.duration}
            />
            <span className="relative w-20">
              <Until until={job.at + job.duration} className="inline-flex">
                <MockBadge tone="neutral">running</MockBadge>
              </Until>
              <span
                className="absolute top-0 left-0"
                style={anim("guide-appear-scale", job.at + job.duration, 250)}
              >
                <MockBadge tone="success">succeeded</MockBadge>
              </span>
            </span>
          </div>
        </At>
      ))}
    </>
  );
}

/** Configure automatic sync per dataset. */
export function SchedulesScene() {
  const rows = [
    {
      name: "Inventory Resources",
      slug: "inventory.resources",
      on: 1200,
      every: "Every hour",
    },
    {
      name: "Cost Usage (AWS FOCUS Data Export)",
      slug: "billing.cost_usage",
      on: 2600,
      every: "Every 24 hours",
    },
    {
      name: "Utilization Metrics (AWS CloudWatch)",
      slug: "metrics.utilization",
      on: 4000,
      every: "Every 3 hours",
    },
  ];
  return (
    <>
      <At x={40} y={30} w={540} at={0} from="scale">
        <div className="border-border-soft bg-background rounded-2xl border shadow-2xl">
          <div className="border-border-soft flex items-center gap-3 border-b px-5 py-4">
            <span className="bg-accent/10 text-accent flex size-9 items-center justify-center rounded-xl">
              <CalendarClock size={17} />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                Configure automatic sync
              </span>
              <span className="text-muted-foreground text-[11px]">
                Which datasets stay fresh, and how often each one runs.
              </span>
            </span>
          </div>
          <div className="space-y-2.5 p-5">
            {rows.map((row) => (
              <div
                key={row.slug}
                className="border-border-soft rounded-xl border p-3"
              >
                <div className="flex items-center justify-between">
                  <MockCheck
                    label={row.name}
                    checkedAt={row.on}
                    cursor={row.slug}
                  />
                  <span className="relative">
                    <Until until={row.on}>
                      <MockBadge tone="neutral">Off</MockBadge>
                    </Until>
                    <span
                      className="absolute top-0 right-0"
                      style={anim("guide-appear-scale", row.on, 250)}
                    >
                      <MockBadge tone="success">Enabled</MockBadge>
                    </span>
                  </span>
                </div>
                <div className="border-border-soft mt-2.5 flex items-center justify-between border-t pt-2 text-[11px]">
                  <span className="text-muted-foreground">Frequency</span>
                  <span
                    className="border-foreground/15 rounded-lg border px-2.5 py-1"
                    style={anim("guide-fade-in", row.on + 300, 300)}
                  >
                    {row.every}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground border-border-soft border-t px-5 py-3 text-[11px]">
            Changes are saved automatically.
          </p>
        </div>
      </At>
      <At x={620} y={60} w={300} at={5200} from="scale">
        <div className="border-border-soft bg-card-strong rounded-2xl border p-5">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
            Next runs
          </p>
          {[
            ["Inventory Resources", "in 42m"],
            ["Utilization Metrics", "in 2h"],
            ["Cost Usage", "in 21h"],
          ].map(([name, next], index) => (
            <div
              key={name}
              className="mt-3 flex items-center justify-between text-xs"
              style={anim("guide-appear-up", 5500 + index * 250)}
            >
              <span>{name}</span>
              <span className="text-accent font-mono">{next}</span>
            </div>
          ))}
        </div>
      </At>
      <At x={620} y={300} w={300} at={7600}>
        <div className="border-accent/40 bg-accent/[0.06] flex items-center gap-2 rounded-xl border px-4 py-3 text-xs">
          <MockBadge tone="accent">
            <Loader2 size={11} style={SPIN} /> running
          </MockBadge>
          <span className="text-muted-foreground">scheduled · just now</span>
        </div>
      </At>
      <Cursor
        points={[
          { x: 300, y: 520, at: 0 },
          { to: "inventory.resources", at: 1100, click: true },
          { to: "inventory.resources", at: 1500 },
          { to: "billing.cost_usage", at: 2500, click: true },
          { to: "billing.cost_usage", at: 2900 },
          { to: "metrics.utilization", at: 3900, click: true },
          { to: "metrics.utilization", at: 4400 },
          { x: 300, y: 520, at: 6000 },
        ]}
      />
    </>
  );
}

function Attempt({
  attempt,
  tone,
  outcome,
  error,
  at,
}: {
  attempt: number;
  tone: MockTone;
  outcome: string;
  error?: string;
  at: number;
}) {
  return (
    <div
      className="border-border-soft bg-background flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[11px]"
      style={anim("guide-appear-up", at)}
    >
      <span className="font-mono">attempt {attempt}</span>
      {error ? (
        <span className="flex min-w-0 items-center gap-1 truncate text-red-500/90">
          <AlertCircle size={12} className="shrink-0" /> {error}
        </span>
      ) : null}
      <MockBadge tone={tone}>{outcome}</MockBadge>
    </div>
  );
}

/** A throttled job retries and succeeds; a denied one stops. */
export function RetriesScene() {
  return (
    <>
      <At x={40} y={40} w={430} at={0}>
        <div className="border-border-soft bg-card-strong rounded-2xl border p-4">
          <p className="text-sm font-semibold">Inventory · Prod · us-east-1</p>
          <p className="text-muted-foreground text-[11px]">
            a temporary problem
          </p>
          <div className="mt-3 space-y-2">
            <Attempt
              attempt={1}
              tone="warning"
              outcome="failed"
              error="throttled"
              at={900}
            />
            <p
              className="text-muted-foreground flex items-center gap-1.5 text-[11px]"
              style={anim("guide-fade-in", 2200, 400)}
            >
              <RefreshCw size={12} style={SPIN} /> retrying automatically
            </p>
            <Attempt attempt={2} tone="success" outcome="succeeded" at={3600} />
          </div>
        </div>
      </At>
      <At x={490} y={40} w={430} at={4600}>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] p-4">
          <p className="text-sm font-semibold">Cost Usage · Billing</p>
          <p className="text-muted-foreground text-[11px]">
            needs a change before it can run
          </p>
          <div className="mt-3 space-y-2">
            <Attempt
              attempt={1}
              tone="danger"
              outcome="failed"
              error="access_denied"
              at={5200}
            />
          </div>
          <p
            className="mt-3 text-[11px] leading-5"
            style={anim("guide-fade-in", 6200, 400)}
          >
            Not retried — switch the permission on in the stack, then sync
            again.
          </p>
        </div>
      </At>
      <At x={40} y={300} w={880} at={7400}>
        <div className="border-border-soft bg-card-strong flex items-center justify-between rounded-2xl border px-5 py-4 text-xs">
          <span className="flex items-center gap-2">
            <Server size={15} className="text-accent" />
            Other jobs in the same run carry on
          </span>
          <span className="flex gap-1.5">
            {["Inventory · Dev", "Metrics · Prod", "Cost Summary"].map(
              (name, index) => (
                <MockBadge
                  key={name}
                  tone="success"
                  style={anim("guide-appear-scale", 7700 + index * 200, 250)}
                >
                  {name}
                </MockBadge>
              ),
            )}
          </span>
        </div>
      </At>
      <At x={40} y={392} w={880} at={8800} from="fade">
        <p className="text-muted-foreground text-center text-[11px]">
          The run ends partially succeeded — the failed job shows its error and
          attempt history.
        </p>
      </At>
    </>
  );
}

function ResourceRow({
  name,
  missingAt,
}: {
  name: string;
  missingAt?: number;
}) {
  return (
    <div className="border-border-soft flex items-center justify-between rounded-lg border px-3 py-2 text-[11px]">
      <span className="font-mono">{name}</span>
      <span className="relative">
        {missingAt ? (
          <>
            <Until until={missingAt}>
              <MockBadge tone="success">Active</MockBadge>
            </Until>
            <span
              className="absolute top-0 right-0"
              style={anim("guide-appear-scale", missingAt, 250)}
            >
              <MockBadge tone="warning">Missing</MockBadge>
            </span>
          </>
        ) : (
          <MockBadge tone="success">Active</MockBadge>
        )}
      </span>
    </div>
  );
}

/** Only a complete snapshot can mark something missing. */
export function SafetyScene() {
  return (
    <>
      <At x={40} y={40} w={420} at={0}>
        <div className="border-border-soft bg-card-strong rounded-2xl border p-4">
          <p className="text-sm font-semibold">Complete sync</p>
          <p className="text-muted-foreground text-[11px]">
            eu-central-1 · instances
          </p>
          <MockProgress
            className="mt-3"
            at={500}
            duration={2000}
            barClassName="bg-success"
          />
          <div className="mt-3 space-y-1.5">
            <ResourceRow name="i-0a1 · api" />
            <ResourceRow name="i-0b2 · worker" />
            <ResourceRow name="i-0c3 · old-batch" missingAt={2800} />
          </div>
          <p
            className="text-muted-foreground mt-3 text-[11px] leading-5"
            style={anim("guide-fade-in", 3200, 400)}
          >
            Not found by a complete sync → Missing. Its record stays.
          </p>
        </div>
      </At>
      <At x={500} y={40} w={420} at={4200}>
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.05] p-4">
          <p className="text-sm font-semibold">Failed part-way</p>
          <p className="text-muted-foreground text-[11px]">
            eu-central-1 · databases
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="bg-foreground/10 h-1.5 flex-1 overflow-hidden rounded-full">
              <div
                className="h-full w-3/5 origin-left rounded-full bg-amber-500"
                style={anim("guide-grow-x", 4600, 1200, "linear")}
              />
            </div>
            <span style={anim("guide-fade-in", 5800, 200)}>
              <MockBadge tone="warning">failed</MockBadge>
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <ResourceRow name="db-orders" />
            <ResourceRow name="db-analytics" />
            <ResourceRow name="db-legacy" />
          </div>
          <p
            className="mt-3 flex items-center gap-1.5 text-[11px] leading-5"
            style={anim("guide-fade-in", 6300, 400)}
          >
            <ShieldCheck size={13} className="text-success shrink-0" />
            Incomplete — nothing is marked missing.
          </p>
        </div>
      </At>
    </>
  );
}

/** Health per dataset, independent of the connection's verification. */
export function HealthScene() {
  const cards: {
    name: string;
    status: string;
    tone: MockTone;
    detail: string;
    at: number;
  }[] = [
    {
      name: "Inventory Resources",
      status: "Healthy",
      tone: "success",
      detail: "Last successful 12m ago · Every hour",
      at: 900,
    },
    {
      name: "Cost Usage",
      status: "Degraded",
      tone: "warning",
      detail: "Failed for 1 of 3 accounts",
      at: 2000,
    },
    {
      name: "Runtime Interactions",
      status: "Failing",
      tone: "warning",
      detail: "Failed for every account",
      at: 3100,
    },
    {
      name: "Utilization Metrics",
      status: "Delayed",
      tone: "warning",
      detail: "Last successful 7h ago · Every 3 hours",
      at: 4200,
    },
  ];
  return (
    <>
      <At x={40} y={28} w={880} at={0}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <HeartPulse size={16} className="text-accent" /> Dataset sync health
          </span>
          <span className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Connection</span>
            <MockBadge tone="success">connected</MockBadge>
          </span>
        </div>
      </At>
      {cards.map((card, index) => (
        <At
          key={card.name}
          x={40 + (index % 2) * 450}
          y={84 + Math.floor(index / 2) * 150}
          w={430}
          at={card.at}
          from="scale"
        >
          <div className="border-border-soft bg-card-strong relative rounded-2xl border p-4">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold">{card.name}</span>
              <MockBadge tone={card.tone}>{card.status}</MockBadge>
            </div>
            <p className="text-muted-foreground border-border-soft mt-3 border-t pt-3 text-[11px]">
              {card.detail}
            </p>
            <Highlight at={card.at + 300} />
          </div>
        </At>
      ))}
      <At x={40} y={404} w={880} at={5600} from="fade">
        <p className="text-muted-foreground text-center text-xs leading-5">
          The connection stays connected while one dataset fails — fix that
          dataset&apos;s permission or setting, then sync it again.
        </p>
      </At>
    </>
  );
}

/** The Sync page and the indicator beside Sync in the menu. */
export function WatchScene() {
  const rows: {
    name: string;
    synced: string;
    healthy: string;
    state: string;
    tone: MockTone;
    spinning?: boolean;
  }[] = [
    {
      name: "AWS Production",
      synced: "Oct 20, 10:42",
      healthy: "4 / 5",
      state: "Needs attention",
      tone: "warning",
    },
    {
      name: "AWS Finance",
      synced: "Oct 20, 09:15",
      healthy: "3 / 3",
      state: "Healthy",
      tone: "success",
    },
    {
      name: "AWS Sandbox",
      synced: "Never",
      healthy: "—",
      state: "Syncing",
      tone: "accent",
      spinning: true,
    },
  ];
  return (
    <MockWindow
      url="app.dilanix.com/dashboard/sync"
      x={40}
      y={24}
      w={880}
      h={492}
    >
      <div className="flex h-full">
        <div className="border-border-soft bg-surface w-48 shrink-0 space-y-1 border-r p-3 text-xs">
          {["Overview", "Integrations", "Sync", "Notifications"].map((item) => (
            <div
              key={item}
              className={
                item === "Sync"
                  ? "bg-accent/10 text-accent relative flex items-center justify-between rounded-lg px-3 py-2 font-medium"
                  : "text-muted-foreground px-3 py-2"
              }
            >
              {item}
              {item === "Sync" ? (
                <span className="relative size-2.5">
                  <Until until={4200} className="absolute inset-0">
                    <span
                      className="border-accent block size-2.5 rounded-full border-2 border-t-transparent"
                      style={SPIN}
                    />
                  </Until>
                  <span
                    className="absolute inset-0 size-2 rounded-full bg-red-500 shadow-[0_0_8px_rgb(239_68_68)]"
                    style={anim("guide-appear-scale", 4200, 250)}
                  />
                  <Highlight at={1200} className="-inset-2 rounded-full" />
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex-1 p-5">
          <p className="text-base font-semibold">Sync</p>
          <div className="border-border-soft mt-3 overflow-hidden rounded-xl border">
            <div className="border-border-soft text-muted-foreground grid grid-cols-[1.4fr_1fr_0.8fr_1fr] border-b px-4 py-2 text-[10px] font-semibold uppercase">
              <span>Connection</span>
              <span>Last synced</span>
              <span>Datasets</span>
              <span>Status</span>
            </div>
            {rows.map((row, index) => (
              <div
                key={row.name}
                className="border-border-soft grid grid-cols-[1.4fr_1fr_0.8fr_1fr] items-center border-b px-4 py-3 text-xs last:border-b-0"
                style={anim("guide-appear-up", 600 + index * 300)}
              >
                <span className="font-semibold">{row.name}</span>
                <span className="text-muted-foreground">{row.synced}</span>
                <span className="text-accent font-mono">{row.healthy}</span>
                <MockBadge tone={row.tone} className="w-fit">
                  {row.spinning ? <Loader2 size={11} style={SPIN} /> : null}
                  {row.state}
                </MockBadge>
              </div>
            ))}
          </div>
          <p
            className="text-muted-foreground mt-4 text-[11px] leading-5"
            style={anim("guide-fade-in", 2400, 400)}
          >
            Open a row to sync, change schedules or read a run&apos;s jobs — the
            same panel as the connection&apos;s Sync &amp; Activity tab.
          </p>
        </div>
      </div>
    </MockWindow>
  );
}

/** Fresh data lands in every product. */
export function OutcomeScene() {
  return (
    <>
      <Lines
        flow
        paths={PRODUCTS.map((_, index) => ({
          d: `M 330 270 C 400 270 400 ${92 + index * 112} 470 ${92 + index * 112}`,
          at: 800 + index * 250,
        }))}
      />
      <At x={80} y={210} w={250} at={0} from="scale">
        <div className="border-accent/45 bg-accent/10 rounded-2xl border p-4">
          <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
            <Sparkles size={18} />
          </span>
          <p className="mt-3 text-sm font-semibold">Fresh datasets</p>
          <p className="text-muted-foreground text-[11px]">
            after every successful sync
          </p>
        </div>
      </At>
      {PRODUCTS.map((product, index) => (
        <At
          key={product.name}
          x={470}
          y={64 + index * 112}
          w={260}
          at={1000 + index * 250}
        >
          <div className="relative">
            <Node tone="success" icon={product.icon} title={product.name} />
            <span
              className="bg-success text-accent-foreground absolute top-1/2 -right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full"
              style={anim("guide-appear-scale", 1500 + index * 250, 250)}
            >
              <Check size={13} />
            </span>
          </div>
        </At>
      ))}
      <At x={760} y={400} w={180} at={2900}>
        <span className="border-accent/40 bg-accent/10 text-accent flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium">
          <Lightbulb size={13} /> First sync → recommendation scan
        </span>
      </At>
    </>
  );
}
