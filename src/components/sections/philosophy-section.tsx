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
}: {
  principles: PhilosophyPrinciple[];
}) {
  return (
    <section className="border-foreground/5 border-t py-24 sm:py-32">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {principles.map((principle, index) => {
            const Icon = icons[principle.icon];
            return (
              <Reveal key={principle.title} delayMs={index * 80}>
                <div className="flex flex-col gap-4">
                  <span className="text-accent bg-foreground/5 flex h-9 w-9 items-center justify-center rounded-md">
                    <Icon size={18} />
                  </span>
                  <h3 className="text-foreground text-base font-medium">
                    {principle.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {principle.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
