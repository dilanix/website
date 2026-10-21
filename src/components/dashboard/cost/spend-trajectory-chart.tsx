"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { formatAmount } from "@/components/dashboard/cost/format";

export interface SpendTrajectoryPoint {
  /** ISO day the point represents. */
  date: string;
  cumulative: number;
}

export interface SpendTrajectoryAnomaly {
  id: string;
  /** The anomaly's own `period_start` — where its marker lands on the x axis. */
  date: string;
  severity: "low" | "medium" | "high";
  actualAmount: number;
  expectedAmount: number;
}

export interface SpendTrajectoryChartProps {
  currency: string;
  periodStart: string;
  periodEnd: string;
  /** Cumulative actual spend, one point per day with data, sorted ascending. */
  actual: SpendTrajectoryPoint[];
  /** Exactly `[lastActual, projectedAtPeriodEnd]` — `null` once the period has
   * fully elapsed or there isn't enough data to project. */
  forecastTail: SpendTrajectoryPoint[] | null;
  budgetAmount?: number | null;
  anomalies?: SpendTrajectoryAnomaly[];
  height?: number;
}

const PADDING_TOP = 20;
const PADDING_BOTTOM = 26;
const PADDING_X = 6;

function formatDayLabel(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.trim().replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value) || full.length !== 6)
    return `rgba(23, 121, 213, ${alpha})`;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Catmull-Rom-derived cubic Bezier through `points` — a smooth curve without
 * overshooting past neighboring values, unlike a naive spline. Falls back to
 * a straight segment for exactly two points (the forecast tail). */
