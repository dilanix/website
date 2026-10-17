import type { Metadata } from "next";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  CircleDashed,
  CircleDollarSign,
  Cloud,
  KeyRound,
  Lightbulb,
  Network,
  RefreshCw,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { getSiteSettings } from "@/lib/data/site";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/common/reveal";
import { GuidedDashboardDemo } from "@/components/product/guided-dashboard-demo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products — Cloud Cost and Infrastructure",
  description:
    "Dilanix Cost explains your cloud bill and ranks verified savings; Dilanix Infrastructure maps every resource and the evidence behind each connection. Both run on one read-only platform.",
  alternates: { canonical: "/products" },
};

const liveProducts: {
  id: string;
  icon: LucideIcon;
  tone: "success" | "accent";
  name: string;
  headline: string;
  description: string;
  features: { title: string; text: string }[];
  views: ("cost" | "recommendations" | "infrastructure")[];
}[] = [
  {
    id: "cost",
    icon: CircleDollarSign,
    tone: "success",
    name: "Cost",
    headline: "Know what you spend, why it changes, and what to cut first.",
    description:
      "Effective cost from your FOCUS 1.2 bill and Cost Explorer — after discounts, credits, Savings Plans, and reservations — with ranked recommendations that come with the steps to apply them.",
    features: [
      {
        title: "Overview and Explorer",
        text: "Spend by account, service, resource, region, or tag, against the previous period.",
      },
      {
        title: "Budgets and anomalies",
        text: "Budgets with pacing and alert thresholds; daily checks for unexpected jumps.",
      },
      {
        title: "Allocations and reports",
        text: "Spend by team or cost center, and scheduled CSV or PDF reports.",
      },
      {
        title: "Recommendations",
        text: "Over 30 checks for AWS today, each reviewed for safety, ranked, and explained.",
      },
      {
        title: "How to fix",
        text: "Console, Terraform, and CLI steps, every command checked against the provider's API definitions.",
      },
      {
        title: "Savings Plans and reservations",
        text: "Sized on steady usage after the cleanup, so you never commit to waste.",
      },
    ],
    views: ["cost", "recommendations"],
  },
  {
    id: "infrastructure",
    icon: Network,
    tone: "accent",
    name: "Infrastructure",
    headline: "See every resource and what it really talks to.",
    description:
      "A live graph of your cloud accounts: what is provisioned, how it is wired, and which connections traffic actually uses — with the evidence behind every line.",
    features: [
      {
        title: "Provisioned and Runtime",
        text: "Configured wiring next to the traffic seen in flow logs, load balancer logs, and traces.",
      },
      {
        title: "Architecture, Network, Security",
        text: "Three views of the same graph: services, network paths, and security boundaries.",
      },
      {
        title: "Evidence on every edge",
        text: "Configured, permitted, observed, inferred, or confirmed by you — never a guess shown as fact.",
      },
      {
        title: "Resource inventory",
        text: "Every resource with its configuration, tags, metrics, and relationships.",
      },
    ],
    views: ["infrastructure"],
  },
];

const platform: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Cloud,
    title: "Read-only cloud connections",
    text: "AWS today: one CloudFormation stack per account, several accounts per connection. More providers are coming.",
  },
  {
    icon: RefreshCw,
    title: "Sync and data health",
    text: "Inventory, billing, metrics, and interactions, each on its own schedule.",
  },
  {
    icon: Activity,
    title: "Telemetry",
    text: "Applications and environments, with logs sent over HTTPS using scoped ingestion tokens.",
  },
  {
    icon: Bell,
    title: "Notifications",
    text: "Slack, email, and webhooks for new savings, budget thresholds, and reports.",
  },
  {
    icon: KeyRound,
    title: "Roles and API keys",
    text: "Owner, Admin, Member, and Viewer roles; full or restricted API keys.",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    text: "In-app guides for every screen and a reference for the client API.",
  },
];

