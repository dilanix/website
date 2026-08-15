"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

const WIDTH = 240;
const HEIGHT = 40;

export function Sparkline({
  data,
  className,
}: {
  data: number[];
  className?: string;
}) {
  const { ref, inView } = useInView<SVGSVGElement>({ threshold: 0.6 });

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * WIDTH;
      // Inverted: higher spend draws higher on the chart.
      const y = HEIGHT - ((value - min) / range) * HEIGHT;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn("text-accent h-10 w-full overflow-visible", className)}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        className="transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
        style={{
          strokeDasharray: 100,
          strokeDashoffset: inView ? 0 : 100,
        }}
      />
    </svg>
  );
}
