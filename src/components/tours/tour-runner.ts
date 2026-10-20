import "driver.js/dist/driver.css";

import { driver, type DriveStep, type PopoverDOM } from "driver.js";
import { tourTargetSelector } from "@/lib/tours/anchors";
import type { TourDefinition, TourStep } from "@/lib/tours/types";

/** How a run ended: Finish, Skip/Escape, or torn down by the page (e.g. the
 *  user navigated away) — the last leaves the stored step to resume from. */
export type TourOutcome = "completed" | "dismissed" | "interrupted";

export interface TourRun {
  stop: () => void;
}

export interface TourRunOptions {
  startIndex: number;
  /** Runs a step's `prepare` action. It may return a cleanup that undoes what
   *  it set up (e.g. closes the form it opened). */
  runAction: (actionId: string) => void | (() => void);
  onStep: (step: TourStep) => void;
  onFinish: (outcome: TourOutcome, step: TourStep | undefined) => void;
}

/** How long a prepared step waits for its target (e.g. a panel that loads
 *  real data) before it is skipped. */
const PREPARED_TARGET_WAIT_MS = 4000;

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isOnPage(step: TourStep) {
  return (
    !step.target ||
    Boolean(step.prepare) ||
    document.querySelector(tourTargetSelector(step.target)) !== null
  );
}

/** Adds the visual progress bar and the Skip button to driver.js's popover. */
function decorate(
  popover: PopoverDOM,
  index: number,
  total: number,
  skip: () => void,
) {
  popover.wrapper.setAttribute("aria-modal", "true");

  const track = document.createElement("div");
  track.className = "dilanix-tour-progress";
  track.setAttribute("aria-hidden", "true");
  const bar = document.createElement("span");
  bar.style.width = `${((index + 1) / total) * 100}%`;
  track.appendChild(bar);
  popover.wrapper.prepend(track);

  if (index === 0) popover.previousButton.style.display = "none";
  if (index < total - 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "driver-popover-footer-btn dilanix-tour-skip";
    button.textContent = "Skip tour";
    button.addEventListener("click", skip);
    popover.footerButtons.prepend(button);
  }
  window.requestAnimationFrame(() => popover.nextButton.focus());
}

/**
 * Runs one tour with driver.js — the only module that knows the library.
 * Steps whose target is not on the page are left out up front, so the
 * progress count matches what the user will actually see.
 */
export function runTour(
  tour: TourDefinition,
  { startIndex, runAction, onStep, onFinish }: TourRunOptions,
): TourRun {
  const steps = tour.steps.filter(isOnPage);
  // Resume at the stored step, or the next one still on the page.
  const first = steps.length
    ? Math.max(
        0,
        steps.findIndex((step) => tour.steps.indexOf(step) >= startIndex),
      )
    : -1;
  if (first < 0) {
    onFinish("interrupted", undefined);
    return { stop: () => {} };
  }
  // The overlay renders on <body>, which a fullscreen element would cover.
  if (document.fullscreenElement)
    void document.exitFullscreen().catch(() => {});

  const reducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  let current: TourStep | undefined;
  let finished = false;
  // What a `prepare` action set up (e.g. an open form) lasts while consecutive
  // steps share that action, and is undone once the tour moves on or ends.
  let prepared: { action: string; cleanup?: () => void } | null = null;

  const prepare = (index: number) => {
    const action = steps[index]?.prepare;
    if (prepared?.action === action) return;
    prepared?.cleanup?.();
    prepared = null;
    if (!action) return;
    const cleanup = runAction(action);
    prepared = { action, cleanup: cleanup ?? undefined };
  };

  const instance = driver({
    steps: steps.map((step): DriveStep => ({
      element: step.target ? tourTargetSelector(step.target) : undefined,
      waitForElement: step.prepare ? PREPARED_TARGET_WAIT_MS : 0,
      popover: {
        title: escapeHtml(step.title),
        description: escapeHtml(step.body),
        side: step.placement,
        align: "start",
      },
    })),
    animate: !reducedMotion,
    smoothScroll: !reducedMotion,
    allowClose: true,
    overlayClickBehavior: "none",
    disableActiveInteraction: true,
    skipMissingElement: true,
    showProgress: true,
    progressText: "{{current}} of {{total}}",
    showButtons: ["next", "previous"],
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Finish",
    popoverClass: "dilanix-tour",
    overlayColor: "#020817",
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 12,
    onPopoverRender: (popover, { index }) =>
      decorate(popover, index ?? 0, steps.length, () => finish("dismissed")),
    onHighlightStarted: (_element, _step, { index }) => {
      current = steps[index ?? 0];
      if (current) onStep(current);
    },
    onNextClick: (_element, _step, { index }) => {
      const next = (index ?? 0) + 1;
      prepare(next);
      instance.moveTo(next);
    },
    onPrevClick: (_element, _step, { index }) => {
      const previous = (index ?? 0) - 1;
      prepare(previous);
      instance.moveTo(previous);
    },
    onDoneClick: () => finish("completed"),
    // Escape (driver.js routes every user-initiated close here).
    onDestroyStarted: () => finish("dismissed"),
  });

  // Reported here, exactly once, rather than from driver.js's `onDestroyed`,
  // which does not fire before the first step's highlight has completed.
  function finish(outcome: TourOutcome) {
    if (finished) return;
    finished = true;
    instance.destroy();
    prepared?.cleanup?.();
    prepared = null;
    onFinish(outcome, current);
  }

  prepare(first);
  instance.drive(first);
  return { stop: () => finish("interrupted") };
}
