import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { integrationsGuide as guide } from "@/lib/guides/definitions/integrations";
import { GUIDES } from "@/lib/guides/registry";
import { GuidePlayer } from "./guide-player";

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

describe("GuidePlayer", () => {
  it("plays scene after scene like a video, and reports where it is", () => {
    const onSceneChange = vi.fn();
    render(<GuidePlayer guide={guide} onSceneChange={onSceneChange} />);
    expect(sceneTitle()).toBe(guide.scenes[0].title);
    expect(onSceneChange).toHaveBeenLastCalledWith(guide.scenes[0]);

    advance(guide.scenes[0].durationMs);
    expect(sceneTitle()).toBe(guide.scenes[1].title);
    expect(onSceneChange).toHaveBeenLastCalledWith(guide.scenes[1]);
  });

  it("pauses, steps and jumps to a scene", () => {
    render(<GuidePlayer guide={guide} />);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    advance(guide.scenes[0].durationMs * 2);
    expect(sceneTitle()).toBe(guide.scenes[0].title);

    fireEvent.click(screen.getByRole("button", { name: "Next scene" }));
    expect(sceneTitle()).toBe(guide.scenes[1].title);
    fireEvent.click(screen.getByRole("button", { name: "Previous scene" }));
    expect(sceneTitle()).toBe(guide.scenes[0].title);

    const last = guide.scenes.length - 1;
    fireEvent.click(
      screen.getByRole("button", {
        name: `Scene ${last + 1}: ${guide.scenes[last].title}`,
      }),
    );
    expect(sceneTitle()).toBe(guide.scenes[last].title);

    fireEvent.keyDown(screen.getByRole("group"), { key: "ArrowLeft" });
    expect(sceneTitle()).toBe(guide.scenes[last - 1].title);
  });

  it("ends on a screen that replays or hands over to the tour", () => {
    const onEnd = vi.fn();
    const onTakeTour = vi.fn();
    render(
      <GuidePlayer
        guide={guide}
        startIndex={guide.scenes.length - 1}
        onEnd={onEnd}
        onTakeTour={onTakeTour}
      />,
    );
    advance(guide.scenes[guide.scenes.length - 1].durationMs);
    expect(onEnd).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", { name: /Take the tour on the page/ }),
    );
    expect(onTakeTour).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Watch again/ }));
    expect(sceneTitle()).toBe(guide.scenes[0].title);
  });

  it("starts paused when embedded, until played", () => {
    render(<GuidePlayer guide={guide} inline />);
    advance(guide.scenes[0].durationMs);
    expect(sceneTitle()).toBe(guide.scenes[0].title);

    fireEvent.click(
      screen.getByRole("button", { name: `Play ${guide.title}` }),
    );
    advance(guide.scenes[0].durationMs);
    expect(sceneTitle()).toBe(guide.scenes[1].title);
  });

  it.each(
    GUIDES.flatMap((item) =>
      item.scenes.map(
        (scene, index) => [item.key, scene.id, item, index] as const,
      ),
    ),
  )("renders %s → %s", (_key, _scene, item, index) => {
    render(<GuidePlayer guide={item} startIndex={index} />);
    expect(sceneTitle()).toBe(item.scenes[index].title);
    // The scene played through without breaking.
    advance(item.scenes[index].durationMs - 100);
  });
});
