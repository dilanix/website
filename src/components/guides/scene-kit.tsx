"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Every scene is laid out on this fixed canvas and scaled to the stage, so
 *  positions and cursor paths stay exact at any width. */
export const SCENE_WIDTH = 960;
export const SCENE_HEIGHT = 540;

type Animation =
  | "guide-appear-up"
  | "guide-appear-scale"
  | "guide-appear-left"
  | "guide-fade-in"
  | "guide-fade-out"
  | "guide-type"
  | "guide-grow-x"
  | "guide-ring";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** A one-off animation starting `at` ms into the scene. */
export function anim(
  name: Animation,
  at: number,
  duration = 600,
  easing = EASE,
): CSSProperties {
  return { animation: `${name} ${duration}ms ${easing} ${at}ms both` };
}

const CanvasContext = createContext<RefObject<HTMLDivElement | null> | null>(
  null,
);

export function SceneCanvas({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      if (element.clientWidth > 0) setScale(element.clientWidth / SCENE_WIDTH);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div
        ref={canvas}
        className="relative origin-top-left"
        style={{
          width: SCENE_WIDTH,
          height: SCENE_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <CanvasContext.Provider value={canvas}>
          {children}
        </CanvasContext.Provider>
      </div>
    </div>
  );
}

/** Absolutely placed content that appears `at` ms into the scene. */
export function At({
  x,
  y,
  w,
  at = 0,
  from = "up",
  duration,
  className,
  children,
}: {
  x: number;
  y: number;
  w?: number;
  at?: number;
  from?: "up" | "scale" | "left" | "fade";
  duration?: number;
  className?: string;
  children: ReactNode;
}) {
  const name = {
    up: "guide-appear-up",
    scale: "guide-appear-scale",
    left: "guide-appear-left",
    fade: "guide-fade-in",
  }[from] as Animation;
  return (
    <div
      className={cn("absolute", className)}
      style={{ left: x, top: y, width: w, ...anim(name, at, duration) }}
    >
      {children}
    </div>
  );
}

/** Content shown until `until` ms — replaced by what follows. It exists
 *  only as motion, so reduced motion shows what replaces it. */
export function Until({
  until,
  children,
  className,
}: {
  until: number;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("guide-motion-only block", className)}
      style={anim("guide-fade-out", until, 250, "ease-out")}
    >
      {children}
    </span>
  );
}

/** Text typed out from `at`. */
export function Typing({
  text,
  at,
  duration = Math.max(400, text.length * 55),
  className,
}: {
  text: string;
  at: number;
  duration?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block whitespace-pre", className)}
      style={{
        animation: `guide-type ${duration}ms steps(${Math.max(1, text.length)}) ${at}ms both`,
      }}
    >
      {text}
    </span>
  );
}

/** Where the pointer goes: a spot on the canvas, or the centre of the
 *  element marked `data-cursor={to}` (plus `dx`/`dy`). */
export type CursorPoint = (
  { x: number; y: number } | { to: string; dx?: number; dy?: number }
) & {
  /** ms into the scene the pointer is here. */
  at: number;
  /** Clicks on arrival. */
  click?: boolean;
};

/** An element's centre on the canvas, from layout offsets — which entrance
 *  transforms don't move, so it is where the element ends up. */
function centreOf(element: HTMLElement, canvas: HTMLElement) {
  let x = element.offsetWidth / 2;
  let y = element.offsetHeight / 2;
  let node: HTMLElement | null = element;
  while (node && node !== canvas) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

/** A pointer that moves through `points` and clicks where asked. Targets
 *  are measured once the scene is laid out, then written straight onto the
 *  pointer's animation. */
export function Cursor({ points }: { points: readonly CursorPoint[] }) {
  const name = `guide-cursor-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const canvas = useContext(CanvasContext);
  const keyframes = useRef<HTMLStyleElement>(null);
  const pointer = useRef<HTMLDivElement>(null);
  const ripples = useRef<(HTMLSpanElement | null)[]>([]);
  const clicks = points.filter((point) => point.click);

  useLayoutEffect(() => {
    const root = canvas?.current;
    const resolved = points.map((point) => {
      if ("x" in point) return point;
      const element = root?.querySelector<HTMLElement>(
        `[data-cursor="${point.to}"]`,
      );
      const centre = element && root ? centreOf(element, root) : { x: 0, y: 0 };
      return {
        x: centre.x + (point.dx ?? 0),
        y: centre.y + (point.dy ?? 0),
        at: point.at,
        click: point.click,
      };
    });
    const end = Math.max(1, resolved[resolved.length - 1].at);
    // The arrow's tip sits 4px right and 2px down of its box.
    const place = (point: { x: number; y: number }) =>
      `translate(${point.x - 4}px, ${point.y - 2}px)`;
    if (keyframes.current)
      keyframes.current.textContent = `@keyframes ${name} { ${resolved
        .map(
          (point) =>
            `${((point.at / end) * 100).toFixed(2)}% { transform: ${place(point)}; }`,
        )
        .join(" ")} }`;
    if (pointer.current) {
      pointer.current.style.transform = place(resolved[0]);
      pointer.current.style.animation = `${name} ${end}ms ease-in-out both`;
      pointer.current.style.visibility = "visible";
    }
    resolved
      .filter((point) => point.click)
      .forEach((point, index) => {
        const ripple = ripples.current[index];
        if (!ripple) return;
        ripple.style.left = `${point.x}px`;
        ripple.style.top = `${point.y}px`;
      });
  }, [canvas, name, points]);

  return (
    <>
      <style ref={keyframes} />
      <div
        ref={pointer}
        aria-hidden
        className="guide-motion-only pointer-events-none invisible absolute top-0 left-0 z-40"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
        >
          <path
            d="M4 2.5 19.5 14l-7 1.2 4 7.3-2.9 1.5-3.9-7.4L4.5 21z"
            fill="white"
            stroke="#0b1b33"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {clicks.map((point, index) => (
        <span
          key={index}
          ref={(element) => {
            ripples.current[index] = element;
          }}
          aria-hidden
          className="guide-motion-only border-accent pointer-events-none absolute z-30 size-9 rounded-full border-2"
          style={{
            animation: `guide-ripple 600ms ease-out ${point.at}ms both`,
          }}
        />
      ))}
    </>
  );
}

/** SVG lines drawn in from `at`; `flow` keeps dashes moving along them. */
export function Lines({
  paths,
  className = "stroke-accent/55",
  flow,
}: {
  paths: readonly { d: string; at: number; duration?: number }[];
  className?: string;
  flow?: boolean;
}) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0"
      width={SCENE_WIDTH}
      height={SCENE_HEIGHT}
      fill="none"
    >
      {paths.map((path, index) => (
        <g key={index}>
          <path
            d={path.d}
            pathLength={1}
            strokeDasharray={1}
            strokeWidth={2}
            strokeLinecap="round"
            className={className}
            style={{
              animation: `guide-draw ${path.duration ?? 700}ms ease-out ${path.at}ms both`,
            }}
          />
          {flow ? (
            <path
              d={path.d}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="3 13"
              className="stroke-accent guide-motion-only"
              style={{
                animation: `guide-fade-in 300ms ease-out ${(path.at + (path.duration ?? 700)).toString()}ms both, guide-flow 900ms linear ${path.at}ms infinite`,
              }}
            />
          ) : null}
        </g>
      ))}
    </svg>
  );
}

/** A browser window around a mock page. */
export function MockWindow({
  url,
  x,
  y,
  w,
  h,
  at = 0,
  children,
}: {
  url: string;
  x: number;
  y: number;
  w: number;
  h: number;
  at?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="border-border-soft bg-background absolute overflow-hidden rounded-xl border shadow-[0_24px_60px_var(--shadow-card)]"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        ...anim("guide-appear-scale", at),
      }}
    >
      <div className="border-border-soft bg-surface flex h-8 items-center gap-1.5 border-b px-3">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="bg-background text-muted-foreground ml-3 truncate rounded-md px-3 py-0.5 font-mono text-[10px]">
          {url}
        </span>
      </div>
      <div className="relative h-[calc(100%-2rem)]">{children}</div>
    </div>
  );
}

export function MockButton({
  children,
  variant = "primary",
  cursor,
  className,
  style,
}: {
  children: ReactNode;
  variant?: "primary" | "outline" | "danger";
  /** Lets a `Cursor` point at it. */
  cursor?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      data-cursor={cursor}
      style={style}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap",
        variant === "primary" && "bg-accent text-accent-foreground",
        variant === "outline" && "border-foreground/15 border",
        variant === "danger" && "border border-red-500/40 text-red-500",
        className,
      )}
    >
      {children}
    </span>
  );
}

export type MockTone = "success" | "warning" | "danger" | "neutral" | "accent";

const TONES: Record<MockTone, string> = {
  success: "border-success/35 bg-success/10 text-success",
  warning:
    "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  danger: "border-red-500/40 bg-red-500/10 text-red-500",
  neutral: "border-border-soft bg-card-strong text-muted-foreground",
  accent: "border-accent/40 bg-accent/10 text-accent",
};

export function MockBadge({
  tone,
  children,
  className,
  style,
}: {
  tone: MockTone;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A form field with a value typed in from `at` (or already there). */
export function MockField({
  label,
  value,
  at,
  mono,
  cursor,
  className,
}: {
  label: string;
  value: string;
  at?: number;
  mono?: boolean;
  cursor?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 text-[11px] font-medium">{label}</p>
      <div
        data-cursor={cursor}
        className={cn(
          "border-foreground/15 bg-background flex h-8 items-center rounded-lg border px-2.5 text-xs",
          mono && "font-mono",
        )}
      >
        {at === undefined ? value : <Typing text={value} at={at} />}
      </div>
    </div>
  );
}

/** A checkbox that ticks itself `at` ms in (or is already ticked). */
export function MockCheck({
  label,
  detail,
  checkedAt,
  checked = checkedAt !== undefined,
  cursor,
  className,
}: {
  label: ReactNode;
  detail?: ReactNode;
  checkedAt?: number;
  checked?: boolean;
  cursor?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <span
        data-cursor={cursor}
        className="border-foreground/25 bg-background relative flex size-4 shrink-0 items-center justify-center rounded border"
      >
        {checked ? (
          <span
            className="bg-accent text-accent-foreground absolute inset-[-1px] flex items-center justify-center rounded"
            style={
              checkedAt !== undefined
                ? anim("guide-appear-scale", checkedAt, 250)
                : undefined
            }
          >
            <Check size={11} strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="font-medium">{label}</span>
        {detail ? (
          <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">
            {detail}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** A growing progress bar, full `duration` ms after `at`. */
export function MockProgress({
  at,
  duration,
  className,
  barClassName = "bg-accent",
}: {
  at: number;
  duration: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div
      className={cn(
        "bg-foreground/10 h-1.5 overflow-hidden rounded-full",
        className,
      )}
    >
      <div
        className={cn("h-full origin-left rounded-full", barClassName)}
        style={anim("guide-grow-x", at, duration, "linear")}
      />
    </div>
  );
}

/** A labelled box in a diagram. */
export function Node({
  title,
  detail,
  icon,
  tone = "neutral",
  className,
}: {
  title: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "accent" | "success" | "muted";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 shadow-[0_12px_30px_var(--shadow-card)]",
        tone === "neutral" && "border-border-soft bg-card-strong",
        tone === "accent" && "border-accent/45 bg-accent/10",
        tone === "success" && "border-success/45 bg-success/10",
        tone === "muted" &&
          "border-border-soft bg-card-strong text-muted-foreground opacity-60",
        className,
      )}
    >
      {icon ? (
        <span className="bg-accent/12 text-accent flex size-8 shrink-0 items-center justify-center rounded-lg">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {detail ? (
          <span className="text-muted-foreground block truncate text-[11px]">
            {detail}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** A provider's code tile, as on the Integrations page. */
export function ProviderTile({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 font-mono text-[11px] font-bold text-amber-600 dark:text-amber-300",
        className,
      )}
    >
      {code}
    </span>
  );
}

/** A pulsing highlight around whatever is placed over it. */
export function Highlight({
  at,
  className,
}: {
  at: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "guide-motion-only pointer-events-none absolute -inset-1 rounded-xl",
        className,
      )}
      style={{ animation: `guide-ring 1100ms ease-in-out ${at}ms 2 both` }}
    />
  );
}