const roadmap: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ShieldCheck,
    title: "Security",
    text: "Security posture, IAM review, findings, and vulnerability tracking.",
  },
  {
    icon: Activity,
    title: "Observability",
    text: "Metrics and traces next to the logs Telemetry already receives.",
  },
  {
    icon: Workflow,
    title: "Automation",
    text: "Workflows and remediation for what the other products detect.",
  },
  {
    icon: Cloud,
    title: "More cloud providers",
    text: "The same products and data on more clouds — Dilanix is built provider-neutral from the start.",
  },
  {
    icon: Lightbulb,
    title: "API-key data access",
    text: "Read Recommendations, Cost, and Inventory from your own tools.",
  },
];

export default async function ProductsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="home-atmosphere relative isolate flex flex-col overflow-hidden">
      <section className="relative py-20 sm:py-28">
        <div className="from-accent/10 pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent" />
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="border-accent/20 bg-card-strong/72 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
              <span className="bg-accent size-1.5 rounded-full shadow-[0_0_9px_var(--accent)]" />
              Products
            </span>
            <h1 className="text-foreground mt-6 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
              Two products on one platform.
            </h1>
            <p className="text-muted-foreground mt-5 text-lg leading-relaxed text-balance">
              Cost and Infrastructure share the same read-only connection, the
              same synced data, and the same workspace — so the money and the
              machines are always explained together.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {liveProducts.map((product) => (
                <Button
                  key={product.id}
                  href={`#${product.id}`}
                  variant="secondary"
                  className="group"
                >
                  <product.icon size={15} />
                  {product.name}
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {liveProducts.map((product, index) => (
        <section
          key={product.id}
          id={product.id}
          className={cn(
            "scroll-mt-20 py-16 sm:py-20",
            index > 0 && "border-foreground/5 border-t",
          )}
        >
          <Container className="max-w-7xl">
            <Reveal>
              <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl border",
                        product.tone === "success"
                          ? "border-success/20 bg-success/8 text-success"
                          : "border-accent/20 bg-accent/8 text-accent",
                      )}
                    >
                      <product.icon size={19} />
                    </span>
                    <span className="border-success/25 bg-success/10 text-success rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                      Available
                    </span>
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                    {product.name}
                  </h2>
                  <p className="text-foreground mt-3 text-lg font-medium text-balance">
                    {product.headline}
                  </p>
                  <p className="text-muted-foreground mt-3 text-sm leading-6">
                    {product.description}
                  </p>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {product.features.map((feature) => (
                    <div
                      key={feature.title}
                      className="border-border-soft border-l pl-4"
                    >
                      <dt className="text-sm font-semibold">{feature.title}</dt>
                      <dd className="text-muted-foreground mt-1 text-xs leading-5">
                        {feature.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
            <Reveal delayMs={100} className="mt-10">
              <GuidedDashboardDemo
                views={product.views}
                label={`${product.name} preview`}
              />
            </Reveal>
          </Container>
        </section>
      ))}

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="The platform underneath"
            title="Everything both products stand on."
            description="Connect once and every product reads the same fresh, tenant-isolated data."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platform.map((item, index) => (
              <Reveal key={item.title} delayMs={(index % 3) * 70}>
                <article className="border-border-soft bg-card-strong/64 flex h-full gap-4 rounded-[1.4rem] border p-6 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl">
                  <span className="border-accent/20 bg-accent/8 text-accent flex size-10 shrink-0 items-center justify-center rounded-xl border">
                    <item.icon size={17} />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-[-0.02em]">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-6">
                      {item.text}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-foreground/5 bg-foreground/[0.01] border-t py-20 sm:py-28">
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="Roadmap"
            title="What we are building next."
            description="Planned, not yet available. Each one will run on the same connection and data."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadmap.map((item) => (
              <article
                key={item.title}
                className="border-border-soft bg-card-strong/50 flex h-full flex-col rounded-[1.4rem] border border-dashed p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="border-border-soft text-muted-foreground flex size-10 items-center justify-center rounded-xl border">
                    <item.icon size={17} />
                  </span>
                  <span className="border-border-soft text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                    <CircleDashed size={11} /> Planned
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-[-0.02em]">
                  {item.title}
                </h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-6">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-foreground/10 bg-card-strong border-t py-20">
        <Container className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            See both on your own cloud account.
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">
            Give Dilanix read-only access and walk through your spend, your
            graph, and your ranked savings with us.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              href={settings.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
            >
              Book a demo
            </Button>
            <Button href="/solutions/aws-cost-optimization" variant="secondary">
              AWS cost optimization
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
