import {
  BadgeCheck,
  Calculator,
  Fingerprint,
  Hand,
  KeyRound,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const principles: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: KeyRound,
    title: "Read-only by construction",
    description:
      "The IAM role can describe, list, and read — never create, change, stop, or delete. Switch off any permission you do not want to grant.",
  },
  {
    icon: Fingerprint,
    title: "Only your workspace gets in",
    description:
      "The role can be assumed only with your workspace's External ID. No long-lived access keys, ever.",
  },
  {
    icon: Calculator,
    title: "Savings from real numbers",
    description:
      "Every saving is calculated from current AWS prices and your own bill. AI explains and reviews — it never invents a dollar amount.",
  },
  {
    icon: BadgeCheck,
    title: "Every command checked",
    description:
      "CLI commands are validated against AWS's own API definitions, Terraform against the provider docs, and every ID must exist in your data.",
  },
  {
    icon: Hand,
    title: "Nothing runs on its own",
    description:
      "Dilanix shows the steps and what to check first. You decide what changes, when, and how.",
  },
  {
    icon: Scale,
    title: "Numbers that add up",
    description:
      "Effective cost by default, currencies never mixed, the data source always named, and unattributed spend kept visible.",
  },
];

export function TrustSection() {
  return (
    <section id="trust" className="relative scroll-mt-20 py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="bg-success/8 pointer-events-none absolute top-1/4 left-0 -z-10 size-[28rem] -translate-x-1/2 rounded-full blur-[120px]"
      />
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow="Built for trust"
          title="Safe to connect. Safe to act on."
          description="Cost advice is only useful if you can believe it — and only safe if it never touches your account without you."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delayMs={(index % 3) * 70}>
              <article className="border-border-soft bg-card-strong/64 flex h-full gap-4 rounded-[1.4rem] border p-6 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl">
                <span className="border-success/20 bg-success/8 text-success flex size-10 shrink-0 items-center justify-center rounded-xl border">
                  <Icon size={17} />
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-[-0.02em]">
                    {title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {description}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
