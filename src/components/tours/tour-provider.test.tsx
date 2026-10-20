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
import { COST_GUIDE_KEY, costGuide } from "@/lib/guides/definitions/cost";
import {
  INTEGRATIONS_GUIDE_KEY,
  integrationsGuide,
} from "@/lib/guides/definitions/integrations";
import { costBudgetsTour } from "@/lib/tours/definitions/cost-budgets";
import { costOverviewTour } from "@/lib/tours/definitions/cost-overview";
import {
  INTEGRATIONS_TOUR_KEY,
  integrationsTour,
} from "@/lib/tours/definitions/integrations";
import type { TourProgress } from "@/lib/tours/types";
import type { TourRunOptions } from "./tour-runner";
import {
  TourProvider,
  usePageGuide,
  usePageTour,
  useTours,
} from "./tour-provider";

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

const INFRASTRUCTURE = [{ slug: "infrastructure", name: "Infrastructure" }];
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
    <TourProvider
      progress={progress}
      activeProducts={products.map((slug) => ({ slug, name: slug }))}
      hasOrganization={false}
    >
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
      <TourProvider
        progress={[]}
        activeProducts={INFRASTRUCTURE}
        hasOrganization={false}
      >
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
      <TourProvider
        progress={[]}
        activeProducts={INFRASTRUCTURE}
        hasOrganization={false}
      >
        <GraphPage />
      </TourProvider>,
    );
    expect(saveTourProgressAction).not.toHaveBeenCalled();
  });

  it("stops the running tour when its page goes away", async () => {
    const { rerender } = renderProvider();
    await settle();
    rerender(
      <TourProvider
        progress={[]}
        activeProducts={INFRASTRUCTURE}
        hasOrganization={false}
      >
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

    navigation.pathname = tour.route!;
    rerender(
      <TourProvider
        progress={progress}
        activeProducts={INFRASTRUCTURE}
        hasOrganization={false}
      >
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
      <TourProvider
        progress={null}
        activeProducts={INFRASTRUCTURE}
        hasOrganization={false}
      >
        <StartButton />
        <GraphPage />
      </TourProvider>,
    );
    await settle();
    expect(runTour).toHaveBeenCalledTimes(1);
  });
});

function IntegrationsPage({ autoOpen = true }: { autoOpen?: boolean }) {
  usePageGuide(INTEGRATIONS_GUIDE_KEY, { autoOpen });
  usePageTour(INTEGRATIONS_TOUR_KEY, { ready: true });
  return null;
}

function renderIntegrations(
  progress: TourProgress[] = [],
  page = <IntegrationsPage />,
) {
  navigation.pathname = "/dashboard/integrations";
  return render(
    <TourProvider progress={progress} activeProducts={[]} hasOrganization>
      {page}
    </TourProvider>,
  );
}

const guideDialog = () =>
  screen.queryByRole("dialog", { name: integrationsGuide.title });

describe("TourProvider guides", () => {
  it("opens a page's guide once on its own, ahead of the page's tour", async () => {
    renderIntegrations();
    await settle();

    expect(guideDialog()).toBeTruthy();
    expect(runTour).not.toHaveBeenCalled();
    expect(saveTourProgressAction).toHaveBeenCalledWith({
      tourKey: INTEGRATIONS_GUIDE_KEY,
      tourVersion: integrationsGuide.version,
      status: "in_progress",
      stepId: integrationsGuide.scenes[0].id,
    });

    // Closing it doesn't start the tour this visit, or reopen the guide.
    fireEvent.click(screen.getByRole("button", { name: "Close guide" }));
    await settle();
    expect(guideDialog()).toBeNull();
    expect(runTour).not.toHaveBeenCalled();
  });

  it("records a guide watched to the end and hands over to the page's tour", async () => {
    renderIntegrations();
    await settle();
    const last = integrationsGuide.scenes.length - 1;
    fireEvent.click(
      screen.getByRole("button", {
        name: `Scene ${last + 1}: ${integrationsGuide.scenes[last].title}`,
      }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(
        integrationsGuide.scenes[last].durationMs,
      );
    });
    expect(saveTourProgressAction).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tourKey: INTEGRATIONS_GUIDE_KEY,
        status: "completed",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Take the tour on the page/ }),
    );
    expect(guideDialog()).toBeNull();
    expect(runTour).toHaveBeenCalledTimes(1);
    expect(runTour.mock.calls[0][0]).toBe(integrationsTour);
  });

  it("leaves a watched guide closed, so the tour starts as usual", async () => {
    renderIntegrations([
      {
        tour_key: INTEGRATIONS_GUIDE_KEY,
        tour_version: integrationsGuide.version,
        status: "completed",
        step_id: null,
      },
    ]);
    await settle();

    expect(guideDialog()).toBeNull();
    expect(runTour).toHaveBeenCalledTimes(1);
    expect(runTour.mock.calls[0][0]).toBe(integrationsTour);
  });

  it("plays a guide on request, resuming at its stored scene", async () => {
    function PlayButton() {
      const tours = useTours();
      return (
        <button
          type="button"
          onClick={() => tours?.play(INTEGRATIONS_GUIDE_KEY)}
        >
          Play guide
        </button>
      );
    }
    renderIntegrations(
      [
        {
          tour_key: INTEGRATIONS_GUIDE_KEY,
          tour_version: integrationsGuide.version,
          status: "in_progress",
          step_id: integrationsGuide.scenes[2].id,
        },
      ],
      <>
        <IntegrationsPage autoOpen={false} />
        <PlayButton />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Play guide" }));

    expect(guideDialog()).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      integrationsGuide.scenes[2].title,
    );
  });
});

describe("TourProvider product guides", () => {
  function CostPage({ tour, guide }: { tour: string; guide?: boolean }) {
    usePageGuide(COST_GUIDE_KEY, { autoOpen: Boolean(guide) });
    usePageTour(tour, { ready: true });
    return null;
  }
  const COST = [{ slug: "cost", name: "Cost" }];

  it("holds back only the tour of the page the guide opened on", async () => {
    navigation.pathname = "/dashboard/products/cost";
    const { rerender } = render(
      <TourProvider progress={[]} activeProducts={COST} hasOrganization>
        <CostPage tour={costOverviewTour.key} guide />
      </TourProvider>,
    );
    await settle();
    expect(screen.getByRole("dialog", { name: costGuide.title })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close guide" }));
    await settle();
    expect(runTour).not.toHaveBeenCalled();

    navigation.pathname = "/dashboard/products/cost/budgets";
    rerender(
      <TourProvider progress={[]} activeProducts={COST} hasOrganization>
        <CostPage tour={costBudgetsTour.key} />
      </TourProvider>,
    );
    await settle();
    expect(runTour).toHaveBeenCalledTimes(1);
    expect(runTour.mock.calls[0][0]).toBe(costBudgetsTour);
  });
});
