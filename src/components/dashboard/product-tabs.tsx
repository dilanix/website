"use client";

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

  return (
    <div className="border-foreground/10 flex gap-1 border-b">
      <Link
        href={`/dashboard/products/${slug}`}
        aria-current={overviewActive ? "page" : undefined}
        className={tabClassName(overviewActive)}
      >
        Overview
        {overviewActive ? <ActiveUnderline /> : null}
      </Link>
      <Link
        href={`/dashboard/products/${slug}/usage`}
        aria-current={usageActive ? "page" : undefined}
        className={tabClassName(usageActive)}
      >
        Usage
        {usageActive ? <ActiveUnderline /> : null}
      </Link>
    </div>
  );
}
