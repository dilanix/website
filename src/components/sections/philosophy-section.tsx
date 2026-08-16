import { Target, Wrench, Sparkles, Gauge } from "lucide-react";
import type { PhilosophyIcon, PhilosophyPrinciple } from "@/types";
import { Container } from "@/components/ui/container";
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
    <section className="border-foreground/5 border-t py-20 sm:py-24">
      <Container className="max-w-3xl">
        <h2 className="text-muted-foreground mb-10 text-xs font-medium tracking-widest uppercase">
          {title}
        </h2>
        <div className="divide-foreground/10 divide-y">
          {principles.map((principle, index) => {
            const Icon = icons[principle.icon];
            return (
              <Reveal key={principle.title} delayMs={index * 80}>
                <div className="flex flex-col gap-2 py-8 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:gap-8">
                  <div className="text-accent flex shrink-0 items-center gap-2 sm:w-28">
                    <Icon size={15} />
                    <span className="font-mono text-xs">0{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-foreground text-base font-medium">
                      {principle.title}
                    </h3>
                    <p className="text-muted-foreground mt-1.5 max-w-md text-sm">
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
