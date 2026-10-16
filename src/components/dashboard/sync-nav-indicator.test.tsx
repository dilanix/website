import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSyncIndicatorAction } from "@/app/dashboard/sync/actions";
import { SyncNavIndicator } from "./sync-nav-indicator";

vi.mock("@/app/dashboard/sync/actions", () => ({
  getSyncIndicatorAction: vi.fn(),
}));

afterEach(cleanup);

async function renderWith(
  state: Awaited<ReturnType<typeof getSyncIndicatorAction>>,
) {
  vi.mocked(getSyncIndicatorAction).mockResolvedValue(state);
  render(<SyncNavIndicator pathname="/dashboard" />);
  await act(async () => {});
}

describe("SyncNavIndicator", () => {
  it("shows a running or failing sync", async () => {
    await renderWith("running");
    expect(screen.getByRole("status", { name: "Sync running" })).toBeTruthy();
    cleanup();
    await renderWith("failing");
    expect(screen.getByRole("status", { name: "Sync failing" })).toBeTruthy();
  });

  it("shows nothing when all is well or unknown", async () => {
    await renderWith("healthy");
    expect(screen.queryByRole("status")).toBeNull();
    cleanup();
    await renderWith(null);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
