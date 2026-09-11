"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
 * set. Cost is the only product with its own module today; its Explorer
 * replaces generic Usage, and its management tabs are backed by
 * `src/modules/cost` in Core. Add further slugs here as they gain a module.
 */
const PRODUCT_EXTRA_TABS: Record<string, { label: string; path: string }[]> = {
  cost: [
    { label: "Explorer", path: "explorer" },
    { label: "Budgets", path: "budgets" },
    { label: "Allocations", path: "allocations" },
    { label: "Anomalies", path: "anomalies" },
    { label: "Saved Views", path: "saved-views" },
    { label: "Reports", path: "reports" },
  ],
};

export function ProductTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const base = `/dashboard/products/${slug}`;
  const costScopeParams = new URLSearchParams();
  const connectionId = searchParams.get("connection");
  const targetId = searchParams.get("target");
  if (slug === "cost" && connectionId) {
    costScopeParams.set("connection", connectionId);
    if (targetId) costScopeParams.set("target", targetId);
  }
  const costScopeQuery = costScopeParams.toString();

  const tabs = [
    { label: "Overview", path: "" },
    ...(PRODUCT_EXTRA_TABS[slug] ?? []),
    ...(slug === "cost" ? [] : [{ label: "Usage", path: "usage" }]),
    { label: "Documentation", path: "docs" },
  ];

  return (
    <div className="border-foreground/10 flex gap-1 overflow-x-auto border-b">
      {tabs.map((tab) => {
        const path = tab.path ? `${base}/${tab.path}` : base;
        const href = `${path}${costScopeQuery ? `?${costScopeQuery}` : ""}`;
        const active = pathname === path;
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
