import Link from "next/link";
import type { Route } from "next";

export type CostOverviewView = "summary" | "services" | "resources" | "trends";

const VIEWS: { id: CostOverviewView; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "services", label: "Services" },
  { id: "resources", label: "Resources" },
  { id: "trends", label: "Trends" },
];

/** The Overview view a `?view=` value selects; anything else is Summary. */
export function parseCostOverviewView(
  value: string | string[] | undefined,
): CostOverviewView {
  const requested = Array.isArray(value) ? value[0] : value;
  return VIEWS.find((view) => view.id === requested)?.id ?? "summary";
}

export function CostOverviewTabs({
  active,
  searchParams,
}: {
  active: CostOverviewView;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <nav
      aria-label="Cost overview views"
      className="border-border-soft bg-dashboard-panel flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border p-1"
    >
      {VIEWS.map((view) => {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(searchParams)) {
          if (key === "view" || value === undefined) continue;
          for (const item of Array.isArray(value) ? value : [value])
            query.append(key, item);
        }
        if (view.id !== "summary") query.set("view", view.id);
        const suffix = query.size ? `?${query.toString()}` : "";
        return (
          <Link
            key={view.id}
            href={`/dashboard/products/cost${suffix}` as Route}
            aria-current={active === view.id ? "page" : undefined}
            className={
              active === view.id
                ? "bg-accent/10 text-accent rounded-lg px-4 py-2 text-sm font-medium"
                : "text-muted-foreground hover:text-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            }
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
