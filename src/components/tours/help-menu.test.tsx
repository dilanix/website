import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { costBudgetsTour } from "@/lib/tours/definitions/cost-budgets";
import {
  INFRASTRUCTURE_GRAPH_TOUR_KEY as KEY,
  infrastructureGraphTour as tour,
} from "@/lib/tours/definitions/infrastructure-graph";
import { HelpMenu } from "./help-menu";
import { TourProvider } from "./tour-provider";

const { navigation, push, runTour } = vi.hoisted(() => ({
  navigation: { pathname: "/dashboard/settings" },
  push: vi.fn(),
  runTour: vi.fn(() => ({ stop: vi.fn() })),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push }),
}));
vi.mock("@/app/dashboard/tour-actions", () => ({
  saveTourProgressAction: vi.fn().mockResolvedValue({}),
}));
vi.mock("./tour-runner", () => ({ runTour }));

const INFRASTRUCTURE = { slug: "infrastructure", name: "Infrastructure" };
const COST = { slug: "cost", name: "Cost" };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  navigation.pathname = "/dashboard/settings";
});

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Help & Support" }));
}

function group(name: string) {
  return screen.getByRole("button", { name: new RegExp(`^${name}\\b`) });
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
        activeProducts={[INFRASTRUCTURE]}
        hasOrganization={false}
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
      <TourProvider
        progress={[]}
        activeProducts={[INFRASTRUCTURE]}
        hasOrganization={false}
      >
        <HelpMenu />
      </TourProvider>,
    );
    openMenu();

    // Both Infrastructure tours are new.
    expect(screen.getAllByText("New")).toHaveLength(2);
    expect(
      screen.getByRole("button", {
        name: "Start the Infrastructure Graph tour",
      }),
    ).toBeTruthy();
  });

  it("hides tours for products the organization cannot use", () => {
    render(
      <TourProvider
        progress={[]}
        activeProducts={[COST]}
        hasOrganization={false}
      >
        <HelpMenu />
      </TourProvider>,
    );
    openMenu();

    expect(screen.getByText("Cost Overview")).toBeTruthy();
    expect(screen.queryByText("Infrastructure")).toBeNull();
    expect(screen.queryByText("Infrastructure Graph")).toBeNull();
  });

  it("groups tours by product and opens the current page's group", () => {
    navigation.pathname = "/dashboard/products/cost/budgets/new";
    render(
      <TourProvider
        progress={[
          {
            tour_key: costBudgetsTour.key,
            tour_version: costBudgetsTour.version,
            status: "completed",
            step_id: null,
          },
        ]}
        activeProducts={[INFRASTRUCTURE, COST]}
        hasOrganization={false}
      >
        <HelpMenu />
      </TourProvider>,
    );
    openMenu();

    // Each group says how many of its tours there are, and how many are new.
    expect(group("Infrastructure").textContent).toBe(
      "Infrastructure2 new2 tours",
    );
    expect(group("Cost").textContent).toBe("Cost6 new7 tours");
    expect(group("Cost").getAttribute("aria-expanded")).toBe("true");
    expect(group("Infrastructure").getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("list", { name: "Cost tours" })).toBeTruthy();
    expect(screen.queryByText("Infrastructure Graph")).toBeNull();

    // One group open at a time.
    fireEvent.click(group("Infrastructure"));
    expect(screen.getByText("Infrastructure Graph")).toBeTruthy();
    expect(screen.queryByText("Cost Budgets")).toBeNull();

    fireEvent.click(group("Infrastructure"));
    expect(screen.queryByText("Infrastructure Graph")).toBeNull();
  });

  it("puts platform tours under Workspace and opens it on their page", () => {
    navigation.pathname = "/dashboard/recommendations";
    render(
      <TourProvider progress={[]} activeProducts={[COST]} hasOrganization>
        <HelpMenu />
      </TourProvider>,
    );
    openMenu();

    expect(group("Workspace").textContent).toBe("Workspace1 new1 tour");
    expect(group("Workspace").getAttribute("aria-expanded")).toBe("true");
    expect(group("Cost").getAttribute("aria-expanded")).toBe("false");
    expect(
      screen.getByRole("button", { name: "Start the Recommendations tour" }),
    ).toBeTruthy();
  });

  it("keeps every group closed away from a product's pages", () => {
    render(
      <TourProvider
        progress={[]}
        activeProducts={[INFRASTRUCTURE, COST]}
        hasOrganization={false}
      >
        <HelpMenu />
      </TourProvider>,
    );
    openMenu();

    expect(group("Cost").getAttribute("aria-expanded")).toBe("false");
    expect(group("Infrastructure").getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("list", { name: /tours$/ })).toBeNull();
  });

  it("leaves out the tours section when no tour applies", () => {
    render(
      <TourProvider progress={[]} activeProducts={[]} hasOrganization={false}>
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
