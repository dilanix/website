"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function tabClassName(active: boolean) {
  return cn(
    "relative px-3 py-2.5 text-sm transition-colors",
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

export function ProductTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const overviewActive = pathname === `/dashboard/products/${slug}`;
  const usageActive = pathname === `/dashboard/products/${slug}/usage`;
  const docsActive = pathname === `/dashboard/products/${slug}/docs`;

  return (
    <div className="border-foreground/10 flex gap-1 border-b">
      <Link
        href={`/dashboard/products/${slug}` as Route}
        aria-current={overviewActive ? "page" : undefined}
        className={tabClassName(overviewActive)}
      >
        Overview
        {overviewActive ? <ActiveUnderline /> : null}
      </Link>
      <Link
        href={`/dashboard/products/${slug}/usage` as Route}
        aria-current={usageActive ? "page" : undefined}
        className={tabClassName(usageActive)}
      >
        Usage
        {usageActive ? <ActiveUnderline /> : null}
      </Link>
      <Link
        href={`/dashboard/products/${slug}/docs` as Route}
        aria-current={docsActive ? "page" : undefined}
        className={tabClassName(docsActive)}
      >
        Documentation
        {docsActive ? <ActiveUnderline /> : null}
      </Link>
    </div>
  );
}
