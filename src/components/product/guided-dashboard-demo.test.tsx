import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuidedDashboardDemo } from "./guided-dashboard-demo";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function tour() {
  return within(screen.getByRole("tablist", { name: "Product tour" }));
}

function selected(name: string) {
  return tour()
    .getByRole("tab", { name: new RegExp(name) })
    .getAttribute("aria-selected");
}

describe("GuidedDashboardDemo", () => {
  it("opens on the Overview of the Dilanix workspace", () => {
    render(<GuidedDashboardDemo />);

    expect(selected("Overview")).toBe("true");
    expect(screen.getByText("Active workspace")).toBeTruthy();
    expect(screen.getAllByText("Dilanix").length).toBeGreaterThan(0);
    expect(screen.getByText("Cloud connections")).toBeTruthy();
  });

  it("shows a ranked recommendation and its verified How to fix guide", () => {
    render(<GuidedDashboardDemo />);
    fireEvent.click(tour().getByRole("tab", { name: /Recommendations/ }));

    expect(
      screen.getByText("Rightsize RDS instance orders-db (db.r6g.2xlarge)"),
    ).toBeTruthy();
    expect(screen.getByText("Before you continue")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "How to fix" }));
    const guide = screen.getByRole("dialog", {
      name: "How to fix: Downsize to db.r6g.xlarge",
    });
    fireEvent.click(within(guide).getByRole("tab", { name: "AWS CLI" }));
    expect(within(guide).getByText(/aws rds modify-db-instance/)).toBeTruthy();
  });

  it("lists every dataset on the Sync page", () => {
    render(<GuidedDashboardDemo />);
    fireEvent.click(tour().getByRole("tab", { name: /Sync/ }));

    expect(screen.getByText("Dataset sync health")).toBeTruthy();
    expect(screen.getByText("billing.cost_usage")).toBeTruthy();
  });

  it("walks through the screens until the visitor takes over", () => {
    vi.useFakeTimers();
    render(<GuidedDashboardDemo />);

    act(() => vi.advanceTimersByTime(9000));
    expect(selected("Cost")).toBe("true");

    fireEvent.click(tour().getByRole("tab", { name: /Sync/ }));
    act(() => vi.advanceTimersByTime(20000));
    expect(selected("Sync")).toBe("true");
  });
});
