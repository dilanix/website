import type { TourDefinition, TourProgress, TourSection } from "./types";

export type TourState = "new" | "in_progress" | "completed" | "dismissed";

/** A product the organization has active access to. */
export interface TourProduct {
  slug: string;
  name: string;
}

export interface TourGroup<T = TourDefinition> {
  /** Unique across products and sections. */
  key: string;
  name: string;
  tours: readonly T[];
}

const SECTION_NAMES: Record<TourSection, string> = {
  workspace: "Workspace",
  manage: "Manage",
};

/** The tours the user can take, grouped like the sidebar: Workspace, then
 *  one group per product the organization has active access to (in the
 *  products' order), then Manage. Platform sections need an organization; a
 *  group without tours is left out. */
export function tourGroups(
  tours: readonly TourDefinition[],
  activeProducts: readonly TourProduct[],
  hasOrganization: boolean,
): TourGroup[] {
  const section = (id: TourSection) => ({
    key: `section:${id}`,
    name: SECTION_NAMES[id],
    tours: hasOrganization ? tours.filter((tour) => tour.section === id) : [],
  });
  return [
    section("workspace"),
    ...activeProducts.map((product) => ({
      key: `product:${product.slug}`,
      name: product.name,
      tours: tours.filter((tour) => tour.product === product.slug),
    })),
    section("manage"),
  ].filter((group) => group.tours.length > 0);
}

/** A record from an older tour version counts as never seen. */
export function tourState(
  tour: TourDefinition,
  progress: TourProgress | undefined,
): TourState {
  if (!progress || progress.tour_version < tour.version) return "new";
  return progress.status;
}

/** Where `start` begins: the stored step of an unfinished run, else the top. */
export function startIndex(
  tour: TourDefinition,
  progress: TourProgress | undefined,
) {
  if (tourState(tour, progress) !== "in_progress" || !progress?.step_id)
    return 0;
  return Math.max(
    0,
    tour.steps.findIndex((step) => step.id === progress.step_id),
  );
}
