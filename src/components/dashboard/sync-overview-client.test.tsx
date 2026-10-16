import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreIntegrationConnection } from "@/lib/core/api";
import {
  SyncOverviewClient,
  type ConnectionSyncData,
} from "./sync-overview-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("./sync-panel", () => ({
  SyncPanel: ({ connectionId }: { connectionId: string }) => (
    <div data-testid="sync-panel">{connectionId}</div>
  ),
}));

afterEach(cleanup);

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
