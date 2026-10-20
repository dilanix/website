"use client";

import {
  Ban,
  Boxes,
  Building2,
  Check,
  CircleDollarSign,
  Copy,
  Gauge,
  Lightbulb,
  Loader2,
  Lock,
  Network,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
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
  MockField,
  MockWindow,
  Node,
  ProviderTile,
  Typing,
  Until,
} from "./scene-kit";

const SPIN = { animation: "guide-spin 1s linear infinite" };

/** Providers on the left, Dilanix in the middle, products on the right. */
export function IntroScene() {
  const providers = [
    { code: "AWS", name: "Amazon Web Services", live: true },
    { code: "GCP", name: "Google Cloud Platform" },
    { code: "AZ", name: "Microsoft Azure" },
    { code: "GH", name: "GitHub" },
    { code: "CF", name: "Cloudflare" },
  ];
  const products = [
    { icon: <Boxes size={16} />, name: "Resources" },
    { icon: <Network size={16} />, name: "Infrastructure graph" },
    { icon: <CircleDollarSign size={16} />, name: "Cost" },
    { icon: <Lightbulb size={16} />, name: "Recommendations" },
  ];
  return (
    <>
      <Lines
        flow
        paths={[
          { d: "M 300 108 C 360 108 360 270 410 270", at: 1400 },
          ...products.map((_, index) => ({
            d: `M 560 270 C 610 270 610 ${118 + index * 92} 660 ${118 + index * 92}`,
            at: 2600 + index * 250,
          })),
        ]}
      />
      {providers.map((provider, index) => (
        <At
          key={provider.code}
          x={56}
          y={80 + index * 84}
          w={244}
          at={200 + index * 180}
          from="left"
        >
          <div
            className={
              provider.live
                ? "border-accent/50 bg-card-strong relative flex items-center gap-3 rounded-xl border p-2.5 shadow-[0_12px_30px_var(--shadow-card)]"
                : "border-border-soft bg-card-strong flex items-center gap-3 rounded-xl border p-2.5 opacity-55"
            }
          >
            <ProviderTile
              code={provider.code}
              className={
                provider.live
                  ? undefined
                  : "bg-foreground/5 text-muted-foreground dark:text-muted-foreground"
              }
            />
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold">
                {provider.name}
              </span>
              <span className="text-muted-foreground text-[10px]">
                {provider.live ? "Connect today" : "Coming soon"}
              </span>
            </span>
            {provider.live ? <Highlight at={1000} /> : null}
          </div>
        </At>
      ))}
      <At x={410} y={222} w={150} at={900} from="scale">
        <div className="border-accent/50 bg-accent/10 flex flex-col items-center gap-2 rounded-2xl border p-4 shadow-[0_18px_44px_var(--shadow-brand)]">
          <span className="bg-accent text-accent-foreground flex size-11 items-center justify-center rounded-xl">
            <Sparkles size={20} />
          </span>
          <span className="text-sm font-semibold">Dilanix</span>
          <span className="text-muted-foreground text-[10px]">
            one copy of your cloud
          </span>
        </div>
      </At>
      {products.map((product, index) => (
        <At
          key={product.name}
          x={660}
          y={92 + index * 92}
          w={240}
          at={2900 + index * 250}
        >
          <Node icon={product.icon} title={product.name} />
        </At>
      ))}
    </>
  );
}

