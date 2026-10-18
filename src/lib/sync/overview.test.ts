import { describe, expect, it } from "vitest";
import type { CoreSyncDatasetHealth, CoreSyncRun } from "@/lib/core/api";
import { combinedSyncState, connectionSyncState } from "./overview";

function run(status: CoreSyncRun["status"]): CoreSyncRun {
  return {
    id: status,
    organization_id: "o",
    connection_id: "c",
    trigger: "manual",
    status,
    created_at: "2026-10-16T00:00:00Z",
    started_at: null,
    finished_at: null,
  };
}

function health(
  status: CoreSyncDatasetHealth["status"],
): CoreSyncDatasetHealth {
  return {
    dataset: `d-${status}`,
    status,
    last_successful_sync_at: null,
    policy_enabled: true,
    interval_seconds: 3600,
  };
}

describe("connectionSyncState", () => {
  it("prefers a run in flight, then the worst dataset health", () => {
    expect(connectionSyncState([run("running")], [health("failing")])).toBe(
      "running",
    );
    expect(
      connectionSyncState(
        [run("succeeded")],
        [health("healthy"), health("failing")],
      ),
    ).toBe("failing");
    expect(
      connectionSyncState([], [health("healthy"), health("delayed")]),
    ).toBe("attention");
    expect(connectionSyncState([], [health("never_synced")])).toBe(
      "never_synced",
    );
    expect(
      connectionSyncState([], [health("healthy"), health("never_synced")]),
    ).toBe("healthy");
    expect(connectionSyncState([], [])).toBe("idle");
  });
});

describe("combinedSyncState", () => {
  it("shows the most urgent state across connections", () => {
    expect(combinedSyncState(["healthy", "failing", "running"])).toBe(
      "running",
    );
    expect(combinedSyncState(["healthy", "attention"])).toBe("attention");
    expect(combinedSyncState([])).toBe("idle");
  });
});
