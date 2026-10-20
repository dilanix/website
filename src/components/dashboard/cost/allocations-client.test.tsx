import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAllocationBreakdownAction,
  updateAllocationAction,
} from "@/app/dashboard/products/cost-actions";
import type { CoreAllocation, CoreAllocationBreakdown } from "@/lib/core/api";
import { tourTargetSelector } from "@/lib/tours/anchors";
import {
  COST_ALLOCATIONS_TOUR_KEY,
  costAllocationsAnchors,
} from "@/lib/tours/definitions/cost-allocations";
import { AllocationsClient } from "./allocations-client";

const { usePageTour } = vi.hoisted(() => ({ usePageTour: vi.fn() }));
vi.mock("@/components/tours/tour-provider", () => ({ usePageTour }));

vi.mock("@/app/dashboard/products/cost-actions", () => ({
  createAllocationAction: vi.fn(),
  deleteAllocationAction: vi.fn(),
  getAllocationBreakdownAction: vi.fn(),
  updateAllocationAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

const allocation: CoreAllocation = {
  id: "10000000-0000-4000-8000-000000000001",
  organization_id: "20000000-0000-4000-8000-000000000001",
  name: "Platform team",
  target_label: "Platform",
  priority: 0,
  enabled: true,
  scope: [
    {
      dimension: "tag",
      tag_key: "team",
      operator: "eq",
      value: "platform",
    },
  ],
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

const breakdown: CoreAllocationBreakdown = {
  period_start: "2026-09-01T00:00:00Z",
  period_end: "2026-09-12T00:00:00Z",
  items: [
    { target_label: "Platform", currency: "USD", amount: "80.000000" },
    { target_label: "Unallocated", currency: "USD", amount: "20.000000" },
  ],
};

function renderClient() {
  return render(
    <AllocationsClient
      initialAllocations={[allocation]}
      initialBreakdown={breakdown}
      initialPeriodStart="2026-09-01"
      initialPeriodEnd="2026-09-11"
      connectionId={null}
      targetId={null}
    />,
  );
}

describe("AllocationsClient", () => {
  it("renders allocated coverage and refreshes the selected period", async () => {
    vi.mocked(getAllocationBreakdownAction).mockResolvedValue({
      data: breakdown,
    });
    renderClient();

    expect(screen.getByText("80.0% of total")).toBeTruthy();
    expect(screen.getByText("Needs allocation")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Run breakdown" }));

    await waitFor(() =>
      expect(getAllocationBreakdownAction).toHaveBeenCalledWith({
        periodStart: "2026-09-01T00:00:00.000Z",
        periodEnd: "2026-09-12T00:00:00.000Z",
        metric: "effective_cost",
        connectionId: null,
        targetId: null,
      }),
    );
  }, 20_000);

  it("automatically refreshes breakdown after a rule changes", async () => {
    vi.mocked(updateAllocationAction).mockResolvedValue({
      data: { ...allocation, enabled: false },
    });
    vi.mocked(getAllocationBreakdownAction).mockResolvedValue({
      data: breakdown,
    });
    renderClient();

    fireEvent.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() =>
      expect(updateAllocationAction).toHaveBeenCalledWith(allocation.id, {
        enabled: false,
      }),
    );
    await waitFor(() =>
      expect(getAllocationBreakdownAction).toHaveBeenCalledTimes(1),
    );
  }, 20_000);

  describe("product tour", () => {
    const offer = () => usePageTour.mock.calls.at(-1);
    const anchor = (name: keyof typeof costAllocationsAnchors) =>
      document.querySelector(tourTargetSelector(costAllocationsAnchors[name]));

    it("offers the Allocations tour without rules or cost data, leaving out the breakdown", () => {
      render(
        <AllocationsClient
          initialAllocations={[]}
          initialBreakdown={null}
          initialPeriodStart="2026-09-01"
          initialPeriodEnd="2026-09-11"
          connectionId={null}
          targetId={null}
        />,
      );
      expect(offer()).toEqual([COST_ALLOCATIONS_TOUR_KEY, { ready: true }]);
      expect(anchor("create")).not.toBeNull();
      expect(anchor("controls")).toBeNull();
      expect(anchor("breakdown")).toBeNull();
      expect(anchor("rule")).toBeNull();
    });

    it("waits while a breakdown runs", async () => {
      let resolve: (value: {
        data: CoreAllocationBreakdown;
      }) => void = () => {};
      vi.mocked(getAllocationBreakdownAction).mockReturnValue(
        new Promise((settle) => {
          resolve = settle;
        }),
      );
      renderClient();
      expect(offer()).toEqual([COST_ALLOCATIONS_TOUR_KEY, { ready: true }]);

      fireEvent.click(screen.getByRole("button", { name: "Run breakdown" }));
      await waitFor(() =>
        expect(offer()).toEqual([COST_ALLOCATIONS_TOUR_KEY, { ready: false }]),
      );

      resolve({ data: breakdown });
      await waitFor(() =>
        expect(offer()).toEqual([COST_ALLOCATIONS_TOUR_KEY, { ready: true }]),
      );
    });

    it("is not ready while a rule dialog is open", () => {
      renderClient();
      fireEvent.click(
        screen.getByRole("button", { name: "Create allocation" }),
      );
      expect(offer()).toEqual([COST_ALLOCATIONS_TOUR_KEY, { ready: false }]);
    });
  });
});
