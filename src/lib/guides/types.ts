import type { TourAudience } from "@/lib/tours/types";

export interface GuideScene {
  /** Stable within a guide version; persisted so a guide can resume. */
  id: string;
  title: string;
  /** What the scene says, read while its animation plays. */
  caption: string;
  /** How long the scene plays before the next one starts. */
  durationMs: number;
}

interface GuideDefinitionBase {
  /** Persisted like a tour's key (Core stores both opaquely), so it must not
   *  collide with one: `guide.<topic>`. */
  key: string;
  /** Bump when the scenes change materially: users who watched an older
   *  version are offered the guide again. */
  version: number;
  title: string;
  description: string;
  /** Tours the guide hands over to: its end screen starts the one the
   *  current page offers, else the first. */
  tours: readonly string[];
  scenes: readonly GuideScene[];
}

/** An animated, video-like explainer of a topic. Its scenes' visuals live
 *  in `src/components/guides` (`GUIDE_VISUALS`), keyed by scene id. */
export type GuideDefinition = GuideDefinitionBase & TourAudience;

/** What `GuidePlayer` plays: a guide, or a page's own explainer video that
 *  brings its visuals along and is never saved or listed (e.g. Build on
 *  Dilanix). */
export type GuideVideo = Pick<GuideDefinitionBase, "key" | "title" | "scenes">;
