import type { TourDefinition, TourProgress } from "./types";

export type TourState = "new" | "in_progress" | "completed" | "dismissed";

/** Tours whose product the organization has active access to. */
export function accessibleTours(
  tours: readonly TourDefinition[],
  activeProductSlugs: ReadonlySet<string>,
) {
  return tours.filter((tour) => activeProductSlugs.has(tour.product));
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