function tracePath(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
) {
  if (points.length === 0) return;
  ctx.moveTo(points[0]!.x, points[0]!.y);
  if (points.length === 1) return;
  if (points.length === 2) {
    ctx.lineTo(points[1]!.x, points[1]!.y);
    return;
  }
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

const SEVERITY_DOT_CLASS: Record<SpendTrajectoryAnomaly["severity"], string> = {
  high: "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.22)]",
  medium: "bg-amber-500/80 shadow-[0_0_0_4px_rgba(245,158,11,0.16)]",
  low: "bg-muted-foreground/70 shadow-[0_0_0_4px_rgba(148,163,184,0.16)]",
};

/**
 * The "where has spend been, and where is it headed" chart — cumulative
 * actual spend as a filled area, Core's real `ForecastService` projection as
 * a dashed tail (never a client-side trailing-average guess), the active
 * budget's threshold as a reference line, and anomaly days as markers on the
 * same timeline. One chart tells the whole trend + forecast + budget story
 * per currency, instead of three separate widgets repeating the same x axis.
 *
 * Rendered on `<canvas>` for the gradient fill and smooth curve; a11y is
 * covered by `role="img"`/`aria-label` plus a real `<table>` fallback
 * (`references/interaction.md`'s "a table view exists" requirement) since a
 * canvas has no DOM structure of its own to expose.
 */
export function SpendTrajectoryChart({
  currency,
  periodStart,
  periodEnd,
  actual,
  forecastTail,
  budgetAmount = null,
  anomalies = [],
  height = 220,
}: SpendTrajectoryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<{
    x: number;
    point: SpendTrajectoryPoint;
    projected: boolean;
  } | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const periodStartMs = new Date(periodStart).getTime();
  const periodEndMs = new Date(periodEnd).getTime();
  const span = Math.max(1, periodEndMs - periodStartMs);
  const plotWidth = Math.max(0, width - PADDING_X * 2);
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const xFor = useCallback(
    (iso: string) =>
      PADDING_X +
      ((new Date(iso).getTime() - periodStartMs) / span) * plotWidth,
    [periodStartMs, span, plotWidth],
  );
  const maxValue = Math.max(
    1,
    budgetAmount ?? 0,
    ...actual.map((point) => point.cumulative),
    ...(forecastTail?.map((point) => point.cumulative) ?? []),
  );
  const yFor = useCallback(
    (value: number) =>
      PADDING_TOP + plotHeight - (value / maxValue) * plotHeight,
    [plotHeight, maxValue],
  );
  const todayX = forecastTail ? xFor(forecastTail[0]!.date) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const styles = getComputedStyle(document.documentElement);
    const accent = styles.getPropertyValue("--accent").trim() || "#1779d5";
    const accentSecondary =
      styles.getPropertyValue("--accent-secondary").trim() || "#20d0db";
    const borderSoft =
      styles.getPropertyValue("--border-soft").trim() ||
      "rgba(148, 163, 184, 0.16)";
    const mutedForeground =
      styles.getPropertyValue("--muted-foreground").trim() || "#5d708e";

    ctx.strokeStyle = borderSoft;
    ctx.lineWidth = 1;
    for (const fraction of [0.25, 0.5, 0.75, 1]) {
      const y = PADDING_TOP + plotHeight * (1 - fraction);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (actual.length > 0) {
      const actualPoints = actual.map((point) => ({
        x: xFor(point.date),
        y: yFor(point.cumulative),
      }));
      const first = actualPoints[0]!;
      const last = actualPoints[actualPoints.length - 1]!;

      const gradient = ctx.createLinearGradient(
        0,
        PADDING_TOP,
        0,
        height - PADDING_BOTTOM,
      );
      gradient.addColorStop(0, hexToRgba(accent, 0.3));
      gradient.addColorStop(1, hexToRgba(accent, 0));
      ctx.beginPath();
      tracePath(ctx, actualPoints);
      ctx.lineTo(last.x, height - PADDING_BOTTOM);
      ctx.lineTo(first.x, height - PADDING_BOTTOM);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      tracePath(ctx, actualPoints);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }

    if (forecastTail && forecastTail.length === 2) {
      const tailPoints = forecastTail.map((point) => ({
        x: xFor(point.date),
        y: yFor(point.cumulative),
      }));
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      tracePath(ctx, tailPoints);
      ctx.strokeStyle = hexToRgba(accent, 0.75);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (todayX !== null) {
      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.moveTo(todayX, PADDING_TOP);
      ctx.lineTo(todayX, height - PADDING_BOTTOM);
      ctx.strokeStyle = hexToRgba(mutedForeground, 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (budgetAmount !== null && budgetAmount > 0) {
      const y = yFor(budgetAmount);
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.strokeStyle = hexToRgba(accentSecondary, 0.85);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (actual.length > 0) {
      const last = actual[actual.length - 1]!;
      ctx.beginPath();
      ctx.arc(xFor(last.date), yFor(last.cumulative), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
    }
    // width/height/plotWidth/plotHeight/xFor/yFor/todayX are all derived
    // from the same render's props+width, recomputed together — listing the
    // primitives below is equivalent and avoids an exhaustive-deps warning
    // over recreated function values.
  }, [
    actual,
    forecastTail,
    budgetAmount,
    width,
    height,
    resolvedTheme,
    periodStartMs,
    periodEndMs,
    plotHeight,
    todayX,
    xFor,
    yFor,
  ]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (width === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const candidates: { point: SpendTrajectoryPoint; projected: boolean }[] =
      actual.map((point) => ({ point, projected: false }));
    if (forecastTail?.[1])
      candidates.push({ point: forecastTail[1], projected: true });
    if (candidates.length === 0) return;
    let nearest = candidates[0]!;
    let nearestDistance = Math.abs(xFor(nearest.point.date) - pointerX);
    for (const candidate of candidates) {
      const distance = Math.abs(xFor(candidate.point.date) - pointerX);
      if (distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    }
    setHover({
      x: xFor(nearest.point.date),
      point: nearest.point,
      projected: nearest.projected,
    });
  }

  const tableRows: { label: string; amount: number; projected: boolean }[] = [
    ...actual.map((point) => ({
      label: formatDayLabel(point.date),
      amount: point.cumulative,
      projected: false,
    })),
    ...(forecastTail?.[1]
      ? [
          {
            label: formatDayLabel(forecastTail[1].date),
            amount: forecastTail[1].cumulative,
            projected: true,
          },
        ]
      : []),
  ];

  return (
    <div>
      <div
        ref={containerRef}
        className="relative"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Cumulative ${currency} spend from ${formatDayLabel(periodStart)} to ${formatDayLabel(periodEnd)}${
          forecastTail
            ? `, projected to reach ${formatAmount(forecastTail[1]!.cumulative, currency)}`
            : ""
        }`}
      >
        <canvas ref={canvasRef} className="block w-full" style={{ height }} />
        {anomalies.map((anomaly) => (
          <span
            key={anomaly.id}
            title={`${anomaly.severity} anomaly on ${formatDayLabel(anomaly.date)}: ${formatAmount(anomaly.actualAmount, currency)} vs. ${formatAmount(anomaly.expectedAmount, currency)} expected`}
            className={`absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${SEVERITY_DOT_CLASS[anomaly.severity]}`}
            style={{
              left: xFor(anomaly.date),
              top:
                yFor(
                  actual.find((point) => point.date === anomaly.date)
                    ?.cumulative ??
                    actual[actual.length - 1]?.cumulative ??
                    0,
                ) - 10,
            }}
          />
        ))}
        {hover ? (
          <>
            <div
              className="bg-border-soft pointer-events-none absolute top-0 w-px"
              style={{ left: hover.x, height: height - PADDING_BOTTOM }}
            />
            <div
              className="border-border-soft bg-dashboard-panel-strong pointer-events-none absolute z-10 -translate-y-full rounded-lg border px-2.5 py-1.5 text-xs whitespace-nowrap shadow-[0_12px_28px_var(--shadow-card)]"
              style={{
                left: Math.min(Math.max(hover.x, 60), width - 60),
                top: yFor(hover.point.cumulative) - 10,
                transform: "translate(-50%, -100%)",
              }}
            >
              <p className="text-muted-foreground">
                {formatDayLabel(hover.point.date)}
                {hover.projected ? " · projected" : ""}
              </p>
              <p className="text-foreground font-mono font-semibold">
                {formatAmount(hover.point.cumulative, currency)}
              </p>
            </div>
          </>
        ) : null}
      </div>
      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="bg-accent inline-block h-0.5 w-3 rounded-full" />{" "}
          Actual
        </span>
        {forecastTail ? (
          <span className="flex items-center gap-1.5">
            <span className="bg-accent inline-block h-0.5 w-3 rounded-full [background-image:repeating-linear-gradient(90deg,currentColor_0,currentColor_3px,transparent_3px,transparent_6px)] opacity-60" />
            Forecast
          </span>
        ) : null}
        {budgetAmount !== null && budgetAmount > 0 ? (
          <span className="flex items-center gap-1.5">
            <span className="bg-accent-secondary inline-block h-0.5 w-3 rounded-full" />{" "}
            Budget · {formatAmount(budgetAmount, currency)}
          </span>
        ) : null}
        {anomalies.length > 0 ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-amber-500" />{" "}
            Anomaly
          </span>
        ) : null}
      </div>
      {tableRows.length > 0 ? (
        <details className="mt-2">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-[11px]">
            View as table
          </summary>
          <div className="border-border-soft mt-2 max-h-48 overflow-y-auto rounded-lg border">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-border-soft border-b">
                  <th className="text-muted-foreground px-3 py-1.5 font-medium">
                    Date
                  </th>
                  <th className="text-muted-foreground px-3 py-1.5 text-right font-medium">
                    Cumulative {currency}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr
                    key={row.label + row.projected}
                    className="border-border-soft/60 border-b last:border-0"
                  >
                    <td className="px-3 py-1.5">
                      {row.label}
                      {row.projected ? " (projected)" : ""}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {formatAmount(row.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}
