import {
  Activity,
  BellRing,
  CircleDollarSign,
  Cloud,
  Lightbulb,
  Network,
  RefreshCw,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

const steps: {
  icon: LucideIcon;
  title: string;
  description: string;
  detail: string;
}[] = [
  {
    icon: Cloud,
    title: "Connect",
    description:
      "Launch one CloudFormation stack per account. It creates a read-only role that only your workspace can assume.",
    detail: "Every permission is a parameter you can switch off",
  },
  {
    icon: RefreshCw,
    title: "Sync",
    description:
      "Inventory, the bill, CloudWatch metrics, and runtime interactions refresh on their own schedules.",
    detail: "Data health for every dataset, at a glance",
  },
  {
    icon: Network,
    title: "Understand",
    description:
      "See where the money goes and how resources depend on each other — with the evidence behind every link.",
    detail: "FOCUS 1.2 line items, not estimates",
  },
  {
    icon: Wrench,
    title: "Fix",
    description:
      "Act on ranked, reviewed recommendations with Console, Terraform, and CLI steps written for your resources.",
    detail: "You stay in control of every change",
  },
];

const capabilities: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  tone: "accent" | "success";
  wide?: boolean;
}[] = [
  {
    icon: CircleDollarSign,
    eyebrow: "Cost",
    title: "Every dollar explained",
    description:
      "Effective cost after discounts, credits, Savings Plans, and reservations — by account, service, resource, tag, or team.",
    points: [
      "Overview and drill-down Explorer",
      "Budgets with forecasts",
      "Allocations by team or cost center",
      "Anomaly detection",
      "Scheduled CSV and PDF reports",
      "Saved views",
    ],
    tone: "success",
    wide: true,
  },
  {
    icon: Lightbulb,
    eyebrow: "Recommendations",
    title: "Savings worth making, first",
    description:
      "Over 30 AWS checks — idle and oversized resources, storage, networking, and commitments. Each one is reviewed for safety, then ranked by saving × confidence ÷ effort.",
    points: [
      "One recommendation per resource",
      "Savings Plans and reservations sized after cleanup",
      "How to fix: Console, Terraform, CLI",
    ],
    tone: "accent",
    wide: true,
  },
  {
    icon: Network,
    eyebrow: "Infrastructure",
    title: "A live map of your cloud",
    description:
      "Resources and the connections between them — from configuration, IAM, flow logs, load balancer logs, and traces.",
    points: ["Evidence on every edge", "Configured and observed traffic"],
    tone: "accent",
  },
  {
    icon: RefreshCw,
    eyebrow: "Sync",
    title: "Data you can trust",
    description:
      "Per-dataset schedules, Sync now, run history, and a clear status when something needs attention.",
    points: ["Multiple accounts per connection", "Freshness for every dataset"],
    tone: "accent",
  },
  {
    icon: Activity,
    eyebrow: "Telemetry",
    title: "Your applications, too",
    description:
      "Model applications and environments and send their logs over HTTPS with scoped, revocable ingestion tokens.",
    points: ["Secrets redacted on arrival", "Per-source tokens"],
    tone: "accent",
  },
  {
    icon: BellRing,
    eyebrow: "Notifications",
    title: "Told when it matters",
    description:
      "New high-priority savings, budget thresholds, and generated reports go straight to the people who act on them.",
    points: [
      "Slack, email, and webhooks",
      "Reports arrive with the file attached",
    ],
    tone: "success",
  },
];

export function PlatformSection() {
  return (
    <section id="platform" className="relative scroll-mt-20 py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="bg-accent-secondary/12 pointer-events-none absolute top-1/3 right-0 -z-10 size-[30rem] translate-x-1/2 rounded-full blur-[120px]"
      />
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow="How it works"
          title="From a read-only role to savings you can trust."
          description="Connect an account in minutes. Dilanix keeps a fresh copy of what runs and what it costs, and turns it into changes you can safely make."
        />

        <Reveal>
          <ol className="relative mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-[2.35rem] right-[12%] left-[12%] hidden h-px lg:block"
            >
              <span className="bg-accent/25 absolute inset-0" />
              <span className="bg-accent absolute top-0 left-0 size-1.5 -translate-y-[2px] [animation:docs-flow-x_3.2s_linear_infinite] rounded-full shadow-[0_0_12px_var(--accent)] motion-reduce:hidden" />
            </div>
            {steps.map(({ icon: Icon, title, description, detail }, index) => (
              <li
                key={title}
                className="border-border-soft bg-card-strong/68 relative flex flex-col rounded-[1.4rem] border p-5 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="border-accent/20 bg-card-strong text-accent relative z-10 flex size-11 items-center justify-center rounded-xl border shadow-sm">
                    <Icon size={18} />
                  </span>
                  <span className="text-muted-foreground/55 font-mono text-[10px]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em]">
                  {title}
                </h3>
                <p className="text-muted-foreground mt-2 flex-1 text-sm leading-6">
                  {description}
                </p>
                <p className="text-accent border-border-soft mt-4 border-t pt-3 text-[11px] font-medium">
                  {detail}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        <div id="capabilities" className="mt-20 scroll-mt-24">
          <SectionHeading
            eyebrow="What's inside"
            title="Cost, infrastructure, and action in one workspace."
            description="Engineering and finance look at the same numbers, the same resources, and the same list of what to do next."
          />
          <div className="mt-12 grid gap-4 lg:grid-cols-4">
            {capabilities.map(
              (
                { icon: Icon, eyebrow, title, description, points, tone, wide },
                index,
              ) => (
                <Reveal
                  key={eyebrow}
                  delayMs={(index % 4) * 70}
                  className={cn(wide ? "lg:col-span-2" : "lg:col-span-1")}
                >
                  <article className="border-border-soft bg-card-strong/68 group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border p-6 shadow-[0_20px_54px_var(--shadow-card)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-0.5 sm:p-7">
                    <div
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute -top-20 -right-16 size-48 rounded-full opacity-70 blur-[72px] transition-opacity group-hover:opacity-100",
                        tone === "success" ? "bg-success/12" : "bg-accent/12",
                      )}
                    />
                    <span
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl border",
                        tone === "success"
                          ? "border-success/20 bg-success/8 text-success"
                          : "border-accent/20 bg-accent/8 text-accent",
                      )}
                    >
                      <Icon size={19} />
                    </span>
                    <p
                      className={cn(
                        "mt-6 text-[10px] font-semibold tracking-[0.16em] uppercase",
                        tone === "success" ? "text-success" : "text-accent",
                      )}
                    >
                      {eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-balance sm:text-2xl">
                      {title}
                    </h3>
                    <p className="text-muted-foreground mt-3 text-sm leading-6">
                      {description}
                    </p>
                    <ul
                      className={cn(
                        "mt-auto grid gap-2.5 pt-6",
                        wide ? "sm:grid-cols-2" : "",
                      )}
                    >
                      {points.map((point) => (
                        <li
                          key={point}
                          className="text-muted-foreground flex items-center gap-2.5 text-xs"
                        >
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              tone === "success" ? "bg-success" : "bg-accent",
                            )}
                          />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ),
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
