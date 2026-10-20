import { fireEvent, waitFor } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TourDefinition } from "@/lib/tours/types";
import { runTour, type TourRun } from "./tour-runner";

const tour: TourDefinition = {
  key: "widgets.board",
  version: 1,
  title: "Widgets",
  description: "Widgets board",
  product: "widgets",
  route: "/dashboard/products/widgets",
  steps: [
    { id: "welcome", title: "Welcome <b>aboard</b>", body: "Hello & hi" },
    { id: "search", target: "widgets.search", title: "Search", body: "Find" },
    { id: "hidden", target: "widgets.admin", title: "Admin", body: "Gone" },
    {
      id: "details",
      target: "widgets.details",
      prepare: "open-details",
      title: "Details",
      body: "More",
    },
    { id: "finish", title: "Done", body: "Bye" },
  ],
};

let run: TourRun | undefined;

function popover() {
  const element = document.querySelector<HTMLElement>(".driver-popover");
  if (!element) throw new Error("no popover");
  return element;
}

function click(selector: string) {
  const button = popover().querySelector<HTMLElement>(selector);
  if (!button) throw new Error(`no ${selector}`);
  fireEvent.click(button);
}

function start(overrides: Partial<Parameters<typeof runTour>[1]> = {}) {
  const options = {
    startIndex: 0,
    runAction: vi.fn((id: string) => {
      if (id !== "open-details") return;
      const panel = document.createElement("aside");
      panel.dataset.tour = "widgets.details";
      document.body.appendChild(panel);
    }),
    onStep: vi.fn(),
    onFinish: vi.fn(),
    ...overrides,
  };
  run = runTour(tour, options);
  return options;
}

beforeEach(() => {
  document.body.innerHTML = '<input data-tour="widgets.search" />';
  // Reduced motion: no transitions to wait for.
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
});

afterEach(() => {
  run?.stop();
  run = undefined;
  document.body.innerHTML = "";
});

describe("runTour", () => {
  it("walks the steps on the page and finishes", async () => {
    const options = start();

    expect(popover().getAttribute("role")).toBe("dialog");
    expect(popover().querySelector(".driver-popover-title")?.textContent).toBe(
      "Welcome <b>aboard</b>",
    );
    // "Admin" has no target on the page, so it is not counted.
    expect(popover().textContent).toContain("1 of 4");
    expect(options.onStep).toHaveBeenLastCalledWith(tour.steps[0]);

    click(".driver-popover-next-btn");
    expect(options.onStep).toHaveBeenLastCalledWith(tour.steps[1]);

    click(".driver-popover-next-btn");
    expect(options.runAction).toHaveBeenCalledWith("open-details");
    await waitFor(() =>
      expect(options.onStep).toHaveBeenLastCalledWith(tour.steps[3]),
    );

    click(".driver-popover-prev-btn");
    expect(options.onStep).toHaveBeenLastCalledWith(tour.steps[1]);
    click(".driver-popover-next-btn");
    await waitFor(() =>
      expect(options.onStep).toHaveBeenLastCalledWith(tour.steps[3]),
    );
    click(".driver-popover-next-btn");
    expect(popover().querySelector(".dilanix-tour-skip")).toBeNull();
    expect(
      popover().querySelector(".driver-popover-next-btn")?.textContent,
    ).toBe("Finish");

    click(".driver-popover-next-btn");
    expect(options.onFinish).toHaveBeenCalledWith("completed", tour.steps[4]);
    expect(document.querySelector(".driver-popover")).toBeNull();
  });

  it("is dismissed by Skip", () => {
    const options = start();
    click(".dilanix-tour-skip");
    expect(options.onFinish).toHaveBeenCalledWith("dismissed", tour.steps[0]);
  });

  it("is dismissed by Escape", () => {
    const options = start();
    fireEvent.keyUp(document, { key: "Escape" });
    expect(options.onFinish).toHaveBeenCalledWith("dismissed", tour.steps[0]);
  });

  it("is interrupted when the page stops it", () => {
    const options = start({ startIndex: 1 });
    expect(options.onStep).toHaveBeenLastCalledWith(tour.steps[1]);
    run?.stop();
    expect(options.onFinish).toHaveBeenCalledWith("interrupted", tour.steps[1]);
  });

  it("resumes at the next step still on the page", () => {
    const options = start({ startIndex: 2 });
    expect(options.runAction).toHaveBeenCalledWith("open-details");
  });
});
