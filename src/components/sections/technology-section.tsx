import {
  BrainCircuit,
  Cloud,
  Database,
  Workflow,
  SquareTerminal,
} from "lucide-react";
import type { TechnologyCategory, TechnologyIcon } from "@/types";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const icons: Record<TechnologyIcon, typeof Cloud> = {
  ai: BrainCircuit,
  cloud: Cloud,
  data: Database,
  automation: Workflow,
  "developer-tools": SquareTerminal,
};

export function TechnologySection({
  categories,
  title = "Technology",
}: {
  categories: TechnologyCategory[];
  title?: string;
}) {
  return (
    <section className="relative py-20 sm:py-24">
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow={title}
          title="Deep technology. Quietly applied."
          description="We use advanced systems where they improve the outcome—not where they merely improve the pitch."
        />
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category, index) => {
            const Icon = icons[category.icon];
            return (
              <div
                key={category.label}
                className="border-border-soft/60 bg-card-strong/58 hover:border-accent/18 hover:bg-card-strong/82 flex min-h-40 flex-col rounded-2xl border p-5 shadow-[0_14px_36px_var(--shadow-card)] backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="bg-accent/8 text-accent flex size-8 items-center justify-center rounded-lg">
                    <Icon size={14} />
                  </span>
                  <span className="text-muted-foreground/40 font-mono text-[9px]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-foreground mt-5 text-sm font-semibold">
                  {category.label}
                </h3>
                <p className="text-muted-foreground mt-2 text-[11px] leading-5">
                  {category.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
