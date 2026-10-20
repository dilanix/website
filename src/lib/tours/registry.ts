import { costAllocationsTour } from "./definitions/cost-allocations";
import { costAnomaliesTour } from "./definitions/cost-anomalies";
import { costBudgetsTour } from "./definitions/cost-budgets";
import { costExplorerTour } from "./definitions/cost-explorer";
import { costOverviewTour } from "./definitions/cost-overview";
import { costReportsTour } from "./definitions/cost-reports";
import { costSavedViewsTour } from "./definitions/cost-saved-views";
import { connectionTour } from "./definitions/connection";
import { infrastructureGraphTour } from "./definitions/infrastructure-graph";
import { infrastructureResourcesTour } from "./definitions/infrastructure-resources";
import { integrationsTour } from "./definitions/integrations";
import { recommendationsTour } from "./definitions/recommendations";
import { syncTour } from "./definitions/sync";
import type { TourDefinition } from "./types";

/** Every product tour. Add a product's tours here; nothing else in the tour
 *  system names a product. */
export const TOURS: readonly TourDefinition[] = [
  recommendationsTour,
  infrastructureGraphTour,
  infrastructureResourcesTour,
  costOverviewTour,
  costExplorerTour,
  costBudgetsTour,
  costAllocationsTour,
  costAnomaliesTour,
  costSavedViewsTour,
  costReportsTour,
  integrationsTour,
  connectionTour,
  syncTour,
];

export function findTour(key: string) {
  return TOURS.find((tour) => tour.key === key);
}
