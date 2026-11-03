import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuidePlayer } from "@/components/guides/guide-player";
import { buildOnDilanixVideo as video } from "@/lib/guides/explainers/build-on-dilanix";
import { BUILD_ON_DILANIX_VISUALS } from "./build-on-dilanix-scenes";
import { BuildOnDilanixVideo } from "./build-on-dilanix-video";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const sceneTitle = () => screen.getByRole("heading", { level: 3 }).textContent;
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe("Build on Dilanix video", () => {
  it("has a visual for every scene, and a scene for every visual", () => {
    const ids = video.scenes.map((scene) => scene.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(BUILD_ON_DILANIX_VISUALS).sort()).toEqual(
      [...ids].sort(),
    );
    for (const scene of video.scenes)
      expect(scene.durationMs).toBeGreaterThanOrEqual(5000);
  });

  it("waits paused, then ends on booking a call", () => {
    render(<BuildOnDilanixVideo calendlyUrl="https://calendly.test/dilanix" />);
    advance(video.scenes[0].durationMs);
    expect(sceneTitle()).toBe(video.scenes[0].title);

    fireEvent.click(
      screen.getByRole("button", { name: `Play ${video.title}` }),
    );
    advance(video.scenes.reduce((sum, scene) => sum + scene.durationMs, 0));
    const call = screen.getByRole("link", { name: /Book a call/ });
    expect(call.getAttribute("href")).toBe("https://calendly.test/dilanix");
    expect(call.getAttribute("target")).toBe("_blank");
  });

  it.each(video.scenes.map((scene, index) => [scene.id, index] as const))(
    "renders %s",
    (_id, index) => {
      render(
        <GuidePlayer
          guide={video}
          visuals={BUILD_ON_DILANIX_VISUALS}
          startIndex={index}
        />,
      );
      expect(sceneTitle()).toBe(video.scenes[index].title);
      advance(video.scenes[index].durationMs - 100);
    },
  );
});
