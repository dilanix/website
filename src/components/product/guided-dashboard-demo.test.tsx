import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuidedDashboardDemo } from "./guided-dashboard-demo";

const snapshot = {
  monthlySpendUsd: 48600,
  potentialSavingsUsd: 7300,
  spendTrend: [41200, 42800, 43350, 44950, 45100, 46800, 45950],
  breakdown: [
    { label: "EC2 & Compute", amountUsd: 21400 },
    { label: "S3 & Storage", amountUsd: 12800 },
  ],
  recommendation: {
    title: "AWS cost optimization opportunity detected",
    description: "Idle infrastructure is increasing cloud spend.",
    monthlySavingUsd: 7300,
    metrics: [{ label: "Optimization score", value: "72%" }],
  },
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("GuidedDashboardDemo", () => {
  it("labels sample data and lets visitors explore dashboard views", () => {
    render(<GuidedDashboardDemo productName="CostOps" snapshot={snapshot} />);

    expect(screen.getByText("Sample workspace")).toBeTruthy();
    expect(
      screen
        .getByRole("tab", { name: "Overview" })
        .getAttribute("aria-selected"),
    ).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "Costs" }));

    expect(
      screen.getByRole("tab", { name: "Costs" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByText("Cost by service")).toBeTruthy();
    expect(screen.getByText("$48,600")).toBeTruthy();
  });

  it("guides visitors automatically until they take control", () => {
    vi.useFakeTimers();
    render(<GuidedDashboardDemo productName="CostOps" snapshot={snapshot} />);

    act(() => vi.advanceTimersByTime(5500));
    expect(
      screen.getByRole("tab", { name: "Costs" }).getAttribute("aria-selected"),
    ).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "Health" }));
    act(() => vi.advanceTimersByTime(11000));

    expect(
      screen.getByRole("tab", { name: "Health" }).getAttribute("aria-selected"),
    ).toBe("true");
  });
});
