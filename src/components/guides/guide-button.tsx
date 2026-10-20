"use client";

import { PlayCircle } from "lucide-react";
import { useTours } from "@/components/tours/tour-provider";

/** "How it works" in a page header: plays the page's video guide. Hidden
 *  when the guide isn't available to the user. */
export function GuideButton({
  guideKey,
  anchor,
}: {
  guideKey: string;
  /** A product-tour anchor for the button. */
  anchor?: string;
}) {
  const tours = useTours();
  const available = tours?.groups.some((group) =>
    group.tours.some(
      (entry) => entry.kind === "guide" && entry.guide.key === guideKey,
    ),
  );
  if (!tours || !available) return null;
  return (
    <button
      type="button"
      data-tour={anchor}
      onClick={() => tours.play(guideKey)}
      className="border-border-soft bg-dashboard-panel hover:border-accent/40 hover:text-accent inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium shadow-sm transition-colors"
    >
      <PlayCircle size={16} className="text-accent" />
      How it works
    </button>
  );
}
