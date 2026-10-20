import type { TourDefinition, TourProgress } from "./types";

export type TourState = "new" | "in_progress" | "completed" | "dismissed";

/** A product the organization has active access to. */
export interface TourProduct {
  slug: string;
  name: string;
}

export interface TourGroup<T = TourDefinition> {
  product: TourProduct;
  tours: readonly T[];
}

/** The tours of products the organization has active access to, one group
 *  per product in the products' order; a product without tours has none. */
export function tourGroups(
  tours: readonly TourDefinition[],
  activeProducts: readonly TourProduct[],
): TourGroup[] {
  return activeProducts.flatMap((product) => {
    const own = tours.filter((tour) => tour.product === product.slug);
    return own.length > 0 ? [{ product, tours: own }] : [];
  });
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
