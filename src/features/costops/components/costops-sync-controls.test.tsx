import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCostOps } from "../costops-context";
import type { CostOpsIntegration, SyncRun } from "../types";
import { CostOpsSyncControls } from "./costops-sync-controls";

vi.mock("../costops-context", () => ({ useCostOps: vi.fn() }));

const mockedUseCostOps = vi.mocked(useCostOps);

function integration(
  overrides: Partial<CostOpsIntegration> = {},
): CostOpsIntegration {
  return {
    id: "integration-1",
    organizationId: "organization-1",
    provider: "aws" as const,
    name: "AWS Production",
    status: "connected" as const,
    externalAccountId: "123456789012",
    roleArn: null,
    createdAt: "2026-08-01T00:00:00Z",
    lastSyncedAt: "2026-08-19T19:56:00Z",
    lastSyncStatus: "succeeded" as const,
    autoSyncIntervalMinutes: null,
    nextSyncAt: null,
    errorCode: null,
    errorMessage: null,
    accounts: [],
    ...overrides,
  };
}

function context(syncNow = vi.fn().mockResolvedValue(undefined)): {
  integrations: CostOpsIntegration[];
  activeSyncs: Record<string, SyncRun>;
  syncStarting: Set<string>;
  syncNow: typeof syncNow;
} {
  return {
    integrations: [integration()],
    activeSyncs: {},
    syncStarting: new Set<string>(),
    syncNow,
  };
}

function useContextMock(value = context()) {
  mockedUseCostOps.mockReturnValue(
    value as unknown as ReturnType<typeof useCostOps>,
  );
}

describe("CostOpsSyncControls", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T20:00:00Z"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders the backend last-sync timestamp as relative time", () => {
    useContextMock();
    render(<CostOpsSyncControls />);
    expect(screen.getByText("Synced 4 min ago")).toBeInTheDocument();
  });

  it("prevents duplicate sync requests while starting", async () => {
    let finish!: () => void;
    const syncNow = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    useContextMock(context(syncNow));
    render(<CostOpsSyncControls />);
    const button = screen.getByRole("button", { name: "Sync now" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(syncNow).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Syncing..." })).toBeDisabled();
    await act(async () => finish());
  });

  it("shows a safe retry state when starting sync fails", async () => {
    const syncNow = vi.fn().mockRejectedValue(new Error("raw backend error"));
    useContextMock(context(syncNow));
    render(<CostOpsSyncControls />);
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Sync now" })),
    );
    expect(screen.getByText("Sync failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    expect(screen.queryByText("raw backend error")).not.toBeInTheDocument();
  });

  it("refreshes page data after the initiated backend run succeeds", async () => {
    const onSyncCompleted = vi.fn();
    const value = context();
    mockedUseCostOps.mockImplementation(
      () => value as unknown as ReturnType<typeof useCostOps>,
    );
    const view = render(
      <CostOpsSyncControls onSyncCompleted={onSyncCompleted} />,
    );
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: "Sync now" })),
    );
    value.activeSyncs = {
      "integration-1": {
        id: "run-1",
        integrationId: "integration-1",
        status: "running",
        recordsProcessed: 0,
        stage: "metrics",
        progressCurrent: 2,
        progressTotal: 5,
        progressMessage: "Collecting resource metrics",
        heartbeatAt: "2026-08-19T20:00:00Z",
        errorCode: null,
        errorMessage: null,
      },
    };
    view.rerender(<CostOpsSyncControls onSyncCompleted={onSyncCompleted} />);
    expect(screen.getByText("Collecting resource metrics")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    value.activeSyncs = {};
    value.integrations = [
      integration({ lastSyncedAt: "2026-08-19T20:00:00Z" }),
    ];
    view.rerender(<CostOpsSyncControls onSyncCompleted={onSyncCompleted} />);
    expect(onSyncCompleted).toHaveBeenCalledTimes(1);
  });
});
