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
}: {
  categories: TechnologyCategory[];
}) {
  return (
    <section className="border-foreground/5 border-t">
      <Container className="px-0 lg:px-0">
        <div className="bg-foreground/5 grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => {
            const Icon = icons[category.icon];
            return (
              <div
                key={category.label}
                className="bg-background flex flex-col gap-3 p-8"
              >
                <Icon size={18} className="text-muted-foreground" />
                <h3 className="text-foreground text-sm font-medium">
                  {category.label}
                </h3>
                <p className="text-muted-foreground text-sm">
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
