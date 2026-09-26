import {
  Activity,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  Cloud,
  DatabaseZap,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const operatingFlow = [
  {
    icon: Cloud,
    step: "01",
    title: "Connect",
    description:
      "Bring technology sources, cost data, and resource metadata into one governed workspace.",
  },
  {
    icon: Boxes,
    step: "02",
    title: "Understand",
    description:
      "Map resources to applications, environments, owners, and the costs they generate.",
  },
  {
    icon: Activity,
    step: "03",
    title: "Optimize",
    description:
      "Find anomalies, waste, utilization gaps, and the opportunities worth acting on first.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Govern",
    description:
      "Turn insight into budgets, allocations, recommendations, and repeatable decisions.",
  },
] as const;

const technologyCapabilities = [
  "Cloud resource inventory",
  "Application and environment context",
  "Utilization and operational signals",
  "Ownership and resource metadata",
] as const;

const costCapabilities = [
  "Cross-platform cost data",
  "Spend allocation and unit context",
  "Budgets, anomalies, and reporting",
  "Prioritized optimization opportunities",
] as const;

export function PlatformSection() {
  return (
    <section id="platform" className="relative scroll-mt-20 py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="bg-accent-secondary/12 pointer-events-none absolute top-1/3 right-0 -z-10 size-[30rem] translate-x-1/2 rounded-full blur-[120px]"
      />
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow="The Dilanix platform"
          title="Technology context and cost data belong together."
          description="Most teams manage infrastructure in one place and spend in another. Dilanix creates a shared operating picture, connecting what technology exists, how it behaves, and what it costs."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Reveal>
            <article
              id="technology-intelligence"
              className="border-border-soft bg-card-strong/68 relative h-full scroll-mt-24 overflow-hidden rounded-[1.75rem] border p-7 shadow-[0_22px_58px_var(--shadow-card)] backdrop-blur-xl sm:p-9"
            >
              <div
                aria-hidden="true"
                className="bg-accent/12 pointer-events-none absolute -top-20 -right-16 size-52 rounded-full blur-[72px]"
              />
              <div className="flex items-start justify-between gap-5">
                <span className="border-accent/18 bg-accent/8 text-accent flex size-11 items-center justify-center rounded-xl border">
                  <Eye size={19} />
                </span>
                <span className="text-muted-foreground/55 font-mono text-[10px] tracking-[0.14em] uppercase">
                  Know what you run
                </span>
              </div>
              <p className="text-accent mt-8 text-[10px] font-semibold tracking-[0.16em] uppercase">
                Technology Intelligence
              </p>
              <h3 className="mt-2 max-w-lg text-2xl font-semibold tracking-[-0.035em] text-balance sm:text-3xl">
                Turn fragmented infrastructure into decision-ready context.
              </h3>
              <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6 sm:text-base">
                Build a living view of resources, applications, environments,
                ownership, and operational signals—without losing the technical
                detail engineering teams need.
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {technologyCapabilities.map((capability) => (
                  <li
                    key={capability}
                    className="text-muted-foreground flex items-center gap-2.5 text-xs"
                  >
                    <span className="bg-accent size-1.5 shrink-0 rounded-full" />
                    {capability}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>

          <Reveal delayMs={90}>
            <article
              id="cost-management"
              className="border-border-soft bg-card-strong/68 relative h-full scroll-mt-24 overflow-hidden rounded-[1.75rem] border p-7 shadow-[0_22px_58px_var(--shadow-card)] backdrop-blur-xl sm:p-9"
            >
              <div
                aria-hidden="true"
                className="bg-success/10 pointer-events-none absolute -top-20 -right-16 size-52 rounded-full blur-[72px]"
              />
              <div className="flex items-start justify-between gap-5">
                <span className="border-success/18 bg-success/8 text-success flex size-11 items-center justify-center rounded-xl border">
                  <CircleDollarSign size={19} />
                </span>
                <span className="text-muted-foreground/55 font-mono text-[10px] tracking-[0.14em] uppercase">
                  Control what you spend
                </span>
              </div>
              <p className="text-success mt-8 text-[10px] font-semibold tracking-[0.16em] uppercase">
                Cost Management
              </p>
              <h3 className="mt-2 max-w-lg text-2xl font-semibold tracking-[-0.035em] text-balance sm:text-3xl">
                Make every cost visible, explainable, and actionable.
              </h3>
              <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6 sm:text-base">
                Connect billing data to the systems and teams behind it, then
                move from spend visibility to allocation, optimization, and
                financial accountability.
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {costCapabilities.map((capability) => (
                  <li
                    key={capability}
                    className="text-muted-foreground flex items-center gap-2.5 text-xs"
                  >
                    <span className="bg-success size-1.5 shrink-0 rounded-full" />
                    {capability}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        </div>

        <Reveal delayMs={120}>
          <div className="border-border-soft bg-card-strong/58 mt-5 rounded-[1.75rem] border p-5 shadow-[0_20px_54px_var(--shadow-card)] backdrop-blur-xl sm:p-7">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-accent text-[10px] font-semibold tracking-[0.16em] uppercase">
                  One continuous operating loop
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                  From raw technology data to governed action
                </h3>
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
                <DatabaseZap className="text-accent" size={14} />
                Shared context for engineering and finance
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {operatingFlow.map(
                ({ icon: Icon, step, title, description }, index) => (
                  <div
                    key={title}
                    className="border-border-soft/75 bg-surface/48 relative rounded-2xl border p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="border-accent/15 bg-accent/8 text-accent flex size-9 items-center justify-center rounded-xl border">
                        <Icon size={15} />
                      </span>
                      <span className="text-muted-foreground/50 font-mono text-[10px]">
                        {step}
                      </span>
                    </div>
                    <h4 className="mt-5 text-sm font-semibold">{title}</h4>
                    <p className="text-muted-foreground mt-2 text-[11px] leading-5">
                      {description}
                    </p>
                    {index < operatingFlow.length - 1 ? (
                      <ArrowRight
                        aria-hidden="true"
                        className="text-accent/55 absolute top-1/2 -right-2.5 z-10 hidden -translate-y-1/2 lg:block"
                        size={16}
                      />
                    ) : null}
                  </div>
                ),
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
