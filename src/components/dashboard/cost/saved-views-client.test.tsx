import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreSavedView } from "@/lib/core/api";
import { tourTargetSelector } from "@/lib/tours/anchors";
import {
  COST_SAVED_VIEWS_TOUR_KEY,
  costSavedViewsActions,
  costSavedViewsAnchors,
} from "@/lib/tours/definitions/cost-saved-views";
import { SavedViewsClient } from "./saved-views-client";

const { usePageTour } = vi.hoisted(() => ({ usePageTour: vi.fn() }));
vi.mock("@/components/tours/tour-provider", () => ({ usePageTour }));
vi.mock("@/app/dashboard/products/cost-actions", () => ({
  createSavedViewAction: vi.fn(),
  deleteSavedViewAction: vi.fn(),
  updateSavedViewAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function view(overrides: Partial<CoreSavedView>): CoreSavedView {
  return {
    id: "v1",
    organization_id: "o1",
    created_by_user_id: "me",
    name: "Production by service",
    description: null,
    group_by: ["service_name"],
    granularity: "monthly",
    visibility: "organization",
    scope: [],
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

const offer = () => usePageTour.mock.calls.at(-1);
const anchored = (name: keyof typeof costSavedViewsAnchors) =>
  document.querySelectorAll(tourTargetSelector(costSavedViewsAnchors[name]));

describe("SavedViewsClient product tour", () => {
  it("opens an empty create form for the tour's form steps, and closes it unsaved", () => {
    render(<SavedViewsClient initialSavedViews={[]} currentUserId="me" />);
    expect(offer()?.[0]).toBe(COST_SAVED_VIEWS_TOUR_KEY);
    expect(offer()?.[1].ready).toBe(true);

    let close: (() => void) | void = undefined;
    act(() => {
      close = offer()?.[1].actions[costSavedViewsActions.openForm]();
    });
    expect(
      screen.getByRole("dialog", { name: "Create saved view" }),
    ).toBeTruthy();
    expect(offer()?.[1].ready).toBe(false);
    const formAnchors = (
      Object.keys(
        costSavedViewsAnchors,
      ) as (keyof typeof costSavedViewsAnchors)[]
    ).filter((name) => name.startsWith("form"));
    expect(formAnchors.length).toBeGreaterThan(0);
    for (const name of formAnchors) expect(anchored(name)).toHaveLength(1);

    act(() => (close as (() => void) | void)?.());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("points the edit and delete step only at a view the user created", () => {
    render(
      <SavedViewsClient
        initialSavedViews={[
          view({ id: "theirs", name: "A shared", created_by_user_id: "other" }),
          view({ id: "mine", name: "B mine" }),
        ]}
        currentUserId="me"
      />,
    );
    expect(anchored("view")).toHaveLength(2);
    expect(anchored("viewActions")).toHaveLength(1);
  });
});
