"use client";

import { useTours } from "@/components/tours/tour-provider";
import { findGuide } from "@/lib/guides/registry";
import { GuidePlayer } from "./guide-player";

/** A guide on a Documentation page: paused until played, progress not
 *  recorded. Its end screen hands over to the guide's first tour the user
 *  can open from here. */
export function GuideEmbed({ guideKey }: { guideKey: string }) {
  const guide = findGuide(guideKey);
  const tours = useTours();
  if (!guide) return null;
  const tourKey = guide.tours.find((key) =>
    tours?.groups.some((group) =>
      group.tours.some(
        (entry) =>
          entry.kind === "tour" &&
          entry.tour.key === key &&
          entry.tour.route !== null,
      ),
    ),
  );
  return (
    <figure className="border-border-soft bg-card-strong/50 my-8 rounded-2xl border p-4 sm:p-5">
      <GuidePlayer
        guide={guide}
        inline
        onTakeTour={tourKey && tours ? () => tours.start(tourKey) : undefined}
      />
    </figure>
  );
}