/** Organization → provider → connections → accounts. */
export function ConnectionModelScene() {
  const accounts = [
    { id: "111111111111", label: "Prod" },
    { id: "222222222222", label: "Dev" },
    { id: "333333333333", label: "Data" },
  ];
  return (
    <>
      <Lines
        paths={[
          { d: "M 160 140 L 160 200", at: 900 },
          { d: "M 160 262 C 160 300 330 270 330 160", at: 1900 },
          { d: "M 160 262 C 160 330 330 420 330 420", at: 5600 },
          ...accounts.map((_, index) => ({
            d: `M 530 160 C 580 160 580 ${100 + index * 86} 630 ${100 + index * 86}`,
            at: 3200 + index * 350,
          })),
          { d: "M 530 420 C 580 420 580 440 630 440", at: 6200 },
        ]}
      />
      <At x={60} y={80} w={200} at={200}>
        <Node
          icon={<Building2 size={16} />}
          title="Your organization"
          detail="Acme"
        />
      </At>
      <At x={60} y={200} w={200} at={900}>
        <div className="border-border-soft bg-card-strong flex items-center gap-2.5 rounded-xl border px-3 py-2.5 shadow-[0_12px_30px_var(--shadow-card)]">
          <ProviderTile code="AWS" className="size-8" />
          <span className="text-sm font-semibold">Provider</span>
        </div>
      </At>
      <At x={330} y={128} w={200} at={1900}>
        <Node
          tone="accent"
          icon={<Server size={16} />}
          title="AWS Production"
          detail="Connection"
        />
      </At>
      {accounts.map((account, index) => (
        <At
          key={account.id}
          x={630}
          y={72 + index * 86}
          w={260}
          at={3300 + index * 350}
        >
          <div className="border-border-soft bg-card-strong flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 shadow-[0_12px_30px_var(--shadow-card)]">
            <span>
              <span className="block text-sm font-semibold">
                {account.label}
              </span>
              <span className="text-muted-foreground font-mono text-[11px]">
                {account.id}
              </span>
            </span>
            <MockBadge tone="success">verified</MockBadge>
          </div>
        </At>
      ))}
      <At x={330} y={390} w={200} at={5600}>
        <Node
          icon={<Server size={16} />}
          title="AWS Finance"
          detail="Another connection"
        />
      </At>
      <At x={630} y={412} w={260} at={6200}>
        <div className="border-border-soft bg-card-strong flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5">
          <span>
            <span className="block text-sm font-semibold">Billing</span>
            <span className="text-muted-foreground font-mono text-[11px]">
              444444444444
            </span>
          </span>
          <MockBadge tone="success">verified</MockBadge>
        </div>
      </At>
      <At x={630} y={22} at={3000} from="fade">
        <span className="text-accent text-[11px] font-semibold tracking-[0.16em] uppercase">
          Targets — the accounts it reads
        </span>
      </At>
      <At x={330} y={96} at={1900} from="fade">
        <span className="text-accent text-[11px] font-semibold tracking-[0.16em] uppercase">
          Connection
        </span>
      </At>
    </>
  );
}

