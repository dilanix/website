import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroReel } from "./hero-reel";
import { REEL_SHOTS } from "./hero-reel-scenes";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const current = () =>
  screen
    .getAllByRole("button", { name: /^Scene / })
    .findIndex((button) => button.getAttribute("aria-current") === "step");
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe("HeroReel", () => {
  it("has short shots with unique ids", () => {
    const ids = REEL_SHOTS.map((shot) => shot.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const shot of REEL_SHOTS) {
      expect(shot.durationMs).toBeGreaterThanOrEqual(2000);
      expect(shot.durationMs).toBeLessThanOrEqual(4000);
    }
  });

  it("plays shot after shot on its own and loops", () => {
    render(<HeroReel />);
    expect(current()).toBe(0);
    advance(REEL_SHOTS[0].durationMs);
    expect(current()).toBe(1);

    const rest = REEL_SHOTS.slice(1).reduce(
      (sum, shot) => sum + shot.durationMs,
      0,
    );
    advance(rest);
    expect(current()).toBe(0);
  });

  it("pauses, and cutting to a shot plays it", () => {
    render(<HeroReel />);
    fireEvent.click(screen.getByRole("button", { name: "Pause video" }));
    advance(REEL_SHOTS[0].durationMs * 2);
    expect(current()).toBe(0);

    const last = REEL_SHOTS.length - 1;
    fireEvent.click(
      screen.getByRole("button", {
        name: `Scene ${last + 1}: ${REEL_SHOTS[last].chapter}`,
      }),
    );
    expect(current()).toBe(last);
    expect(screen.getByRole("button", { name: "Pause video" })).toBeTruthy();
  });
});
