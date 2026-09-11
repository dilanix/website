"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function tabClassName(active: boolean) {
  return cn(
    "relative shrink-0 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
  );
}

function ActiveUnderline() {
  return (
    <span
      aria-hidden="true"
      className="bg-accent absolute -bottom-px left-0 h-px w-full"
    />
  );
}

/**
 * Extra tabs a product can declare beyond the generic Overview/Usage/Docs
 * three every product gets. Cost is the only product with its own module
 * today (Budgets/Allocations/Anomalies/Saved Views/Reports, backed by
 * `src/modules/cost` in Core) — add further slugs here as they gain one.
 */
const PRODUCT_EXTRA_TABS: Record<string, { label: string; path: string }[]> = {
  cost: [
    { label: "Budgets", path: "budgets" },
    { label: "Allocations", path: "allocations" },
    { label: "Anomalies", path: "anomalies" },
    { label: "Saved Views", path: "saved-views" },
    { label: "Reports", path: "reports" },
  ],
};

export function ProductTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/dashboard/products/${slug}`;

  const tabs = [
    { label: "Overview", path: "" },
    ...(PRODUCT_EXTRA_TABS[slug] ?? []),
    { label: "Usage", path: "usage" },
    { label: "Documentation", path: "docs" },
  ];

  return (
    <div className="border-foreground/10 flex gap-1 overflow-x-auto border-b">
      {tabs.map((tab) => {
        const href = tab.path ? `${base}/${tab.path}` : base;
        const active = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href as Route}
            aria-current={active ? "page" : undefined}
            className={tabClassName(active)}
          >
            {tab.label}
            {active ? <ActiveUnderline /> : null}
          </Link>
        );
      })}
    </div>
  );
}
