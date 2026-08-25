"use client";

import type { ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  delayMs = 0,
  className,
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? `${delayMs}ms` : "0ms" }}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        inView
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-3 scale-[0.985] opacity-0 motion-reduce:scale-100 motion-reduce:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}
