import {
  act,
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
  costAllocationsActions,
  costAllocationsAnchors,
} from "@/lib/tours/definitions/cost-allocations";
import { allocationBreakdownCsv } from "./allocation-breakdown-panel";
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

const shadowed: CoreAllocation = {
  ...allocation,
  id: "10000000-0000-4000-8000-000000000002",
  name: "Platform leftovers",
  priority: 5,
};

const breakdown: CoreAllocationBreakdown = {
  period_start: "2026-09-01T00:00:00Z",
  period_end: "2026-09-12T00:00:00Z",
  metric: "effective_cost",
  items: [
    { target_label: "Platform", currency: "USD", amount: "80.000000" },
    { target_label: "Unallocated", currency: "USD", amount: "20.000000" },
  ],
  rules: [
    {
      allocation_id: allocation.id,
      name: allocation.name,
      target_label: "Platform",
      currency: "USD",
      amount: "80.000000",
    },
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

  it("shows what each rule claimed and flags a rule that claims nothing", () => {
    render(
      <AllocationsClient
        initialAllocations={[shadowed, allocation]}
        initialBreakdown={breakdown}
        initialPeriodStart="2026-09-01"
        initialPeriodEnd="2026-09-11"
        connectionId={null}
        targetId={null}
      />,
    );

    expect(screen.getByText(/Claimed in this period: 80\.00/)).toBeTruthy();
    expect(screen.getByText(/Claims nothing in this period/)).toBeTruthy();
    // Evaluation order: priority 0 before priority 5.
    const names = screen
      .getAllByText(/^Platform (team|leftovers)$/)
      .map((node) => node.textContent);
    expect(names).toEqual(["Platform team", "Platform leftovers"]);
  });

  it("exports the breakdown as CSV with spreadsheet formulas neutralised", () => {
    const csv = allocationBreakdownCsv({
      ...breakdown,
      items: [
        { target_label: "=HYPERLINK()", currency: "USD", amount: "-5.000000" },
      ],
      rules: [],
    });

    expect(csv.split("\r\n")).toEqual([
      "level,allocation,target_label,currency,amount",
      "target,,'=HYPERLINK(),USD,-5.000000",
    ]);
  });

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
      expect(offer()?.[0]).toBe(COST_ALLOCATIONS_TOUR_KEY);
      expect(offer()?.[1].ready).toBe(true);
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
      expect(offer()?.[1].ready).toBe(true);

      fireEvent.click(screen.getByRole("button", { name: "Run breakdown" }));
      await waitFor(() => expect(offer()?.[1].ready).toBe(false));

      resolve({ data: breakdown });
      await waitFor(() => expect(offer()?.[1].ready).toBe(true));
    });

    it("is not ready while a rule dialog is open", () => {
      renderClient();
      fireEvent.click(
        screen.getByRole("button", { name: "Create allocation" }),
      );
      expect(offer()?.[1].ready).toBe(false);
    });

    it("opens an empty create form for the tour's form steps, and closes it unsaved", () => {
      renderClient();
      let close: (() => void) | void = undefined;
      act(() => {
        close = offer()?.[1].actions[costAllocationsActions.openForm]();
      });

      expect(
        screen.getByRole("dialog", { name: "Create allocation" }),
      ).toBeTruthy();
      const formAnchors = (
        Object.keys(
          costAllocationsAnchors,
        ) as (keyof typeof costAllocationsAnchors)[]
      ).filter((name) => name.startsWith("form"));
      expect(formAnchors.length).toBeGreaterThan(0);
      for (const name of formAnchors) expect(anchor(name)).not.toBeNull();

      act(() => (close as (() => void) | void)?.());
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
