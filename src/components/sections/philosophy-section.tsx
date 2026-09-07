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
    <section className="relative py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="bg-accent/16 pointer-events-none absolute top-1/2 left-0 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
      />
      <Container className="max-w-5xl">
        <h2 className="text-accent mb-10 text-center text-xs font-semibold tracking-[0.18em] uppercase">
          {title}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map((principle, index) => {
            const Icon = icons[principle.icon];
            return (
              <Reveal key={principle.title} delayMs={index * 80}>
                <div className="border-border-soft/70 bg-card-strong/72 hover:border-accent/20 hover:bg-card-strong/88 group flex h-full flex-col gap-5 rounded-2xl border p-6 shadow-[0_18px_44px_var(--shadow-card)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_54px_var(--shadow-brand)] sm:p-7">
                  <div className="text-accent flex shrink-0 items-center gap-2">
                    <Icon size={15} />
                    <span className="font-mono text-xs">0{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-foreground text-lg font-medium">
                      {principle.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
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
