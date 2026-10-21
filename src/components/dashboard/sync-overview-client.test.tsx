import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import type { CoreIntegrationConnection } from "@/lib/core/api";
import { tourTargetSelector } from "@/lib/tours/anchors";
import {
  SYNC_TOUR_KEY,
  syncActions,
  syncAnchors,
} from "@/lib/tours/definitions/sync";
import {
  SyncOverviewClient,
  type ConnectionSyncData,
} from "./sync-overview-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("./sync-panel", () => ({
  SyncPanel: ({
    connectionId,
    tourRequest,
  }: {
    connectionId: string;
    tourRequest?: string | null;
  }) => (
    <div data-testid="sync-panel" data-request={tourRequest ?? ""}>
      {connectionId}
    </div>
  ),
}));

const { usePageTour } = vi.hoisted(() => ({ usePageTour: vi.fn() }));
vi.mock("@/components/tours/tour-provider", () => ({ usePageTour }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function item(
  id: string,
  name: string,
  overrides: Partial<ConnectionSyncData> = {},
): ConnectionSyncData {
  return {
    connection: {
      id,
      name,
      status: "connected",
      last_synced_at: "2026-10-16T08:00:00Z",
    } as CoreIntegrationConnection,
    integrationName: "Amazon Web Services",
    integrationSlug: "aws",
    error: null,
    enabledCapabilitySlugs: ["inventory.read"],
    targets: [],
    runs: [],
    runsTotal: 0,
    policies: [],
    health: [
      {
        dataset: "inventory.resources",
        status: "healthy",
        last_successful_sync_at: null,
        policy_enabled: true,
        interval_seconds: 3600,
      },
    ],
    ...overrides,
  };
}

describe("SyncOverviewClient", () => {
  it("opens a single connection straight away", () => {
    render(
      <SyncOverviewClient
        items={[item("c1", "Prod")]}
        activeOrganizationCapabilityCodes={[]}
      />,
    );

    expect(screen.getByTestId("sync-panel").textContent).toBe("c1");
    expect(
      screen
        .getByRole("link", { name: /Open connection/ })
        .getAttribute("href"),
    ).toBe("/dashboard/integrations/c1?tab=activity");
  });

  it("lists several connections collapsed with their state, each opening its own panel", () => {
    render(
      <SyncOverviewClient
        items={[
          item("c1", "Prod"),
          item("c2", "Dev", {
            health: [
              {
                dataset: "billing.cost_usage",
                status: "failing",
                last_successful_sync_at: null,
                policy_enabled: true,
                interval_seconds: 3600,
              },
            ],
          }),
          item("c3", "Old", {
            error: "This connection's sync status could not be loaded.",
          }),
        ]}
        activeOrganizationCapabilityCodes={[]}
      />,
    );

    expect(screen.queryByTestId("sync-panel")).toBeNull();
    expect(screen.getByRole("article", { name: "Prod" }).textContent).toContain(
      "Healthy",
    );
    expect(screen.getByRole("article", { name: "Prod" }).textContent).toContain(
      "1 / 1",
    );
    expect(screen.getByRole("article", { name: "Dev" }).textContent).toContain(
      "Failing",
    );
    expect(screen.getByRole("article", { name: "Old" }).textContent).toContain(
      "Unavailable",
    );

    fireEvent.click(screen.getByRole("button", { name: /^Dev/ }));
    expect(screen.getByTestId("sync-panel").textContent).toBe("c2");
    fireEvent.click(screen.getByRole("button", { name: /^Old/ }));
    expect(screen.getByRole("alert").textContent).toContain(
      "could not be loaded",
    );
  });

  it("points to Integrations when there is nothing to sync", () => {
    render(
      <SyncOverviewClient items={[]} activeOrganizationCapabilityCodes={[]} />,
    );

    expect(
      screen.getByRole("link", { name: "Go to Integrations" }),
    ).toBeTruthy();
  });
});

describe("SyncOverviewClient product tour", () => {
  const offer = () => usePageTour.mock.calls.at(-1);
  const run = (action: string) => {
    let cleanup: (() => void) | false | void = undefined;
    act(() => {
      cleanup = offer()?.[1].actions[action]();
    });
    return cleanup as (() => void) | false | void;
  };
  const panels = () => screen.queryAllByTestId("sync-panel");

  it("opens the first connection's panel and its dialogs for the panel steps", () => {
    render(
      <SyncOverviewClient
        items={[
          item("c1", "Prod", { runs: [{ id: "r1" } as never] }),
          item("c2", "Dev"),
        ]}
        activeOrganizationCapabilityCodes={["aws.inventory.read"]}
      />,
    );
    expect(offer()?.[0]).toBe(SYNC_TOUR_KEY);
    expect(offer()?.[1].available).toBe(true);
    for (const name of [
      "connection",
      "synced",
      "datasets",
      "state",
      "actions",
    ] as const)
      expect(
        document.querySelectorAll(tourTargetSelector(syncAnchors[name])),
      ).toHaveLength(2);
    expect(panels()).toHaveLength(0);

    run(syncActions.openRow);
    expect(panels().map((panel) => panel.textContent)).toEqual(["c1"]);

    const close = run(syncActions.schedules);
    expect(panels()[0].getAttribute("data-request")).toBe("schedules");
    act(() => (close as () => void)());
    expect(panels()[0].getAttribute("data-request")).toBe("");

    run(syncActions.latestRun);
    expect(panels()[0].getAttribute("data-request")).toBe("latest-run");
  });

  it("skips the dialog and run steps the first connection can't show", () => {
    render(
      <SyncOverviewClient
        items={[item("c1", "Prod")]}
        activeOrganizationCapabilityCodes={[]}
      />,
    );
    // No organization grant for its datasets, and no runs yet.
    expect(run(syncActions.schedules)).toBe(false);
    expect(run(syncActions.syncNow)).toBe(false);
    expect(run(syncActions.latestRun)).toBe(false);
  });

  it("withdraws the tour when there is no connection", () => {
    render(
      <SyncOverviewClient items={[]} activeOrganizationCapabilityCodes={[]} />,
    );
    expect(offer()?.[1].available).toBe(false);
  });
});
