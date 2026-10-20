import { costBudgetsTour } from "./definitions/cost-budgets";
import { costExplorerTour } from "./definitions/cost-explorer";
import { costOverviewTour } from "./definitions/cost-overview";
import { infrastructureGraphTour } from "./definitions/infrastructure-graph";
import type { TourDefinition } from "./types";

/** Every product tour. Add a product's tours here; nothing else in the tour
 *  system names a product. */
export const TOURS: readonly TourDefinition[] = [
  infrastructureGraphTour,
  costOverviewTour,
  costExplorerTour,
  costBudgetsTour,
];

export function findTour(key: string) {
  return TOURS.find((tour) => tour.key === key);
}
