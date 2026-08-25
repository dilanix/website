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
    <section className="border-border-soft border-t py-20 sm:py-24">
      <Container>
        <h2 className="text-accent mb-10 text-xs font-semibold tracking-[0.18em] uppercase">
          {title}
        </h2>
        <div className="divide-border-soft flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">
          {categories.map((category, index) => {
            const Icon = icons[category.icon];
            return (
              <div
                key={category.label}
                className="flex flex-1 flex-col gap-2 py-6 first:pt-0 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0"
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
