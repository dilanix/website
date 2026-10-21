"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Pause, Play } from "lucide-react";
import { SceneCanvas } from "@/components/guides/scene-kit";
import { cn } from "@/lib/utils";
import { REEL_HEIGHT, REEL_SHOTS, REEL_WIDTH } from "./hero-reel-scenes";

/** How often a playing shot's clock advances. */
export const REEL_TICK_MS = 100;

const DISSOLVE_MS = 320;
const TOTAL_SECONDS = Math.round(
  REEL_SHOTS.reduce((sum, shot) => sum + shot.durationMs, 0) / 1000,
);

interface ReelState {
  index: number;
  elapsed: number;
  /** Bumped on every cut, so a shot replays from its start. */
  round: number;
}

type ReelAction = { type: "tick" } | { type: "go"; index: number };

function reduce(state: ReelState, action: ReelAction): ReelState {
  if (action.type === "go")
    return { index: action.index, elapsed: 0, round: state.round + 1 };
  const elapsed = state.elapsed + REEL_TICK_MS;
  if (elapsed < REEL_SHOTS[state.index].durationMs)
    return { ...state, elapsed };
  return {
    index: (state.index + 1) % REEL_SHOTS.length,
    elapsed: 0,
    round: state.round + 1,
  };
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia(REDUCED_MOTION).matches
  );
}

/** One shot: a slow push in, then a dissolve into the next. */
function Shot({
  durationMs,
  children,
}: {
  durationMs: number;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0"
      style={{
        animation: `reel-out ${DISSOLVE_MS}ms ease-in ${durationMs - DISSOLVE_MS}ms both`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{ animation: `reel-push ${durationMs}ms linear both` }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The landing hero's reel: a fast, looping film of what Dilanix does —
 * connect, sync, map, cost, savings, the verified fix. It plays muted on its
 * own, pauses off-screen and in a background tab, and stays paused under
 * reduced motion until played. Every number is sample data.
 */
export function HeroReel() {
  const [state, dispatch] = useReducer(reduce, {
    index: 0,
    elapsed: 0,
    round: 0,
  });
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    () => false,
  );
  // Null until the visitor plays or pauses; then their choice wins.
  const [choice, setChoice] = useState<boolean | null>(null);
  const playing = choice ?? !reducedMotion;
  const root = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const running = playing && onScreen && pageVisible;

  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!running) return;
    const handle = window.setInterval(
      () => dispatch({ type: "tick" }),
      REEL_TICK_MS,
    );
    return () => window.clearInterval(handle);
  }, [running]);

  // Built once per cut, so the clock's ticks never re-render a shot.
  const stage = useMemo(() => {
    const shot = REEL_SHOTS[state.index];
    return (
      <SceneCanvas
        key={`${state.index}:${state.round}`}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
      >
        <Shot durationMs={shot.durationMs}>
          <shot.Visual />
        </Shot>
      </SceneCanvas>
    );
  }, [state.index, state.round]);

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="video"
      aria-label={`Dilanix in ${TOTAL_SECONDS} seconds`}
      className="relative mx-auto w-full max-w-xl"
    >
      <div
        aria-hidden
        className="from-accent/25 to-accent-secondary/20 pointer-events-none absolute -inset-4 -z-10 rounded-[2.4rem] bg-gradient-to-br blur-2xl"
      />
      <div
        className="guide-stage border-border-soft bg-card-strong/72 relative overflow-hidden rounded-[1.75rem] border shadow-[0_28px_80px_var(--shadow-brand)] backdrop-blur-xl"
        data-paused={running ? "false" : "true"}
      >
        <div className="border-border-soft/70 flex items-center justify-between gap-3 border-b px-4 py-2.5">
          <span className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
            <span
              className={cn(
                "size-1.5 rounded-full",
                running
                  ? "bg-accent shadow-[0_0_9px_var(--accent)]"
                  : "bg-muted-foreground/50",
              )}
            />
            Dilanix in {TOTAL_SECONDS} seconds
          </span>
          <span className="border-accent/20 bg-accent/8 text-accent rounded-full border px-2.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
            Sample data
          </span>
        </div>

        <div aria-hidden className="relative aspect-[6/5] w-full">
          <div className="absolute inset-0 bg-[radial-gradient(var(--grid-dot)_1px,transparent_1px)] [background-size:18px_18px] opacity-70" />
          <div className="bg-accent/10 animate-drift absolute -top-16 -left-10 size-64 rounded-full blur-3xl" />
          <div className="bg-accent-secondary/10 animate-drift absolute -right-12 -bottom-20 size-72 rounded-full blur-3xl [animation-delay:-6s]" />
          {stage}
        </div>
        <p className="sr-only">
          Connect AWS read-only, sync resources, bills and metrics, see how your
          resources connect and where the money goes, then get ranked savings
          with verified steps to apply them.
        </p>

        <div className="border-border-soft/70 flex items-center gap-3 border-t px-4 py-2.5">
          <button
            type="button"
            onClick={() => setChoice(!playing)}
            aria-label={playing ? "Pause video" : "Play video"}
            className="bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full shadow-[0_8px_20px_var(--shadow-brand)]"
          >
            {playing ? (
              <Pause size={14} />
            ) : (
              <Play size={14} className="translate-x-px" />
            )}
          </button>
          <div className="flex flex-1 items-center gap-1">
            {REEL_SHOTS.map((shot, index) => {
              const fill =
                index < state.index
                  ? 1
                  : index === state.index
                    ? state.elapsed / shot.durationMs
                    : 0;
              return (
                <button
                  key={shot.id}
                  type="button"
                  onClick={() => {
                    dispatch({ type: "go", index });
                    // A shot cut to while paused would sit on its first,
                    // empty frame; under reduced motion it shows its end.
                    if (!reducedMotion) setChoice(true);
                  }}
                  aria-label={`Scene ${index + 1}: ${shot.chapter}`}
                  aria-current={index === state.index ? "step" : undefined}
                  className="group flex h-6 flex-1 items-center"
                >
                  <span className="bg-foreground/10 group-hover:bg-foreground/20 relative h-1 w-full overflow-hidden rounded-full transition-colors">
                    <span
                      className={cn(
                        "from-accent to-accent-secondary absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                        index === state.index &&
                          running &&
                          "transition-[width] duration-100 ease-linear",
                      )}
                      style={{ width: `${fill * 100}%` }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-muted-foreground hidden w-28 truncate text-right text-[11px] font-medium sm:block">
            {REEL_SHOTS[state.index].chapter}
          </span>
        </div>
      </div>
    </div>
  );
}
