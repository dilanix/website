"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/use-in-view";

const DURATION_MS = 1200;

// Cubic ease-out — quick start, gentle settle.
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.4 });
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reducedMotion) return;

    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      setDisplay(Math.round(value * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reducedMotion, value]);

  const shown = reducedMotion && inView ? value : display;
  const formatted = `${prefix}${value.toLocaleString("en-US")}${suffix}`;

  return (
    <span ref={ref} className={className}>
      {/* Decorative count-up, hidden from the accessibility tree so it never
          reads as "$0" or an intermediate value to assistive tech. */}
      <span aria-hidden="true">
        {prefix}
        {shown.toLocaleString("en-US")}
        {suffix}
      </span>
      {/* The real, final value — present in server-rendered markup and read
          by screen readers, independent of whether the animation has run. */}
      <span className="sr-only">{formatted}</span>
    </span>
  );
}
