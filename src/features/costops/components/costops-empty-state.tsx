import type { LucideIcon } from "lucide-react";

type CostOpsEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function CostOpsEmptyState({
  icon: Icon,
  title,
  description,
}: CostOpsEmptyStateProps) {
  return (
    <div className="border-foreground/10 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      <div className="bg-foreground/5 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <Icon
          size={22}
          className="text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <h3 className="text-sm font-semibold">{title}</h3>

      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
        {description}
      </p>
    </div>
  );
}