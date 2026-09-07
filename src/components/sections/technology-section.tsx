import {
  BrainCircuit,
  Cloud,
  Database,
  Workflow,
  SquareTerminal,
} from "lucide-react";
import type { TechnologyCategory, TechnologyIcon } from "@/types";
import { Container } from "@/components/ui/container";

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
    <section className="relative py-20 sm:py-28">
      <Container>
        <h2 className="text-accent mb-10 text-center text-xs font-semibold tracking-[0.18em] uppercase">
          {title}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category, index) => {
            const Icon = icons[category.icon];
            return (
              <div
                key={category.label}
                className="border-border-soft/60 bg-card-strong/68 hover:border-accent/18 hover:bg-card-strong/88 flex min-h-36 flex-col gap-2 rounded-2xl border p-5 shadow-[0_14px_36px_var(--shadow-card)] backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_var(--shadow-brand)]"
              >
                <div className="text-muted-foreground flex items-center gap-2">
                  <Icon size={14} />
                  <span className="font-mono text-xs">0{index + 1}</span>
                </div>
                <h3 className="text-foreground text-sm font-medium">
                  {category.label}
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
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
