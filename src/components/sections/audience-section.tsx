import { Building2, CircleDollarSign, Wrench } from "lucide-react";
import { Reveal } from "@/components/common/reveal";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const teams = [
  {
    icon: Wrench,
    title: "Platform & Engineering",
    description:
      "See which resources a change would touch, get fixes as Console, Terraform, or CLI steps, and stop guessing what an idle-looking resource is for.",
    outcome: "Savings without surprise outages",
  },
  {
    icon: CircleDollarSign,
    title: "FinOps & Finance",
    description:
      "Explain every line of the bill, allocate it to teams, track budgets, and size Savings Plans and reservations only after the cleanup.",
    outcome: "Numbers that match the invoice",
  },
  {
    icon: Building2,
    title: "Technology Leaders",
    description:
      "One ranked list of what to change next, the saving it brings, and how confident Dilanix is — for every account you run.",
    outcome: "Clear priorities, accountable decisions",
  },
] as const;

export function AudienceSection() {
  return (
    <section id="teams" className="relative scroll-mt-20 py-20 sm:py-28">
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow="For every team"
          title="Engineering and finance, finally on the same page."
          description="The same resources, the same numbers, and the same list of what to do next — with the detail each team needs."
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
                <p className="text-muted-foreground mt-3 flex-1 text-sm leading-6">
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
