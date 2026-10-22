import type { Metadata } from "next";
import {
  ArrowRight,
  Cloud,
  Gauge,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { getPublicPlans } from "@/lib/core/api";
import { getSiteSettings } from "@/lib/data/site";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/common/reveal";
import { PricingCards } from "@/components/pricing/pricing-cards";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Plans for every stage of your cloud: connected accounts, team seats, and products that grow with you. Start with a free trial — no card, no checkout.",
  alternates: { canonical: "/pricing" },
};

// Plans and prices come from Dilanix Core; refresh with the catalog.
export const revalidate = 60;

const included: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Lock,
    title: "Read-only by design",
    text: "Dilanix never changes your cloud. Every fix is a step you choose to run.",
  },
  {
    icon: ShieldCheck,
    title: "Tenant-isolated data",
    text: "Your accounts, costs and graph are scoped to your workspace, always.",
  },
  {
    icon: Cloud,
    title: "One connection, every product",
    text: "Connect an account once; every product in your plan reads the same data.",
  },
  {
    icon: Gauge,
    title: "Clear limits, no surprises",
    text: "Going over a limit never deletes data — you get time to choose what to pause.",
  },
];

const faqs: { question: string; answer: string }[] = [
  {
    question: "How do I start?",
    answer:
      "Every new workspace starts with a free trial of all live products. Request access and we'll set it up — there is no card and no checkout.",
  },
  {
    question: "What happens when the trial ends?",
    answer:
      "You keep your login, your workspace and all collected data. Products and sync pause until a plan is active — nothing is deleted.",
  },
  {
    question: "What counts as a cloud account?",
    answer:
      "Each verified provider account (for example an AWS account) that is actively connected. The same account on two connections counts once, and paused accounts don't count.",
  },
  {
    question: "What if we go over a limit?",
    answer:
      "Nothing is removed. New accounts can't be added, and you get a grace period to pause or disconnect the accounts you choose. Sync resumes on its own once you're within the limit.",
  },
  {
    question: "Can a plan be tailored?",
    answer:
      "Yes. Add-ons and custom terms cover extra accounts, seats or products. Talk to us and we'll fit the plan to your setup.",
  },
];

export default async function PricingPage() {
  const [plans, settings] = await Promise.all([
    getPublicPlans(),
    getSiteSettings(),
  ]);

  return (
    <div className="home-atmosphere relative isolate flex flex-col overflow-hidden">
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="from-accent/10 pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] via-transparent to-transparent" />
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="border-accent/20 bg-card-strong/72 text-accent inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
              <span className="bg-accent size-1.5 rounded-full shadow-[0_0_9px_var(--accent)]" />
              Pricing
            </span>
            <h1 className="text-foreground mt-6 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
              Simple plans that grow with your cloud.
            </h1>
            <p className="text-muted-foreground mt-5 text-lg leading-relaxed text-balance">
              Pick the accounts, seats and products you need. Start with a free
              trial — no card, no checkout.
            </p>
          </div>

          <div className="mt-14">
            {plans.length ? (
              <PricingCards plans={plans} />
            ) : (
              <Reveal>
                <div className="border-border-soft bg-card-strong/70 mx-auto flex max-w-xl flex-col items-center rounded-[1.6rem] border p-8 text-center shadow-[0_24px_70px_var(--shadow-card)] backdrop-blur-xl sm:p-10">
                  <span className="border-accent/20 bg-accent/10 text-accent flex size-11 items-center justify-center rounded-xl border">
                    <Sparkles size={18} />
                  </span>
                  <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
                    Pricing tailored to your cloud
                  </h2>
                  <p className="text-muted-foreground mt-3 text-sm leading-6">
                    Tell us how many accounts and teammates you have and
                    we&apos;ll put together the right plan — starting with a
                    free trial.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button href="/contact" variant="primary" className="group">
                      Contact sales
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </Button>
                    <Button
                      href={settings.calendlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="secondary"
                    >
                      Book a demo
                    </Button>
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </Container>
      </section>

      <section className="border-foreground/5 border-t py-20 sm:py-24">
        <Container className="max-w-7xl">
          <SectionHeading
            eyebrow="Every plan"
            title="The same trusted platform underneath."
            description="Whatever plan you choose, these never change."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {included.map((item, index) => (
              <Reveal key={item.title} delayMs={(index % 4) * 70}>
                <article className="border-border-soft bg-card-strong/64 flex h-full flex-col gap-4 rounded-[1.4rem] border p-6 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl">
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

      <section className="border-foreground/5 bg-foreground/[0.01] border-t py-20 sm:py-24">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Questions"
            title="Plans, trials and limits."
            description="How Dilanix plans work, in plain words."
          />
          <dl className="divide-border-soft border-border-soft mt-10 divide-y rounded-[1.4rem] border">
            {faqs.map((faq) => (
              <div key={faq.question} className="p-6">
                <dt className="text-base font-semibold tracking-[-0.02em]">
                  {faq.question}
                </dt>
                <dd className="text-muted-foreground mt-2 text-sm leading-6">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="border-foreground/10 bg-card-strong border-t py-20">
        <Container className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            Not sure which plan fits?
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">
            Walk through your own spend and graph with us, then pick the plan
            that matches.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/contact" variant="primary">
              <Mail size={15} /> Contact sales
            </Button>
            <Button
              href={settings.calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
            >
              Book a demo
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
