import type { Route } from "next";
import type { CoreTourProgress } from "@/lib/core/api";

export type TourPlacement = "top" | "right" | "bottom" | "left";

export interface TourStep {
  /** Stable within a tour version; persisted so a tour can resume. */
  id: string;
  /** The `data-tour` anchor to highlight; omit for a centered step. A step
   *  whose anchor is not on the page (hidden by permissions, layout or
   *  missing data) is skipped, so a tour never points at unavailable UI. */
  target?: string;
  title: string;
  body: string;
  placement?: TourPlacement;
  /** A page-registered action run before the step shows (e.g. open a panel
   *  with real data, or a form to walk through); the step then waits for its
   *  target to appear. Consecutive steps with the same `prepare` share one
   *  run, and its cleanup (e.g. closing the form) runs when the tour moves to
   *  a step without it, or ends. */
  prepare?: string;
}

export interface TourDefinition {
  /** Persisted identifier, `<area>.<page>` (Core stores it opaquely). */
  key: string;
  /** Bump when the steps change materially: users who finished or skipped an
   *  older version are offered the tour again. */
  version: number;
  title: string;
  description: string;
  /** Slug of the product whose active access the tour requires. */
  product: string;
  /** The page the tour runs on. */
  route: Route;
  steps: readonly TourStep[];
}

/** What the UI needs from a stored progress record. */
export type TourProgress = Pick<
  CoreTourProgress,
  "tour_key" | "tour_version" | "status" | "step_id"
>;
