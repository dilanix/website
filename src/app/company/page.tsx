import type { Metadata } from "next";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CircleDashed,
  CircleDollarSign,
  Cloud,
  Hand,
  Layers,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { getSiteSettings } from "@/lib/data/site";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/common/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Company",
  description:
    "Dilanix builds one provider-neutral platform for understanding what your cloud runs and what it costs — with Cost and Infrastructure available today.",
  alternates: { canonical: "/company" },
};

const products: {
  icon: LucideIcon;
  name: string;
  text: string;
  available: boolean;
}[] = [
  {
    icon: CircleDollarSign,
    name: "Cost",
    text: "Your real bill explained, with ranked savings and verified steps to apply them.",
    available: true,
  },
  {
    icon: Network,
    name: "Infrastructure",
    text: "Every resource and the connections traffic actually uses, with evidence.",
    available: true,
  },
  {
    icon: ShieldCheck,
    name: "Security",
    text: "Security posture, IAM review, and findings.",
    available: false,
  },
  {
    icon: Activity,
    name: "Observability",
    text: "Metrics and traces next to the logs Telemetry already receives.",
    available: false,
  },
  {
    icon: Workflow,
    name: "Automation",
    text: "Workflows and remediation for what the other products detect.",
    available: false,
  },
];

const principles: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Layers,
    title: "One platform, many products",
    text: "Connect once. Every product reads the same synced, tenant-isolated data instead of asking for its own access.",
  },
  {
    icon: Cloud,
    title: "Provider-neutral from day one",
    text: "Products never depend on one cloud. Each provider plugs in behind the same model — AWS today, more coming.",
  },
  {
    icon: BadgeCheck,
    title: "Evidence over guesses",
    text: "Every number traces back to your bill, every connection carries its evidence, and every command is checked before you see it.",
  },
  {
    icon: Sparkles,
    title: "AI that gets checked",
    text: "Models review recommendations and draft fix guides. Their output is validated against your data and the provider's definitions — they never invent a figure.",
  },
  {
    icon: Hand,
    title: "You stay in control",
    text: "Read-only access, nothing applied on its own. Dilanix shows what to change and what to check first; you decide.",
  },
];

export default async function CompanyPage() {
  const settings = await getSiteSettings();

  return (
    <div className="home-atmosphere relative isolate flex flex-col overflow-hidden">
      <section className="relative py-20 sm:py-28">
        <div className="from-accent/10 pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent" />
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="border-accent/20 bg-card-strong/72 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
              <span className="bg-accent size-1.5 rounded-full shadow-[0_0_9px_var(--accent)]" />
              Company
            </span>
            <h1 className="text-foreground mt-6 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
              We make the cloud explain itself.
            </h1>
            <p className="text-muted-foreground mt-5 text-lg leading-relaxed text-balance">
              Dilanix is one platform for understanding what your cloud runs,
              how it is connected, and what it really costs — built so every
              answer comes with the evidence behind it.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-foreground/5 border-t py-20 sm:py-24">
        <Container className="max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <Reveal>
              <h2 className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
                What we build
              </h2>
              <p className="text-foreground mt-5 text-2xl font-semibold tracking-[-0.03em] text-balance sm:text-3xl">
                A shared platform first, then focused products on top of it.
              </p>
              <p className="text-muted-foreground mt-5 text-sm leading-6">
                The platform owns the hard, shared parts: read-only cloud
                connections, scheduled sync of inventory, billing, and metrics,
                telemetry, workspaces, roles, and API access. Each product adds
                one answer on top of that data — so a new product starts from
                everything the others already know.
              </p>
              <Button
                href="/products"
                variant="secondary"
                className="group mt-7"
              >
                Explore products
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Button>
            </Reveal>
            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((product, index) => (
                <Reveal key={product.name} delayMs={index * 60}>
                  <article
                    className={cn(
                      "border-border-soft flex h-full gap-4 rounded-[1.2rem] border p-5",
                      product.available
                        ? "bg-card-strong/64 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl"
                        : "bg-card-strong/40 border-dashed",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                        product.available
                          ? "border-accent/20 bg-accent/8 text-accent"
                          : "border-border-soft text-muted-foreground",
                      )}
                    >
                      <product.icon size={17} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold tracking-[-0.02em]">
                          {product.name}
                        </h3>
                        {product.available ? (
                          <span className="border-success/25 bg-success/10 text-success rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                            Available
                          </span>
                        ) : (
                          <span className="border-border-soft text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                            <CircleDashed size={10} /> Planned
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1.5 text-sm leading-6">
                        {product.text}
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-foreground/5 bg-foreground/[0.01] border-t py-20 sm:py-28">
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="How we build"
            title="The rules every Dilanix product follows."
            description="They are why the numbers can be trusted, and why each new product starts further ahead than the last."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((item, index) => (
              <Reveal key={item.title} delayMs={(index % 3) * 70}>
                <article className="border-border-soft bg-card-strong/64 flex h-full flex-col rounded-[1.4rem] border p-6 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="border-accent/20 bg-accent/8 text-accent flex size-10 items-center justify-center rounded-xl border">
                      <item.icon size={17} />
                    </span>
                    <span className="text-muted-foreground/45 font-mono text-[10px]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold tracking-[-0.02em]">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-6">
                    {item.text}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-foreground/10 bg-card-strong border-t py-20">
        <Container className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            Talk to the people building it.
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">
            See Dilanix on your own cloud account, or tell us what you want it
            to answer next.
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
            <Button href="/contact" variant="secondary">
              Contact us
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
