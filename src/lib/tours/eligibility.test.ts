import { describe, expect, it } from "vitest";
import { startIndex, tourGroups, tourState } from "./eligibility";
import type { TourDefinition, TourProgress } from "./types";

const tour: TourDefinition = {
  key: "widgets.board",
  version: 2,
  title: "Widgets",
  description: "Widgets board",
  product: "widgets",
  route: "/dashboard/products/widgets",
  steps: [
    { id: "welcome", title: "Welcome", body: "Hi" },
    { id: "search", target: "widgets.search", title: "Search", body: "Find" },
    { id: "finish", title: "Done", body: "Bye" },
  ],
};

function progress(overrides: Partial<TourProgress>): TourProgress {
  return {
    tour_key: tour.key,
    tour_version: 2,
    status: "in_progress",
    step_id: null,
    ...overrides,
  };
}

describe("tour eligibility", () => {
  it("groups tours like the sidebar: Workspace, products, Manage", () => {
    const gadgets = { ...tour, key: "gadgets.board", product: "gadgets" };
    const widgetsList = { ...tour, key: "widgets.list" };
    const inbox: TourDefinition = {
      ...tour,
      key: "workspace.inbox",
      product: undefined,
      section: "workspace",
    };
    const keys: TourDefinition = {
      ...tour,
      key: "manage.keys",
      product: undefined,
      section: "manage",
    };
    const products = [
      { slug: "gadgets", name: "Gadgets" },
      { slug: "widgets", name: "Widgets" },
      { slug: "spare", name: "Spare" },
    ];

    expect(
      tourGroups([keys, tour, gadgets, inbox, widgetsList], products, true),
    ).toEqual([
      { key: "section:workspace", name: "Workspace", tours: [inbox] },
      { key: "product:gadgets", name: "Gadgets", tours: [gadgets] },
      { key: "product:widgets", name: "Widgets", tours: [tour, widgetsList] },
      { key: "section:manage", name: "Manage", tours: [keys] },
    ]);
    // Products the organization can't use, and platform pages without an
    // organization, offer nothing.
    expect(tourGroups([tour, inbox, keys], [], false)).toEqual([]);
  });

  it("treats a missing or older-version record as new", () => {
    expect(tourState(tour, undefined)).toBe("new");
    expect(
      tourState(tour, progress({ tour_version: 1, status: "completed" })),
    ).toBe("new");
    expect(tourState(tour, progress({ status: "completed" }))).toBe(
      "completed",
    );
    expect(tourState(tour, progress({ status: "dismissed" }))).toBe(
      "dismissed",
    );
    // A record from a newer definition (e.g. after a rollback) is not new.
    expect(
      tourState(tour, progress({ tour_version: 3, status: "completed" })),
    ).toBe("completed");
  });

  it("resumes an unfinished run at its stored step", () => {
    expect(startIndex(tour, progress({ step_id: "search" }))).toBe(1);
    expect(startIndex(tour, progress({ step_id: "removed-step" }))).toBe(0);
    expect(
      startIndex(tour, progress({ status: "completed", step_id: "search" })),
    ).toBe(0);
    expect(
      startIndex(tour, progress({ tour_version: 1, step_id: "search" })),
    ).toBe(0);
    expect(startIndex(tour, undefined)).toBe(0);
  });
});
