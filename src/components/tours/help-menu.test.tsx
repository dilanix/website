import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INFRASTRUCTURE_GRAPH_TOUR_KEY as KEY,
  infrastructureGraphTour as tour,
} from "@/lib/tours/definitions/infrastructure-graph";
import { HelpMenu } from "./help-menu";
import { TourProvider } from "./tour-provider";

const { push, runTour } = vi.hoisted(() => ({
  push: vi.fn(),
  runTour: vi.fn(() => ({ stop: vi.fn() })),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/settings",
  useRouter: () => ({ push }),
}));
vi.mock("@/app/dashboard/tour-actions", () => ({
  saveTourProgressAction: vi.fn().mockResolvedValue({}),
}));
vi.mock("./tour-runner", () => ({ runTour }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Help & Support" }));
}

describe("HelpMenu", () => {
  it("lists the organization's tours with their state and restarts one", () => {
    render(
      <TourProvider
        progress={[
          {
            tour_key: KEY,
            tour_version: tour.version,
            status: "completed",
            step_id: null,
          },
        ]}
        activeProductSlugs={["infrastructure"]}
      >
        <HelpMenu />
      </TourProvider>,
    );
    openMenu();

    expect(screen.getByText("Infrastructure Graph")).toBeTruthy();
    expect(screen.getByText("Completed")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Restart the Infrastructure Graph tour",
      }),
    );

    // Not on the tour's page: it navigates there first, and the menu closes.
    expect(push).toHaveBeenCalledWith(tour.route);
    expect(screen.queryByRole("region", { name: "Help & Support" })).toBeNull();
  });

  it("offers a never-seen tour as new", () => {
    render(
      <TourProvider progress={[]} activeProductSlugs={["infrastructure"]}>
        <HelpMenu />
      </TourProvider>,
    );
    openMenu();

    expect(screen.getByText("New")).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Start the Infrastructure Graph tour",
      }),
    ).toBeTruthy();
  });

  it("hides tours for products the organization cannot use", () => {
    render(
      <TourProvider progress={[]} activeProductSlugs={["cost"]}>
        <HelpMenu />
      </TourProvider>,
    );
    openMenu();

    expect(screen.getByText("Cost Overview")).toBeTruthy();
    expect(screen.queryByText("Infrastructure Graph")).toBeNull();
  });

  it("leaves out the tours section when no tour applies", () => {
    render(
      <TourProvider progress={[]} activeProductSlugs={[]}>
        <HelpMenu />
      </TourProvider>,
    );
    openMenu();

    expect(screen.queryByText("Product tours")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Documentation" }).getAttribute("href"),
    ).toBe("/dashboard/docs");
    expect(screen.getByRole("link", { name: "Contact support" })).toBeTruthy();
  });

  it("closes on Escape and returns focus to its button", () => {
    render(<HelpMenu />);
    openMenu();
    const button = screen.getByRole("button", { name: "Help & Support" });
    expect(button.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
  });
});
