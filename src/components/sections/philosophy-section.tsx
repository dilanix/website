import { Target, Wrench, Sparkles, Gauge } from "lucide-react";
import type { PhilosophyIcon, PhilosophyPrinciple } from "@/types";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/common/reveal";

const icons: Record<PhilosophyIcon, typeof Target> = {
  target: Target,
  wrench: Wrench,
  sparkles: Sparkles,
  gauge: Gauge,
};

export function PhilosophySection({
  principles,
  title = "Why Dilanix",
}: {
  principles: PhilosophyPrinciple[];
  title?: string;
}) {
  return (
    <section className="relative py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="bg-accent/16 pointer-events-none absolute top-1/2 left-0 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
      />
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow={title}
          title="What every Dilanix product must prove."
          description="A small set of non-negotiable principles keeps the portfolio useful, trustworthy, and built for long-term value."
        />
        <div className="border-border-soft bg-card-strong/55 mt-12 grid overflow-hidden rounded-[1.6rem] border shadow-[0_20px_56px_var(--shadow-card)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((principle, index) => {
            const Icon = icons[principle.icon];
            return (
              <Reveal key={principle.title} delayMs={index * 80}>
                <div className="border-border-soft/70 hover:bg-card-strong/70 group flex h-full flex-col gap-6 border-b p-6 transition-colors sm:border-r lg:border-b-0 lg:p-7 lg:last:border-r-0">
                  <div className="flex items-center justify-between">
                    <span className="border-accent/15 bg-accent/8 text-accent flex size-9 items-center justify-center rounded-xl border">
                      <Icon size={16} />
                    </span>
                    <span className="text-muted-foreground/45 font-mono text-[10px]">
                      0{index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-foreground text-base font-semibold tracking-tight">
                      {principle.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 max-w-md text-xs leading-5">
                      {principle.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
