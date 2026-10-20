import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  INFRASTRUCTURE_GRAPH_TOUR_KEY as KEY,
  infrastructureGraphTour as tour,
} from "@/lib/tours/definitions/infrastructure-graph";
import type { TourProgress } from "@/lib/tours/types";
import type { TourRunOptions } from "./tour-runner";
import { TourProvider, usePageTour, useTours } from "./tour-provider";

const { navigation, runTour, saveTourProgressAction } = vi.hoisted(() => ({
  navigation: { pathname: "/dashboard/products/infrastructure", push: vi.fn() },
  runTour: vi.fn(),
  saveTourProgressAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}));
vi.mock("@/app/dashboard/tour-actions", () => ({ saveTourProgressAction }));
vi.mock("./tour-runner", () => ({ runTour }));

const stop = vi.fn();
const openDetails = vi.fn();

function GraphPage({
  ready = true,
  available = true,
}: {
  ready?: boolean;
  available?: boolean;
}) {
  usePageTour(KEY, {
    ready,
    available,
    actions: { "open-resource-details": openDetails },
  });
  return null;
}

function StartButton() {
  const tours = useTours();
  return (
    <button type="button" onClick={() => tours?.start(KEY)}>
      Start tour
    </button>
  );
}

const startTour = () =>
  fireEvent.click(screen.getByRole("button", { name: "Start tour" }));

function renderProvider({
  progress = [],
  products = ["infrastructure"],
  page = <GraphPage />,
}: {
  progress?: TourProgress[] | null;
  products?: string[];
  page?: React.ReactNode;
} = {}) {
  return render(
    <TourProvider progress={progress} activeProductSlugs={products}>
      <StartButton />
      {page}
    </TourProvider>,
  );
}

function lastRun() {
  const call = runTour.mock.calls.at(-1);
  if (!call) throw new Error("no tour was run");
  return call[1] as TourRunOptions;
}

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(700);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  navigation.pathname = "/dashboard/products/infrastructure";
  runTour.mockReturnValue({ stop });
  saveTourProgressAction.mockResolvedValue({});
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("TourProvider", () => {
  it("auto-starts a new tour once its page is ready, and saves its progress", async () => {
    const { rerender } = renderProvider({ page: <GraphPage ready={false} /> });
    await settle();
    expect(runTour).not.toHaveBeenCalled();

    rerender(
      <TourProvider progress={[]} activeProductSlugs={["infrastructure"]}>
        <GraphPage />
      </TourProvider>,
    );
    await settle();
    expect(runTour).toHaveBeenCalledTimes(1);
    expect(runTour.mock.calls[0][0]).toBe(tour);
    expect(lastRun().startIndex).toBe(0);

    await act(async () => {
      lastRun().onStep(tour.steps[0]);
      lastRun().runAction("open-resource-details");
      lastRun().onFinish("completed", tour.steps.at(-1));
      await vi.runAllTimersAsync();
    });
    expect(openDetails).toHaveBeenCalledTimes(1);
    expect(saveTourProgressAction.mock.calls.map(([input]) => input)).toEqual([
      {
        tourKey: KEY,
        tourVersion: tour.version,
        status: "in_progress",
        stepId: "welcome",
      },
      {
        tourKey: KEY,
        tourVersion: tour.version,
        status: "completed",
        stepId: "finish",
      },
    ]);

    // Completed now: it does not start again on the same page.
    await settle();
    expect(runTour).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "the tour was completed at this version",
      {
        progress: [
          {
            tour_key: KEY,
            tour_version: tour.version,
            status: "completed" as const,
            step_id: null,
          },
        ],
      },
    ],
    [
      "the tour was skipped at this version",
      {
        progress: [
          {
            tour_key: KEY,
            tour_version: tour.version,
            status: "dismissed" as const,
            step_id: "search",
          },
        ],
      },
    ],
    ["progress could not be loaded", { progress: null }],
    ["the product is not active", { products: ["cost"] }],
  ])("does not auto-start when %s", async (_reason, options) => {
    renderProvider(options);
    await settle();
    expect(runTour).not.toHaveBeenCalled();
  });

  it("does not auto-start on narrow screens", async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    renderProvider();
    await settle();
    expect(runTour).not.toHaveBeenCalled();
  });

  it("offers a tour again after its version changes", async () => {
    renderProvider({
      progress: [
        {
          tour_key: KEY,
          tour_version: tour.version - 1 || 0,
          status: "completed",
          step_id: null,
        },
      ],
    });
    await settle();
    expect(runTour).toHaveBeenCalledTimes(1);
  });

  it("does not save anything when the page tears the tour down", async () => {
    const { rerender } = renderProvider();
    await settle();
    await act(async () => lastRun().onFinish("interrupted", tour.steps[2]));

    rerender(
      <TourProvider progress={[]} activeProductSlugs={["infrastructure"]}>
        <GraphPage />
      </TourProvider>,
    );
    expect(saveTourProgressAction).not.toHaveBeenCalled();
  });

  it("stops the running tour when its page goes away", async () => {
    const { rerender } = renderProvider();
    await settle();
    rerender(
      <TourProvider progress={[]} activeProductSlugs={["infrastructure"]}>
        {null}
      </TourProvider>,
    );
    expect(stop).toHaveBeenCalled();
  });

  it("starting from another page navigates there and resumes the stored step", async () => {
    navigation.pathname = "/dashboard/settings";
    const progress: TourProgress[] = [
      {
        tour_key: KEY,
        tour_version: tour.version,
        status: "in_progress",
        step_id: "search",
      },
    ];
    const { rerender } = renderProvider({ progress, page: null });

    startTour();
    expect(navigation.push).toHaveBeenCalledWith(tour.route);

    navigation.pathname = tour.route;
    rerender(
      <TourProvider progress={progress} activeProductSlugs={["infrastructure"]}>
        <StartButton />
        <GraphPage />
      </TourProvider>,
    );
    await settle();
    expect(runTour).toHaveBeenCalledTimes(1);
    expect(lastRun().startIndex).toBe(
      tour.steps.findIndex((step) => step.id === "search"),
    );
  });

  it("explains when the tour's page has nothing to show it on", async () => {
    renderProvider({ page: null });
    startTour();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });
    expect(runTour).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain(
      "The Infrastructure Graph tour is available once this page has data to show.",
    );
  });

  it("explains when the page withdraws the tour because it has nothing to show", async () => {
    renderProvider({ page: <GraphPage ready={false} available={false} /> });
    startTour();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });
    expect(runTour).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain(
      "The Infrastructure Graph tour is available once this page has data to show.",
    );
  });

  it("waits for a page that is still loading, then starts", async () => {
    const { rerender } = renderProvider({
      progress: null,
      page: <GraphPage ready={false} />,
    });
    startTour();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });
    expect(screen.queryByRole("status")).toBeNull();
    expect(runTour).not.toHaveBeenCalled();

    rerender(
      <TourProvider progress={null} activeProductSlugs={["infrastructure"]}>
        <StartButton />
        <GraphPage />
      </TourProvider>,
    );
    await settle();
    expect(runTour).toHaveBeenCalledTimes(1);
  });
});
