import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChartPie,
  Compass,
  Database,
  Hammer,
  KeyRound,
  Layers,
  Lightbulb,
  PenTool,
  Plug,
  RefreshCw,
  Rocket,
  Scale,
  ShieldCheck,
  Sparkles,
  Split,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getSiteSettings } from "@/lib/data/site";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/common/reveal";
import { BuildOnDilanixVideo } from "@/components/solutions/build-on-dilanix-video";

export const metadata: Metadata = {
  title: "Custom Data Products on a Ready Platform",
  description:
    "We design and build data, integration, and analytics products for your business on the Dilanix platform — accounts, access, integrations, sync, recommendations, and allocation are already there, so we only build what is specific to you.",
  alternates: { canonical: "/solutions/build-on-dilanix" },
};

const foundation: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Building2,
    title: "Organizations and access",
    text: "Organizations, members, roles, and API keys, with every record isolated per organization.",
  },
  {
    icon: KeyRound,
    title: "Plans and limits",
    text: "Product access, plans, trials, and usage limits, so each customer sees what they have.",
  },
  {
    icon: Plug,
    title: "Integrations",
    text: "Connections to providers with verification, health status, and safe credential handling.",
  },
  {
    icon: RefreshCw,
    title: "Background sync",
    text: "Scheduled syncs per dataset with checkpoints and retries, so data stays fresh without duplicates.",
  },
  {
    icon: Database,
    title: "Data at scale",
    text: "PostgreSQL for business state and ClickHouse for high-volume metrics and logs.",
  },
  {
    icon: Scale,
    title: "Recommendation engine",
    text: "Detect, review, and rank by impact, confidence, and effort — the engine behind Cost's savings.",
  },
  {
    icon: Split,
    title: "Allocation",
    text: "Rules that split spend or usage by team, product, or customer, with nothing left uncounted.",
  },
  {
    icon: Sparkles,
    title: "AI that gets checked",
    text: "Models review and explain; their output is validated against your data before anyone sees it.",
  },
];

const builds: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Plug,
    title: "Connectors to your systems",
    text: "SaaS tools, internal APIs, databases, and other clouds, connected through the same integration framework AWS uses.",
  },
  {
    icon: ChartPie,
    title: "Analytics on your data",
    text: "Dashboards, reports, and exports shaped around the questions your team actually asks.",
  },
  {
    icon: Lightbulb,
    title: "Recommendations for your domain",
    text: "Your rules on the recommendation engine: what to check, how to rank it, and what to do next.",
  },
  {
    icon: Wallet,
    title: "Allocation and chargeback",
    text: "Split spend, usage, or capacity by team, product, or customer, with rules your finance team can read.",
  },
];

const flow: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Compass,
    title: "Discovery",
    text: "Your process, the systems involved, and what the product must show or decide.",
  },
  {
    icon: PenTool,
    title: "Design",
    text: "Data, integrations, and screens mapped onto the platform. Scope and timeline agreed with you.",
  },
  {
    icon: Hammer,
    title: "Build",
    text: "On Dilanix Core. We write only what is specific to your business — the rest already runs.",
  },
  {
    icon: Rocket,
    title: "Launch and run",
    text: "Your product goes live in your Dilanix organization. We host it, operate it, and keep improving it.",
  },
];

