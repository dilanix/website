import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CoreSyncDatasetHealth,
  CoreSyncPolicy,
  CoreSyncRun,
} from "@/lib/core/api";
import { SyncPanel } from "./sync-panel";

const actions = vi.hoisted(() => ({
  cancelSyncAction: vi.fn(),
  getSyncJobAttemptsAction: vi.fn(),
  getSyncHealthAction: vi.fn(),
  getSyncRunAction: vi.fn(),
  listSyncRunsAction: vi.fn(),
  setSyncPolicyAction: vi.fn(),
  startSyncAction: vi.fn(),
}));

vi.mock("@/app/dashboard/integrations/actions", () => actions);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const enabledPolicy: CoreSyncPolicy = {
  id: "policy-1",
  connection_id: "connection-1",
  target_id: null,
  dataset: "inventory.resources",
  enabled: true,
  interval_seconds: 3 * 3600,
  next_run_at: "2099-09-06T20:00:00Z",
  created_at: "2026-09-06T10:00:00Z",
  updated_at: "2026-09-06T10:00:00Z",
};

const initialHealth: CoreSyncDatasetHealth[] = [
  {
    dataset: "inventory.resources",
    status: "delayed",
    last_successful_sync_at: "2026-09-06T10:00:00Z",
    policy_enabled: true,
    interval_seconds: 3 * 3600,
  },
];

const queuedRun: CoreSyncRun = {
  id: "run-1",
  organization_id: "organization-1",
  connection_id: "connection-1",
  trigger: "manual",
  status: "queued",
  created_at: "2026-09-07T10:00:00Z",
  started_at: null,
  finished_at: null,
};

function renderPanel() {
  render(
    <SyncPanel
      connectionId="connection-1"
      enabledCapabilitySlugs={["inventory.read"]}
      initialRuns={[]}
      initialTotal={0}
      initialPolicies={[enabledPolicy]}
      initialHealth={initialHealth}
    />,
  );
}

describe("SyncPanel automatic sync", () => {
  it("shows backend-projected health separately for each dataset", () => {
    renderPanel();

    expect(screen.getByText("Dataset sync health")).not.toBeNull();
    expect(screen.getByText("Delayed")).not.toBeNull();
    expect(screen.getByText("Every 3 hours")).not.toBeNull();
    expect(screen.getByText("Last successful")).not.toBeNull();
  });

  it("shows a compact summary and moves schedule controls into a modal", () => {
    renderPanel();

    expect(screen.getByText("1 of 1 schedule enabled")).not.toBeNull();
    expect(screen.getByText(/Next sync/)).not.toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Configure" }));

    expect(
      screen.getByRole("dialog", { name: "Configure automatic sync" }),
    ).not.toBeNull();
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      true,
    );
    expect(
      (screen.getByLabelText("Frequency") as HTMLSelectElement).value,
    ).toBe("10800");
  });

  it("saves a dataset toggle immediately and refreshes the compact summary", async () => {
    actions.setSyncPolicyAction.mockResolvedValue({
      data: { ...enabledPolicy, enabled: false, next_run_at: null },
    });
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Configure" }));
    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => {
      expect(actions.setSyncPolicyAction).toHaveBeenCalledWith("connection-1", {
        dataset: "inventory.resources",
        enabled: false,
        interval_seconds: 10800,
      });
    });
    await waitFor(() => {
      expect(screen.getByText("No schedules enabled")).not.toBeNull();
    });
  });

  it("uses backend automatic planning by default", async () => {
    actions.startSyncAction.mockResolvedValue({ data: queuedRun });
    renderPanel();

    fireEvent.click(screen.getAllByRole("button", { name: "Sync now" })[0]);

    expect(
      (screen.getByRole("radio", { name: /Automatic/ }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(screen.queryByRole("checkbox")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Start sync" }));

    await waitFor(() => {
      expect(actions.startSyncAction).toHaveBeenCalledWith(
        "connection-1",
        undefined,
      );
    });
  });

  it("keeps explicit dataset selection as an optional mode", async () => {
    actions.startSyncAction.mockResolvedValue({ data: queuedRun });
    renderPanel();

    fireEvent.click(screen.getAllByRole("button", { name: "Sync now" })[0]);
    fireEvent.click(screen.getByRole("radio", { name: /Select manually/ }));

    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "Start sync" }));

    await waitFor(() => {
      expect(actions.startSyncAction).toHaveBeenCalledWith("connection-1", [
        "inventory.resources",
      ]);
    });
  });
});
