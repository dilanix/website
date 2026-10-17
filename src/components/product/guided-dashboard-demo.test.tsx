import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuidedDashboardDemo } from "./guided-dashboard-demo";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function selected(name: string) {
  return screen.getByRole("tab", { name }).getAttribute("aria-selected");
}

describe("GuidedDashboardDemo", () => {
  it("labels sample data and lets visitors explore the product views", () => {
    render(<GuidedDashboardDemo />);

    expect(screen.getByText("Sample data")).toBeTruthy();
    expect(selected("Cost")).toBe("true");
    expect(screen.getByText("Cost by service")).toBeTruthy();
    expect(screen.getByText("$43,420")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Recommendations" }));
    expect(selected("Recommendations")).toBe("true");
    expect(
      screen.getByText(/aws rds modify-db-instance --db-instance-identifier/),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Terraform" }));
    expect(screen.getByText(/resource "aws_db_instance"/)).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Sync" }));
    expect(screen.getByText("Runtime Interactions")).toBeTruthy();
  });

  it("shows the evidence behind the selected graph node", () => {
    render(<GuidedDashboardDemo />);
    fireEvent.click(screen.getByRole("tab", { name: "Infrastructure" }));

    fireEvent.click(screen.getByRole("button", { name: "orders-db" }));
    expect(
      screen.getByText("Used by orders-api and billing-worker"),
    ).toBeTruthy();
  });

  it("guides visitors automatically until they take control", () => {
    vi.useFakeTimers();
    render(<GuidedDashboardDemo />);

    act(() => vi.advanceTimersByTime(7000));
    expect(selected("Recommendations")).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "Sync" }));
    act(() => vi.advanceTimersByTime(14000));
    expect(selected("Sync")).toBe("true");
  });
});
