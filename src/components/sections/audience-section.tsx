import { Building2, CircleDollarSign, Wrench } from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const teams = [
  {
    icon: Wrench,
    title: "Platform & Engineering",
    description:
      "See resources, applications, environments, and utilization with the cost impact attached.",
    outcome: "Technical context without billing blind spots",
  },
  {
    icon: CircleDollarSign,
    title: "FinOps & Finance",
    description:
      "Explain spend, allocate it accurately, track budgets, and prioritize validated savings opportunities.",
    outcome: "Financial control grounded in infrastructure reality",
  },
  {
    icon: Building2,
    title: "Technology Leaders",
    description:
      "Connect technology decisions to business impact through one consistent operating view.",
    outcome: "Clearer priorities and accountable decisions",
  },
] as const;

export function AudienceSection() {
  return (
    <section id="capabilities" className="relative scroll-mt-20 py-20 sm:py-28">
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow="Shared operating context"
          title="One platform for every team responsible for technology."
          description="Dilanix gives technical and financial stakeholders the same facts, while preserving the context each team needs to make its part of the decision."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {teams.map(({ icon: Icon, title, description, outcome }, index) => (
            <Reveal key={title} delayMs={index * 80}>
              <article className="border-border-soft bg-card-strong/64 flex h-full flex-col rounded-[1.6rem] border p-7 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl">
                <span className="border-accent/15 bg-accent/8 text-accent flex size-11 items-center justify-center rounded-xl border">
                  <Icon size={18} />
                </span>
                <h3 className="mt-7 text-xl font-semibold tracking-[-0.025em]">
                  {title}
                </h3>
                <p className="text-muted-foreground mt-3 text-sm leading-6">
                  {description}
                </p>
                <div className="border-border-soft text-muted-foreground mt-7 border-t pt-5 text-[11px] leading-5">
                  <span className="text-foreground font-semibold">
                    Outcome:
                  </span>{" "}
                  {outcome}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
