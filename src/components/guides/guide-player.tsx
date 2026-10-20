"use client";

import { useEffect, useReducer, useRef, type KeyboardEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import type { GuideDefinition, GuideScene } from "@/lib/guides/types";
import { cn } from "@/lib/utils";
import { SceneCanvas } from "./scene-kit";
import { GUIDE_VISUALS } from "./visuals";

/** How often a playing scene's clock advances. */
export const GUIDE_TICK_MS = 100;

interface PlayerState {
  index: number;
  elapsed: number;
  playing: boolean;
  /** False until an inline player is first played. */
  started: boolean;
  ended: boolean;
  /** Bumped to replay a scene's animation from the start. */
  round: number;
}

type PlayerAction =
  | { type: "tick" }
  | { type: "toggle" }
  | { type: "go"; index: number }
  | { type: "replay" };

function reduce(
  state: PlayerState,
  action: PlayerAction,
  scenes: readonly GuideScene[],
): PlayerState {
  const last = scenes.length - 1;
  switch (action.type) {
    case "tick": {
      if (!state.playing || state.ended) return state;
      const elapsed = state.elapsed + GUIDE_TICK_MS;
      if (elapsed < scenes[state.index].durationMs)
        return { ...state, elapsed };
      if (state.index === last)
        return {
          ...state,
          elapsed: scenes[last].durationMs,
          ended: true,
          playing: false,
        };
      return { ...state, index: state.index + 1, elapsed: 0 };
    }
    case "toggle":
      if (state.ended) return reduce(state, { type: "replay" }, scenes);
      return { ...state, playing: !state.playing, started: true };
    case "go":
      if (action.index > last)
        return {
          ...state,
          elapsed: scenes[last].durationMs,
          index: last,
          ended: true,
          playing: false,
        };
      return {
        ...state,
        index: Math.max(0, action.index),
        elapsed: 0,
        ended: false,
        round: state.round + 1,
      };
    case "replay":
      return {
        index: 0,
        elapsed: 0,
        ended: false,
        playing: true,
        started: true,
        round: state.round + 1,
      };
  }
}

/**
 * Plays a guide like a video: each scene's animation runs while its caption
 * shows, then the next scene starts. Pause, step back or forward, or jump to
 * any scene; ←/→ step and K toggles. `inline` (Documentation) starts paused;
 * the dialog plays at once. The end screen replays, or hands over to a tour
 * with `onTakeTour`.
 */
export function GuidePlayer({
  guide,
  startIndex = 0,
  inline = false,
  onSceneChange,
  onEnd,
  onTakeTour,
}: {
  guide: GuideDefinition;
  startIndex?: number;
  inline?: boolean;
  onSceneChange?: (scene: GuideScene) => void;
  onEnd?: () => void;
  onTakeTour?: () => void;
}) {
  const scenes = guide.scenes;
  const [state, dispatch] = useReducer(
    (current: PlayerState, action: PlayerAction) =>
      reduce(current, action, scenes),
    undefined,
    () => ({
      index: Math.min(Math.max(0, startIndex), scenes.length - 1),
      elapsed: 0,
      playing: !inline,
      started: !inline,
      ended: false,
      round: 0,
    }),
  );
  const scene = scenes[state.index];
  const Visual = GUIDE_VISUALS[guide.key]?.[scene.id];

  useEffect(() => {
    if (!state.playing) return;
    const handle = window.setInterval(
      () => dispatch({ type: "tick" }),
      GUIDE_TICK_MS,
    );
    return () => window.clearInterval(handle);
  }, [state.playing]);

  const sceneChange = useRef(onSceneChange);
  const end = useRef(onEnd);
  useEffect(() => {
    sceneChange.current = onSceneChange;
    end.current = onEnd;
  });
  useEffect(() => {
    sceneChange.current?.(scenes[state.index]);
  }, [scenes, state.index]);
  useEffect(() => {
    if (state.ended) end.current?.();
  }, [state.ended]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      dispatch({ type: "go", index: state.index + 1 });
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      dispatch({ type: "go", index: state.index - 1 });
    } else if (event.key === "k" || event.key === "K") {
      dispatch({ type: "toggle" });
    }
  }

  const paused = !state.playing || state.ended;
  return (
    <div
      className="flex flex-col gap-4"
      onKeyDown={onKeyDown}
      role="group"
      aria-roledescription="video guide"
      aria-label={guide.title}
    >
      <div
        className="guide-stage border-border-soft bg-surface relative aspect-video w-full overflow-hidden rounded-2xl border"
        data-paused={paused ? "true" : "false"}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(var(--grid-dot)_1px,transparent_1px)] [background-size:18px_18px]"
        />
        {Visual ? (
          <SceneCanvas key={`${state.index}:${state.round}`}>
            <Visual />
          </SceneCanvas>
        ) : null}
        {state.ended ? (
          <div className="bg-background/80 animate-toast-in absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center backdrop-blur-sm">
            <div>
              <p className="text-lg font-semibold tracking-tight">
                {guide.title}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                That&apos;s the whole guide — now try it for real.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {onTakeTour ? (
                <button
                  type="button"
                  onClick={onTakeTour}
                  className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-[0_10px_30px_var(--shadow-brand)]"
                >
                  <Compass size={15} /> Take the tour on the page
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => dispatch({ type: "replay" })}
                className="border-border-soft hover:bg-foreground/5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium"
              >
                <RotateCcw size={15} /> Watch again
              </button>
            </div>
          </div>
        ) : !state.started ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "toggle" })}
            aria-label={`Play ${guide.title}`}
            className="bg-background/55 group absolute inset-0 flex items-center justify-center backdrop-blur-[1px]"
          >
            <span className="bg-accent text-accent-foreground flex size-16 items-center justify-center rounded-full shadow-[0_18px_44px_var(--shadow-brand)] transition-transform group-hover:scale-105">
              <Play size={26} className="translate-x-0.5" />
            </span>
          </button>
        ) : null}
      </div>

      <div className="min-h-[5.5rem]" aria-live="polite">
        <p className="text-accent text-[11px] font-semibold tracking-[0.16em] uppercase">
          {state.index + 1} / {scenes.length}
        </p>
        <h3 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">
          {scene.title}
        </h3>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          {scene.caption}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => dispatch({ type: "go", index: state.index - 1 })}
          disabled={state.index === 0 && !state.ended}
          aria-label="Previous scene"
          className="hover:bg-foreground/5 text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-lg disabled:opacity-35"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          autoFocus={!inline}
          onClick={() => dispatch({ type: "toggle" })}
          aria-label={state.playing ? "Pause" : state.ended ? "Replay" : "Play"}
          className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-full"
        >
          {state.playing ? (
            <Pause size={17} />
          ) : state.ended ? (
            <RotateCcw size={17} />
          ) : (
            <Play size={17} className="translate-x-px" />
          )}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "go", index: state.index + 1 })}
          disabled={state.ended}
          aria-label="Next scene"
          className="hover:bg-foreground/5 text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-lg disabled:opacity-35"
        >
          <ChevronRight size={18} />
        </button>
        <div className="ml-2 flex flex-1 items-center gap-1">
          {scenes.map((item, index) => {
            const fill =
              index < state.index || (index === state.index && state.ended)
                ? 1
                : index === state.index
                  ? state.elapsed / item.durationMs
                  : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => dispatch({ type: "go", index })}
                aria-label={`Scene ${index + 1}: ${item.title}`}
                aria-current={index === state.index ? "step" : undefined}
                className="group flex h-6 flex-1 items-center"
              >
                <span className="bg-foreground/10 group-hover:bg-foreground/20 relative h-1.5 w-full overflow-hidden rounded-full transition-colors">
                  <span
                    className={cn(
                      "bg-accent absolute inset-y-0 left-0 rounded-full",
                      index === state.index &&
                        state.playing &&
                        "transition-[width] duration-100 ease-linear",
                    )}
                    style={{ width: `${fill * 100}%` }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