function IntegrationsPageMock() {
  return (
    <div className="p-5">
      <p className="text-lg font-semibold tracking-tight">Integrations</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["Providers", "11"],
          ["Connections", "0"],
          ["Needs attention", "0"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border-border-soft bg-card-strong rounded-xl border p-2.5"
          >
            <p className="text-muted-foreground text-[10px]">{label}</p>
            <p className="font-mono text-base font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs font-semibold">Cloud</p>
      <div className="mt-2 grid grid-cols-3 gap-3">
        {[
          { code: "AWS", name: "Amazon Web Services", live: true },
          { code: "GCP", name: "Google Cloud Platform" },
          { code: "AZ", name: "Microsoft Azure" },
        ].map((provider) => (
          <div
            key={provider.code}
            className="border-border-soft bg-card-strong h-36 rounded-xl border p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <ProviderTile
                code={provider.code}
                className={
                  provider.live
                    ? "size-8"
                    : "bg-foreground/5 text-muted-foreground dark:text-muted-foreground size-8"
                }
              />
              <MockButton
                variant="outline"
                cursor={provider.live ? "add-connection" : undefined}
                className={
                  provider.live
                    ? "relative"
                    : "text-muted-foreground opacity-60"
                }
              >
                {provider.live ? (
                  <>
                    <Plus size={11} /> Add connection
                  </>
                ) : (
                  "Coming soon"
                )}
              </MockButton>
            </div>
            <p className="mt-3 text-xs font-semibold">{provider.name}</p>
            <p className="text-muted-foreground mt-1 text-[10px]">
              No connections yet.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Add connection → name it → AWS setup. */
export function AddConnectionScene() {
  return (
    <>
      <MockWindow
        url="app.dilanix.com/dashboard/integrations"
        x={60}
        y={24}
        w={840}
        h={490}
      >
        <IntegrationsPageMock />
        <div
          className="bg-background/70 absolute inset-0 backdrop-blur-[2px]"
          style={anim("guide-fade-in", 1900, 300)}
        />
        <At x={250} y={70} w={340} at={1900} from="scale">
          <div className="border-foreground/15 bg-background rounded-xl border p-5 shadow-2xl">
            <Until until={5600}>
              <p className="text-base font-semibold">
                Connect Amazon Web Services
              </p>
              <MockField
                className="mt-4"
                label="Connection name"
                value="AWS Production"
                at={2600}
                cursor="connection-name"
              />
              <MockButton className="mt-4 w-full" cursor="connect">
                Connect
              </MockButton>
            </Until>
          </div>
        </At>
        <At x={250} y={70} w={340} at={5600} from="scale">
          <div className="border-foreground/15 bg-background rounded-xl border p-5 shadow-2xl">
            <p className="text-base font-semibold">AWS setup</p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-4">
              Grant a read-only cross-account role for AWS Production.
            </p>
            <MockButton className="mt-4" cursor="launch">
              Launch in AWS CloudFormation
            </MockButton>
            <p className="text-muted-foreground mt-4 text-[10px]">
              External ID — paste this into the console
            </p>
            <div className="border-foreground/15 mt-1 flex items-center justify-between rounded-lg border px-2.5 py-2 font-mono text-[11px]">
              dlx-7f3a9c2e41b8
              <span className="text-accent flex items-center gap-1 font-sans text-[10px]">
                <Copy size={11} /> Copy
              </span>
            </div>
            <MockButton variant="outline" className="mt-4 w-full">
              Continue
            </MockButton>
          </div>
        </At>
      </MockWindow>
      <Cursor
        points={[
          { x: 700, y: 470, at: 0 },
          { to: "add-connection", at: 1400, click: true },
          { to: "add-connection", at: 2000 },
          { to: "connection-name", dx: 90, at: 2700 },
          { to: "connect", at: 5000, click: true },
          { to: "connect", at: 5600 },
          { to: "launch", dy: 14, at: 7600 },
        ]}
      />
    </>
  );
}

/** Dilanix assumes one read-only role, only with the External ID. */
export function ReadOnlyRoleScene() {
  const services = ["EC2", "RDS", "S3", "CloudWatch", "Billing"];
  return (
    <>
      <Lines
        flow
        paths={[{ d: "M 250 250 L 520 250", at: 1600, duration: 900 }]}
      />
      <Lines
        className="stroke-success/60"
        paths={services.map((_, index) => ({
          d: `M 690 280 C 690 330 ${560 + index * 72} 340 ${560 + index * 72} 384`,
          at: 3600 + index * 150,
        }))}
      />
      <At x={60} y={200} w={190} at={200}>
        <div className="border-accent/45 bg-accent/10 rounded-2xl border p-4">
          <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
            <Sparkles size={18} />
          </span>
          <p className="mt-3 text-sm font-semibold">Dilanix</p>
          <p className="text-muted-foreground text-[11px]">
            its own AWS role — no keys from you
          </p>
        </div>
      </At>
      <At x={290} y={190} w={200} at={1300} from="scale">
        <div className="flex flex-col items-center gap-1.5">
          <span className="border-border-soft bg-card-strong flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium shadow-sm">
            <Lock size={12} className="text-accent" /> External ID
            <span className="font-mono">dlx-7f3a…</span>
          </span>
          <span className="text-muted-foreground mt-8 font-mono text-[11px]">
            sts:AssumeRole
          </span>
        </div>
      </At>
      <At x={510} y={60} w={400} at={600}>
        <div className="border-border-soft bg-card-strong/60 h-[400px] rounded-2xl border border-dashed p-4">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
            Your AWS account
          </p>
        </div>
      </At>
      <At x={590} y={206} w={220} at={2500} from="scale">
        <Node
          tone="success"
          icon={<ShieldCheck size={16} />}
          title="DilanixIntegrationRole"
          detail="read-only IAM role"
        />
      </At>
      {services.map((service, index) => (
        <At
          key={service}
          x={528 + index * 72}
          y={386}
          w={64}
          at={3700 + index * 150}
          from="scale"
        >
          <span className="border-border-soft bg-card-strong flex h-9 items-center justify-center rounded-lg border text-[10px] font-semibold">
            {service}
          </span>
        </At>
      ))}
      <At x={60} y={382} w={400} at={5600}>
        <ul className="space-y-1.5 text-xs">
          {[
            [true, "Describe and list resources"],
            [true, "Read bills, metrics and the logs you allow"],
            [false, "Create, change, stop or delete anything"],
            [false, "Be assumed without this connection's External ID"],
          ].map(([can, text], index) => (
            <li
              key={String(text)}
              className="flex items-center gap-2"
              style={anim("guide-appear-left", 5600 + index * 350)}
            >
              <span
                className={
                  can
                    ? "bg-success/15 text-success flex size-5 items-center justify-center rounded-full"
                    : "flex size-5 items-center justify-center rounded-full bg-red-500/12 text-red-500"
                }
              >
                {can ? <Check size={12} /> : <X size={12} />}
              </span>
              {text}
            </li>
          ))}
        </ul>
      </At>
    </>
  );
}

/** Copy the External ID, fill the stack, create it. */
export function CloudFormationScene() {
  const capabilities = [
    ["Enable inventory collection", "true"],
    ["Enable billing collection", "true"],
    ["Enable CloudWatch and operational metrics", "true"],
    ["Enable access to CloudWatch Logs content", "true"],
    ["Create AWS FOCUS 1.2 export", "true"],
  ];
  return (
    <>
      <At x={24} y={70} w={250} at={0}>
        <div className="border-foreground/15 bg-background rounded-xl border p-4 shadow-xl">
          <p className="text-sm font-semibold">Dilanix · AWS setup</p>
          <p className="text-muted-foreground mt-3 text-[10px]">External ID</p>
          <div className="border-foreground/15 relative mt-1 flex items-center justify-between rounded-lg border px-2 py-1.5 font-mono text-[10px]">
            dlx-7f3a9c2e41b8
            <span
              data-cursor="copy"
              className="text-accent flex items-center gap-1 font-sans"
            >
              <Copy size={10} />
              <Until until={1300}>Copy</Until>
            </span>
            <span
              className="text-success absolute right-2 font-sans"
              style={anim("guide-fade-in", 1300, 200)}
            >
              Copied
            </span>
          </div>
          <MockButton className="mt-3 w-full">
            Launch in AWS CloudFormation
          </MockButton>
        </div>
      </At>
      <MockWindow
        url="us-east-1.console.aws.amazon.com/cloudformation"
        x={300}
        y={20}
        w={636}
        h={500}
      >
        <div className="p-4 text-xs">
          <p className="text-sm font-semibold">Quick create stack</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MockField label="Stack name" value="DilanixIntegration" mono />
            <MockField
              label="Dilanix workload role ARN"
              value="arn:aws:iam::…:role/dilanix"
              mono
            />
          </div>
          <div className="relative mt-3">
            <p className="mb-1 text-[11px] font-medium">Dilanix External ID</p>
            <div
              data-cursor="external-id"
              className="border-foreground/15 bg-background flex h-8 items-center rounded-lg border px-2.5 font-mono"
            >
              <span style={anim("guide-fade-in", 2700, 120)}>
                dlx-7f3a9c2e41b8
              </span>
            </div>
            <Highlight at={2300} />
          </div>
          <p className="mt-4 text-[11px] font-semibold">Data capabilities</p>
          <div className="mt-1.5 space-y-1.5">
            {capabilities.map(([label, value]) => (
              <div
                key={label}
                className="border-border-soft flex items-center justify-between rounded-lg border px-2.5 py-1.5"
              >
                <span>{label}</span>
                {label.includes("Logs") ? (
                  <span data-cursor="logs" className="relative font-mono">
                    <Until until={4900}>true</Until>
                    <span
                      className="absolute top-0 right-0 text-amber-600 dark:text-amber-300"
                      style={anim("guide-fade-in", 4900, 200)}
                    >
                      false
                    </span>
                  </span>
                ) : (
                  <span className="font-mono">{value}</span>
                )}
              </div>
            ))}
          </div>
          <MockCheck
            className="mt-4"
            label="I acknowledge that AWS CloudFormation might create IAM resources with custom names."
            checkedAt={6900}
            cursor="acknowledge"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="relative">
              <span style={anim("guide-fade-in", 8000, 200)}>
                <Until until={9800} className="inline-flex">
                  <MockBadge tone="accent">
                    <Loader2 size={11} style={SPIN} /> CREATE_IN_PROGRESS
                  </MockBadge>
                </Until>
              </span>
              <span
                className="absolute top-0 left-0"
                style={anim("guide-appear-scale", 9800, 300)}
              >
                <MockBadge tone="success">
                  <Check size={11} /> CREATE_COMPLETE
                </MockBadge>
              </span>
            </span>
            <MockButton cursor="create-stack">Create stack</MockButton>
          </div>
        </div>
      </MockWindow>
      <Cursor
        points={[
          { x: 140, y: 480, at: 0 },
          { to: "copy", at: 1000, click: true },
          { to: "copy", at: 1500 },
          { to: "external-id", at: 2400, click: true },
          { to: "external-id", at: 3400 },
          { to: "logs", at: 4500, click: true },
          { to: "logs", at: 5200 },
          { to: "acknowledge", at: 6600, click: true },
          { to: "acknowledge", at: 7100 },
          { to: "create-stack", at: 7800, click: true },
          { to: "create-stack", at: 8400 },
          { x: 780, y: 510, at: 10400 },
        ]}
      />
    </>
  );
}

/** Enter the account ID; Dilanix assumes the role and confirms it. */
export function VerifyScene() {
  return (
    <>
      <At x={70} y={70} w={380} at={0} from="scale">
        <div className="border-foreground/15 bg-background rounded-xl border p-5 shadow-2xl">
          <p className="text-base font-semibold">Verify AWS connection</p>
          <p className="text-muted-foreground mt-1 text-[11px] leading-4">
            Enter the AWS account ID the stack was created in.
          </p>
          <MockField
            className="mt-4"
            label="AWS account ID"
            value="123456789012"
            mono
            at={900}
            cursor="account-id"
          />
          <div className="relative mt-4">
            <MockButton className="w-full" cursor="verify">
              <Until until={3300} className="inline-flex">
                Verify connection
              </Until>
              <span
                className="absolute inset-0 flex items-center justify-center gap-1.5"
                style={anim("guide-fade-in", 3300, 150)}
              >
                <Until
                  until={5600}
                  className="inline-flex items-center gap-1.5"
                >
                  <Loader2 size={12} style={SPIN} /> Verifying…
                </Until>
              </span>
            </MockButton>
          </div>
        </div>
      </At>
      <Lines
        flow
        paths={[{ d: "M 450 210 L 600 210", at: 3500, duration: 600 }]}
      />
      <At x={460} y={176} w={140} at={3700} from="fade">
        <p className="text-muted-foreground text-center font-mono text-[10px] leading-4">
          AssumeRole
          <br />
          GetCallerIdentity
        </p>
      </At>
      <At x={610} y={150} w={290} at={3500} from="scale">
        <div className="border-border-soft bg-card-strong/70 rounded-2xl border border-dashed p-4">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
            AWS account
          </p>
          <p className="mt-1 font-mono text-sm">123456789012</p>
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-[11px]">
            <ShieldCheck size={13} className="text-success" />
            DilanixIntegrationRole
          </p>
        </div>
      </At>
      <At x={70} y={330} w={830} at={5700}>
        <div className="border-success/40 bg-success/[0.07] flex items-center justify-between gap-4 rounded-2xl border p-4">
          <span className="flex items-center gap-3">
            <span className="bg-success text-accent-foreground flex size-9 items-center justify-center rounded-full">
              <Check size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold">AWS connected</span>
              <span className="text-muted-foreground text-[11px]">
                AWS Production
              </span>
            </span>
          </span>
          <MockBadge tone="success">connected</MockBadge>
        </div>
      </At>
      <At x={70} y={418} w={830} at={6500}>
        <div className="border-border-soft bg-card-strong flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs">
          <span>
            <span className="font-semibold">Target</span>
            <span className="text-muted-foreground ml-2 font-mono">
              account · 123456789012
            </span>
          </span>
          <MockBadge tone="success">verified</MockBadge>
        </div>
      </At>
      <Cursor
        points={[
          { x: 300, y: 500, at: 0 },
          { to: "account-id", at: 700, click: true },
          { to: "account-id", dx: 60, at: 2300 },
          { to: "verify", at: 3100, click: true },
          { to: "verify", at: 3600 },
          { x: 330, y: 500, at: 6500 },
        ]}
      />
    </>
  );
}

function TargetRow({
  id,
  label,
  labelAt,
  at,
  verifiedAt,
}: {
  id: string;
  label: string;
  labelAt: number;
  at: number;
  verifiedAt: number;
}) {
  return (
    <div
      className="border-border-soft bg-card-strong flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
      style={anim("guide-appear-up", at)}
    >
      <span>
        <span
          data-cursor={`target-${label}`}
          className="block h-5 w-16 text-sm font-semibold"
        >
          <Typing text={label} at={labelAt} />
        </span>
        <span className="text-muted-foreground font-mono text-[11px]">
          account · {id}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <span className="text-muted-foreground text-[11px]">
          Rename · Replace · Disable
        </span>
        <span className="relative">
          <span style={anim("guide-fade-in", at, 200)}>
            <Until until={verifiedAt}>
              <MockBadge tone="neutral">verifying</MockBadge>
            </Until>
          </span>
          <span
            className="absolute top-0 right-0"
            style={anim("guide-appear-scale", verifiedAt, 300)}
          >
            <MockBadge tone="success">verified</MockBadge>
          </span>
        </span>
      </span>
    </div>
  );
}

/** One stack per account, Add target, rename; the payer account. */
export function MoreAccountsScene() {
  return (
    <>
      <At x={60} y={36} w={500} at={0}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Provider identity</p>
          <span className="relative">
            <MockButton variant="outline" cursor="add-target">
              <Plus size={11} /> Add target
            </MockButton>
            <Highlight at={2300} />
          </span>
        </div>
      </At>
      <div className="absolute top-[86px] left-[60px] w-[500px] space-y-3">
        <TargetRow
          id="111111111111"
          label="Prod"
          labelAt={5400}
          at={0}
          verifiedAt={0}
        />
        <TargetRow
          id="222222222222"
          label="Dev"
          labelAt={6300}
          at={3000}
          verifiedAt={4200}
        />
      </div>
      <At x={60} y={276} w={500} at={1200} from="fade">
        <p className="text-muted-foreground text-[11px] leading-5">
          Same stack, same External ID, in each account — then Add target with
          its account ID.
        </p>
      </At>
      <At x={620} y={40} w={290} at={7600}>
        <div className="border-border-soft bg-card-strong/70 rounded-2xl border border-dashed p-4">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
            AWS Organization
          </p>
          <Node
            className="mt-3"
            tone="accent"
            icon={<CircleDollarSign size={16} />}
            title="Management account"
            detail="the bill for every member"
          />
          <div className="mt-6 grid grid-cols-2 gap-2">
            {["Prod", "Dev", "Data", "Sandbox"].map((name, index) => (
              <span
                key={name}
                className="border-border-soft bg-card-strong rounded-lg border px-2 py-1.5 text-center text-[11px] font-medium"
                style={anim("guide-appear-up", 8200 + index * 150)}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </At>
      <Cursor
        points={[
          { x: 300, y: 500, at: 0 },
          { to: "add-target", at: 2400, click: true },
          { to: "add-target", at: 2900 },
          { to: "target-Prod", at: 5200, click: true },
          { to: "target-Prod", at: 5800 },
          { to: "target-Dev", at: 6200, click: true },
          { to: "target-Dev", at: 6800 },
          { x: 300, y: 500, at: 8600 },
        ]}
      />
    </>
  );
}

/** Capabilities switched on, and what each one brings. */
export function AccessScene() {
  const rows = [
    {
      name: "Inventory Read",
      slug: "inventory.read",
      at: 1500,
      brings: ["Resources", "Infrastructure graph"],
      icon: <Boxes size={15} />,
    },
    {
      name: "Billing Read",
      slug: "billing.read",
      at: 3000,
      brings: ["Cost", "Budgets and anomalies"],
      icon: <CircleDollarSign size={15} />,
    },
    {
      name: "Metrics Read",
      slug: "metrics.read",
      at: 4500,
      brings: ["Utilization", "Rightsizing"],
      icon: <Gauge size={15} />,
    },
  ];
  return (
    <>
      <At x={50} y={36} w={400} at={0}>
        <div className="border-border-soft bg-card-strong rounded-2xl border p-4 shadow-[0_18px_44px_var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Capabilities</p>
            <MockButton
              cursor="save"
              style={anim("guide-appear-scale", 1600, 250)}
            >
              Save changes
            </MockButton>
          </div>
          <div className="mt-3 space-y-2">
            {rows.map((row) => (
              <div
                key={row.slug}
                className="border-foreground/10 rounded-xl border p-3"
              >
                <MockCheck
                  label={row.name}
                  detail={row.slug}
                  checkedAt={row.at}
                  cursor={row.slug}
                />
              </div>
            ))}
            <div className="border-foreground/10 rounded-xl border p-3 opacity-50">
              <MockCheck label="Security Read" detail="not collected yet" />
            </div>
          </div>
        </div>
      </At>
      <Cursor
        points={[
          { x: 250, y: 500, at: 0 },
          { to: "inventory.read", at: 1400, click: true },
          { to: "inventory.read", at: 1800 },
          { to: "billing.read", at: 2900, click: true },
          { to: "billing.read", at: 3300 },
          { to: "metrics.read", at: 4400, click: true },
          { to: "metrics.read", at: 4800 },
          { to: "save", at: 5600, click: true },
          { to: "save", at: 6200 },
          { x: 250, y: 500, at: 8000 },
        ]}
      />
      <At x={50} y={360} w={400} at={6200} from="fade">
        <p className="text-muted-foreground text-[11px] leading-5">
          Only capabilities your organization&apos;s plan grants are listed; the
          stack&apos;s matching permission must be on too.
        </p>
      </At>
      <Lines
        flow
        paths={rows.map((row, index) => ({
          d: `M 452 ${103 + index * 54} C 520 ${103 + index * 54} 520 ${86 + index * 140} 580 ${86 + index * 140}`,
          at: row.at + 200,
        }))}
      />
      {rows.map((row, index) => (
        <div key={row.slug}>
          {row.brings.map((name, offset) => (
            <At
              key={name}
              x={580 + offset * 172}
              y={58 + index * 140}
              w={160}
              at={row.at + 500 + offset * 200}
              from="scale"
            >
              <Node tone="success" icon={row.icon} title={name} />
            </At>
          ))}
        </div>
      ))}
    </>
  );
}

const REGIONS = [
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-south-1",
  "ap-southeast-1",
];

/** Region scopes decide where Dilanix reads; removing one leaves history. */
export function ScopesScene() {
  const selected: Record<string, { at: number; removedAt?: number }> = {
    "eu-central-1": { at: 3600 },
    "us-east-1": { at: 4800, removedAt: 8200 },
  };
  return (
    <>
      <At x={40} y={36} w={420} at={0}>
        <div className="border-border-soft bg-card-strong rounded-2xl border p-4 shadow-[0_18px_44px_var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Scopes</p>
            <MockButton variant="outline" cursor="add-scope">
              <Plus size={11} /> Add scope
            </MockButton>
          </div>
          <div className="border-foreground/10 divide-foreground/10 mt-3 divide-y rounded-xl border">
            {(["eu-central-1", "us-east-1"] as const).map((region) => (
              <div
                key={region}
                style={anim("guide-appear-up", selected[region].at)}
              >
                <div
                  className="flex items-center justify-between px-3 py-2.5 text-xs"
                  style={
                    selected[region].removedAt
                      ? anim("guide-fade-out", selected[region].removedAt!, 300)
                      : undefined
                  }
                >
                  <span>
                    <span className="text-muted-foreground block text-[10px] tracking-wider uppercase">
                      region
                    </span>
                    <span className="font-mono">{region}</span>
                  </span>
                  <span data-cursor={`remove-${region}`}>
                    <Trash2 size={13} className="text-muted-foreground" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </At>
      <At x={40} y={250} w={420} at={1100} from="scale">
        <div className="border-foreground/15 bg-background rounded-xl border p-4 shadow-2xl">
          <Until until={3500}>
            <p className="text-sm font-semibold">Add scope</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MockField label="Scope type" value="region" at={1500} />
              <MockField
                label="Scope key"
                value="eu-central-1"
                mono
                at={2300}
              />
            </div>
          </Until>
        </div>
      </At>
      <div className="absolute top-[36px] left-[500px] grid w-[420px] grid-cols-2 gap-3">
        {REGIONS.map((region) => {
          const state = selected[region];
          return (
            <div
              key={region}
              className="border-border-soft bg-card-strong relative h-[100px] overflow-hidden rounded-xl border p-3"
            >
              <p className="font-mono text-xs">{region}</p>
              {state ? (
                <>
                  <span
                    className="border-accent/60 bg-accent/[0.08] absolute inset-0 rounded-xl border-2"
                    style={anim("guide-fade-in", state.at, 300)}
                  />
                  <span
                    className="absolute bottom-3 left-3 flex gap-1.5"
                    style={anim("guide-appear-up", state.at + 400)}
                  >
                    {[0, 1, 2, 3, 4].map((dot) => (
                      <span key={dot} className="bg-accent size-2.5 rounded" />
                    ))}
                  </span>
                  <span
                    className="text-accent absolute top-3 right-3 text-[10px] font-semibold"
                    style={anim("guide-fade-in", state.at + 400, 300)}
                  >
                    read here
                  </span>
                  {state.removedAt ? (
                    <span
                      className="bg-card-strong absolute inset-0 flex flex-col justify-between rounded-xl p-3"
                      style={anim("guide-fade-in", state.removedAt, 400)}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-mono text-xs">{region}</span>
                        <MockBadge tone="neutral">Out of scope</MockBadge>
                      </span>
                      <span className="flex gap-1.5">
                        {[0, 1, 2, 3, 4].map((dot) => (
                          <span
                            key={dot}
                            className="bg-muted-foreground/40 size-2.5 rounded"
                          />
                        ))}
                      </span>
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-muted-foreground absolute bottom-3 left-3 text-[10px]">
                  not read
                </span>
              )}
            </div>
          );
        })}
      </div>
      <Cursor
        points={[
          { x: 300, y: 500, at: 0 },
          { to: "add-scope", at: 900, click: true },
          { to: "add-scope", at: 1300 },
          { x: 300, y: 500, at: 6800 },
          { to: "remove-us-east-1", at: 8000, click: true },
          { to: "remove-us-east-1", at: 8500 },
          { x: 300, y: 500, at: 10000 },
        ]}
      />
    </>
  );
}

/** Draft → Connected ⇄ Error, Connected ⇄ Disabled. */
export function StatusScene() {
  const states = [
    {
      x: 40,
      y: 210,
      name: "draft",
      tone: "neutral" as const,
      at: 300,
      text: "Created, not verified yet",
    },
    {
      x: 360,
      y: 210,
      name: "connected",
      tone: "success" as const,
      at: 1500,
      text: "An account is verified — it syncs",
    },
    {
      x: 680,
      y: 80,
      name: "error",
      tone: "warning" as const,
      at: 3600,
      text: "Verification failed — Re-verify",
    },
    {
      x: 680,
      y: 340,
      name: "disabled",
      tone: "neutral" as const,
      at: 6400,
      text: "Paused — data kept, no sync",
    },
  ];
  return (
    <>
      <Lines
        paths={[
          { d: "M 280 250 L 360 250", at: 1000 },
          { d: "M 600 230 C 640 200 640 130 680 120", at: 3300 },
          { d: "M 680 140 C 640 160 630 210 600 236", at: 5400 },
          { d: "M 600 266 C 640 300 640 360 680 376", at: 6100 },
          { d: "M 680 396 C 620 400 560 330 520 290", at: 7900 },
        ]}
      />
      {states.map((state) => (
        <At
          key={state.name}
          x={state.x}
          y={state.y}
          w={240}
          at={state.at}
          from="scale"
        >
          <div className="border-border-soft bg-card-strong rounded-2xl border p-4 shadow-[0_18px_44px_var(--shadow-card)]">
            <MockBadge tone={state.tone} className="text-xs">
              {state.name}
            </MockBadge>
            <p className="text-muted-foreground mt-2 text-xs leading-5">
              {state.text}
            </p>
          </div>
        </At>
      ))}
      {[
        { x: 286, y: 222, text: "Verify", at: 1100 },
        { x: 560, y: 132, text: "role removed", at: 3400 },
        { x: 548, y: 178, text: "Re-verify", at: 5500 },
        { x: 600, y: 316, text: "Disable", at: 6200 },
        { x: 470, y: 352, text: "Enable + verify", at: 8000 },
      ].map((label) => (
        <At key={label.text} x={label.x} y={label.y} at={label.at} from="fade">
          <span className="border-border-soft bg-background text-muted-foreground rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
            {label.text}
          </span>
        </At>
      ))}
      <At x={40} y={430} w={600} at={9000} from="fade">
        <p className="text-muted-foreground flex items-center gap-2 text-[11px]">
          <Ban size={13} /> Remove and Delete permanently are on the
          connection&apos;s Settings tab — disable it first.
        </p>
      </At>
    </>
  );
}

/** Connection tabs → Sync & Activity → Sync now. */
export function NextSyncScene() {
  return (
    <>
      <MockWindow
        url="app.dilanix.com/dashboard/integrations/…"
        x={80}
        y={36}
        w={800}
        h={460}
      >
        <div className="p-5">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold">AWS Production</p>
            <MockBadge tone="success">connected</MockBadge>
          </div>
          <div className="border-foreground/10 mt-4 flex gap-1 border-b text-xs">
            {["Overview", "Access", "Sync & Activity", "Settings"].map(
              (tab) => (
                <span
                  key={tab}
                  data-cursor={
                    tab === "Sync & Activity" ? "activity-tab" : undefined
                  }
                  className="relative px-3 py-2 font-medium"
                >
                  {tab}
                  {tab === "Sync & Activity" ? (
                    <span
                      className="bg-accent absolute inset-x-1 -bottom-px h-0.5 rounded"
                      style={anim("guide-grow-x", 1300, 300)}
                    />
                  ) : null}
                </span>
              ),
            )}
          </div>
          <div style={anim("guide-appear-up", 1500)}>
            <div className="border-border-soft bg-card-strong mt-4 flex items-center justify-between rounded-xl border px-4 py-3">
              <span>
                <span className="block text-sm font-semibold">
                  Automatic sync
                </span>
                <span className="text-muted-foreground text-[11px]">
                  No schedules enabled
                </span>
              </span>
              <span className="relative">
                <MockButton variant="outline" cursor="configure">
                  Configure
                </MockButton>
                <Highlight at={4300} />
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground max-w-sm text-[11px]">
                Start an on-demand sync to pull the latest data for this
                connection.
              </p>
              <MockButton cursor="sync-now">
                <RefreshCw size={12} /> Sync now
              </MockButton>
            </div>
            <div
              className="border-border-soft mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs"
              style={anim("guide-appear-up", 3100)}
            >
              <MockBadge tone="accent">
                <Loader2 size={11} style={SPIN} /> running
              </MockBadge>
              <span className="text-muted-foreground">manual · just now</span>
            </div>
          </div>
        </div>
        <At x={520} y={360} at={3000} from="up">
          <span className="border-success/40 bg-success/10 text-success flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shadow-lg">
            <Check size={13} /> Sync started
          </span>
        </At>
      </MockWindow>
      <Cursor
        points={[
          { x: 300, y: 500, at: 0 },
          { to: "activity-tab", at: 1100, click: true },
          { to: "activity-tab", at: 1700 },
          { to: "sync-now", at: 2600, click: true },
          { to: "sync-now", at: 3200 },
          { to: "configure", at: 4200 },
          { to: "configure", at: 6000 },
        ]}
      />
    </>
  );
}