const faqs = [
  {
    question: "What kind of products do you build on Dilanix?",
    answer:
      "Products built around data from systems your business already uses: connecting to them, keeping the data fresh, analyzing it, and recommending or allocating from it. If your idea needs that, the platform already covers most of the ground.",
  },
  {
    question: "Where does the product run?",
    answer:
      "Inside the Dilanix platform, as its own product next to Cost and Infrastructure. We host and operate it, and your team signs in to it with their Dilanix account.",
  },
  {
    question: "Is our data kept separate from other customers?",
    answer:
      "Yes. Every record belongs to one organization, and every read and change is checked against it — the same isolation Cost and Infrastructure data has.",
  },
  {
    question: "Can it connect to systems other than AWS?",
    answer:
      "Yes. New providers, SaaS tools, and internal systems plug into the same integration framework AWS uses. Building those connectors is part of the project.",
  },
  {
    question: "How long does a project take, and what does it cost?",
    answer:
      "It depends on the scope, and we agree both with you after discovery. It is faster than starting from scratch, because accounts, access, integrations, sync, and the engines already exist.",
  },
  {
    question: "Who maintains the product after launch?",
    answer:
      "We do. It runs and gets updates on the platform the same way Cost and Infrastructure do. Changes and new features are planned with you.",
  },
  {
    question: "Can we use Cost and Infrastructure as well?",
    answer:
      "Yes. They run on the same platform, so a cloud account connected once serves every product in your organization.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default async function BuildOnDilanixPage() {
  const settings = await getSiteSettings();

  return (
    <div className="home-atmosphere relative isolate overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="relative py-20 sm:py-28">
        <div className="from-accent/10 pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent" />
        <Container className="relative max-w-3xl text-center">
          <span className="border-accent/20 bg-card-strong/72 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
            <span className="bg-accent size-1.5 rounded-full shadow-[0_0_9px_var(--accent)]" />
            Solution · Build on Dilanix
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
            Your data product, on a platform that already runs.
          </h1>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed text-balance sm:text-xl">
            We design and build products for your business on Dilanix —
            integrations with the systems you use, your own analytics,
            recommendations, and allocation. The foundation is already there, so
            we only build what is specific to you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              href={settings.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="group"
            >
              Book a call
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Button>
            <Button href="/products" variant="secondary">
              See the platform today
            </Button>
          </div>
          <div className="text-muted-foreground mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Layers size={13} className="text-accent" /> Runs inside the
              Dilanix platform
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-success" /> Isolated per
              organization
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck size={13} className="text-success" /> Engines already
              in production
            </span>
          </div>
        </Container>
      </section>

      <section className="pb-20">
        <Container className="max-w-5xl">
          <Reveal>
            <BuildOnDilanixVideo calendlyUrl={settings.calendlyUrl} />
          </Reveal>
        </Container>
      </section>

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="Already built"
            title="Everything a data product needs before its first feature."
            description="These parts already run Cost and Infrastructure. Your product gets them on day one."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {foundation.map((item, index) => (
              <Reveal key={item.title} delayMs={(index % 4) * 70}>
                <article className="border-border-soft bg-card-strong/64 h-full rounded-[1.4rem] border p-6 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl">
                  <span className="border-accent/20 bg-accent/8 text-accent flex size-10 items-center justify-center rounded-xl border">
                    <item.icon size={17} />
                  </span>
                  <h3 className="mt-5 text-base font-semibold tracking-[-0.02em]">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {item.text}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="What we build"
            title="The part that is specific to your business."
            description="Built with you on top of the platform, and shipped as its own product in your organization."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {builds.map((item, index) => (
              <Reveal key={item.title} delayMs={(index % 2) * 70}>
                <article className="border-border-soft bg-card-strong/64 flex h-full gap-5 rounded-[1.4rem] border p-6">
                  <span className="border-success/20 bg-success/8 text-success flex size-10 shrink-0 items-center justify-center rounded-xl border">
                    <item.icon size={17} />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-[-0.02em]">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {item.text}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="How we work"
            title="From your idea to a running product."
            description="One team designs, builds, and runs it — on a platform that already handles the hard parts."
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {flow.map((step, index) => (
              <Reveal key={step.title} delayMs={index * 70}>
                <li className="border-border-soft bg-card-strong/68 flex h-full flex-col rounded-[1.4rem] border p-6 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="border-accent/20 bg-accent/8 text-accent flex size-11 items-center justify-center rounded-xl border">
                      <step.icon size={18} />
                    </span>
                    <span className="text-muted-foreground/55 font-mono text-[10px]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em]">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {step.text}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-foreground/5 border-t py-20 sm:py-28">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="FAQ"
            title="Building on Dilanix, answered"
            align="left"
            className="mb-12"
          />
          <div className="flex flex-col divide-y divide-[var(--border-soft)]">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-6 first:pt-0">
                <h3 className="text-foreground text-base font-semibold">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-foreground/10 bg-card-strong border-t py-20">
        <Container className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Have a product in mind? See how much of it already exists.
          </h2>
          <p className="text-muted-foreground max-w-xl text-sm">
            Tell us what your business needs to connect, see, and decide. We
            will map it onto the platform with you.
          </p>
          <Button
            href={settings.calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            className="mt-2"
          >
            Book a call
          </Button>
        </Container>
      </section>
    </div>
  );
}
