"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { saveTourProgressAction } from "@/app/dashboard/tour-actions";
import { GuideDialog } from "@/components/guides/guide-dialog";
import { Toast } from "@/components/ui/toast";
import { GUIDES } from "@/lib/guides/registry";
import type { GuideDefinition } from "@/lib/guides/types";
import {
  startIndex,
  tourGroups,
  tourState,
  type TourGroup,
  type TourProduct,
  type TourState,
} from "@/lib/tours/eligibility";
import { TOURS } from "@/lib/tours/registry";
import type { TourDefinition, TourProgress } from "@/lib/tours/types";
import { runTour, type TourRun } from "./tour-runner";

/** Tours start on their own only where a canvas-heavy page has room. */
const AUTO_START_QUERY = "(min-width: 768px)";
/** Lets a freshly ready page settle (e.g. its first fit-to-view) first. */
const START_DELAY_MS = 600;
/** How long a tour started from another page waits for it to offer the tour. */
const PENDING_TIMEOUT_MS = 3000;

/** A page's handlers for tour `prepare` steps. One may return a cleanup the
 *  tour runs when it moves past the steps that need it, or ends — or `false`
 *  when there is nothing to set up, which skips those steps. */
export type TourActions = Record<string, () => void | false | (() => void)>;

interface PageRegistration {
  ready: boolean;
  actions: () => TourActions;
}

/** A tour or a guide as Help & Support lists it; `state` is `null` when
 *  progress could not be loaded. */
export type HelpEntry =
  | { kind: "tour"; tour: TourDefinition; state: TourState | null }
  | { kind: "guide"; guide: GuideDefinition; state: TourState | null };

interface TourContextValue {
  groups: readonly TourGroup<HelpEntry>[];
  start: (key: string) => void;
  play: (key: string) => void;
  register: (key: string, actions: () => TourActions) => () => void;
  setReady: (key: string, ready: boolean) => void;
  offerGuide: (key: string, autoOpen: boolean) => () => void;
}

function isGuide(
  item: TourDefinition | GuideDefinition,
): item is GuideDefinition {
  return "scenes" in item;
}

const TourContext = createContext<TourContextValue | null>(null);

/**
 * Orchestrates product tours and video guides for the dashboard: which ones
 * the organization can access, auto-starting a tour (or a guide its page asks
 * for) once on the page that offers it, starting one from Help & Support
 * (navigating to a tour's page first), and saving progress — a guide's like a
 * tour's, by scene. Pages offer a tour with `usePageTour` and a guide with
 * `usePageGuide`; the definitions themselves are declarative
 * (`src/lib/tours`, `src/lib/guides`).
 */
export function TourProvider({
  progress: initialProgress,
  activeProducts,
  hasOrganization,
  children,
}: {
  progress: readonly TourProgress[] | null;
  activeProducts: readonly TourProduct[];
  /** Tours of platform pages need one. */
  hasOrganization: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [progress, setProgress] = useState<ReadonlyMap<
    string,
    TourProgress
  > | null>(() =>
    initialProgress
      ? new Map(initialProgress.map((item) => [item.tour_key, item]))
      : null,
  );
  const [pages, setPages] = useState<ReadonlyMap<string, PageRegistration>>(
    () => new Map(),
  );
  const [pending, setPending] = useState<{
    key: string;
    index: number;
  } | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [guideOffers, setGuideOffers] = useState<ReadonlyMap<string, boolean>>(
    () => new Map(),
  );
  const [watching, setWatching] = useState<{
    guide: GuideDefinition;
    index: number;
  } | null>(null);
  const run = useRef<TourRun | null>(null);
  const runningKey = useRef<string | null>(null);
  const autoStarted = useRef(new Set<string>());
  const saving = useRef<Promise<void>>(Promise.resolve());
  const pagesRef = useRef(pages);
  const progressRef = useRef(progress);
  useEffect(() => {
    pagesRef.current = pages;
    progressRef.current = progress;
  });

  const productsKey = JSON.stringify(
    activeProducts.map(({ slug, name }) => ({ slug, name })),
  );
  // Guides first in each group, then tours.
  const groups = useMemo(
    () =>
      tourGroups<TourDefinition | GuideDefinition>(
        [...GUIDES, ...TOURS],
        JSON.parse(productsKey) as TourProduct[],
        hasOrganization,
      ),
    [productsKey, hasOrganization],
  );
  const listed = useMemo(
    () => groups.flatMap((group) => group.tours),
    [groups],
  );
  const tours = useMemo(
    () => listed.filter((item): item is TourDefinition => !isGuide(item)),
    [listed],
  );
  const guides = useMemo(() => listed.filter(isGuide), [listed]);

  /** Updates local state at once; writes to Core one at a time, in order. */
  const persist = useCallback(
    (
      tour: { key: string; version: number },
      status: TourProgress["status"],
      stepId: string | null,
    ) => {
      const record: TourProgress = {
        tour_key: tour.key,
        tour_version: tour.version,
        status,
        step_id: stepId,
      };
      setProgress((current) =>
        current ? new Map(current).set(tour.key, record) : current,
      );
      saving.current = saving.current
        .then(() =>
          saveTourProgressAction({
            tourKey: tour.key,
            tourVersion: tour.version,
            status,
            stepId,
          }),
        )
        .then(
          (result) => {
            if (result.error)
              console.warn(`Tour progress was not saved: ${result.error}`);
          },
          () => console.warn("Tour progress was not saved."),
        );
    },
    [],
  );

  const launch = useCallback(
    (tour: TourDefinition, index: number) => {
      run.current?.stop();
      let finished = false;
      runningKey.current = tour.key;
      setActiveKey(tour.key);
      const handle = runTour(tour, {
        startIndex: index,
        runAction: (id) => pagesRef.current.get(tour.key)?.actions()[id]?.(),
        onStep: (step) => persist(tour, "in_progress", step.id),
        onFinish: (outcome, step) => {
          finished = true;
          run.current = null;
          runningKey.current = null;
          setActiveKey(null);
          if (outcome !== "interrupted")
            persist(tour, outcome, step?.id ?? null);
        },
      });
      if (!finished) run.current = handle;
    },
    [persist],
  );

  const start = useCallback(
    (key: string) => {
      const tour = tours.find((item) => item.key === key);
      if (!tour) return;
      // A per-item page's tour starts only where that page offers it.
      if (!tour.route && !pagesRef.current.has(key)) return;
      setWatching(null);
      const index = startIndex(tour, progressRef.current?.get(key));
      if (pagesRef.current.get(key)?.ready) {
        launch(tour, index);
        return;
      }
      setPending({ key, index });
      if (!pagesRef.current.has(key) && tour.route) router.push(tour.route);
    },
    [tours, launch, router],
  );

  const play = useCallback(
    (key: string) => {
      const guide = guides.find((item) => item.key === key);
      if (!guide) return;
      run.current?.stop();
      setPending(null);
      setWatching({
        guide,
        index: startIndex(
          { version: guide.version, steps: guide.scenes },
          progressRef.current?.get(key),
        ),
      });
    },
    [guides],
  );

  /** The tour a guide hands over to: the one this page offers, else the
   *  first that Help & Support can open. */
  const handoverTour = useCallback(
    (guide: GuideDefinition) =>
      guide.tours.find((key) => pages.has(key)) ??
      guide.tours.find((key) =>
        tours.some((tour) => tour.key === key && tour.route),
      ),
    [pages, tours],
  );

  const offerGuide = useCallback((key: string, autoOpen: boolean) => {
    setGuideOffers((current) => new Map(current).set(key, autoOpen));
    return () =>
      setGuideOffers((current) => {
        const next = new Map(current);
        next.delete(key);
        return next;
      });
  }, []);

  const register = useCallback((key: string, actions: () => TourActions) => {
    setPages((current) =>
      new Map(current).set(key, {
        ready: current.get(key)?.ready ?? false,
        actions,
      }),
    );
    return () => {
      setPages((current) => {
        const next = new Map(current);
        next.delete(key);
        return next;
      });
      // The page that offered the running tour is gone (e.g. navigation).
      if (runningKey.current === key) run.current?.stop();
    };
  }, []);

  const setReady = useCallback((key: string, ready: boolean) => {
    setPages((current) => {
      const page = current.get(key);
      if (!page || page.ready === ready) return current;
      return new Map(current).set(key, { ...page, ready });
    });
  }, []);

  // A tour started from another page runs once that page is ready; if the
  // page never offers it (e.g. it has no data yet), say so instead.
  useEffect(() => {
    if (!pending) return;
    const tour = tours.find((item) => item.key === pending.key);
    const page = pages.get(pending.key);
    if (tour && page?.ready) {
      const timer = window.setTimeout(() => {
        setPending(null);
        launch(tour, pending.index);
      }, START_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
    if (!tour || page || !tour.route || pathname !== tour.route) return;
    const timer = window.setTimeout(() => {
      setPending(null);
      setNotice(
        `The ${tour.title} tour is available once this page has data to show.`,
      );
    }, PENDING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [pending, pages, pathname, tours, launch]);

  // A guide its page asks to open does so once, before any tour — and its
  // tours then wait for its end screen (or Help & Support) this visit.
  useEffect(() => {
    if (!progress || watching || activeKey || pending) return;
    if (!window.matchMedia?.(AUTO_START_QUERY).matches) return;
    const guide = guides.find(
      (item) =>
        guideOffers.get(item.key) &&
        !autoStarted.current.has(item.key) &&
        tourState(item, progress.get(item.key)) === "new",
    );
    if (!guide) return;
    const timer = window.setTimeout(() => {
      autoStarted.current.add(guide.key);
      // The page's own tour waits for the guide's end screen this visit;
      // tours of the guide's other pages still start there as usual.
      for (const key of guide.tours)
        if (pagesRef.current.has(key)) autoStarted.current.add(key);
      setWatching({ guide, index: 0 });
    }, START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [progress, watching, activeKey, pending, guides, guideOffers]);

  // Each tour starts on its own once, the first time its page is ready —
  // never when progress is unknown, so a failed load cannot nag — and never
  // ahead of a guide its page is about to open.
  useEffect(() => {
    if (!progress || activeKey || pending || watching) return;
    if (!window.matchMedia?.(AUTO_START_QUERY).matches) return;
    const waiting = new Set(
      guides
        .filter(
          (guide) =>
            guideOffers.get(guide.key) &&
            tourState(guide, progress.get(guide.key)) === "new",
        )
        .flatMap((guide) => guide.tours),
    );
    const tour = tours.find(
      (item) =>
        pages.get(item.key)?.ready &&
        !autoStarted.current.has(item.key) &&
        !waiting.has(item.key) &&
        tourState(item, progress.get(item.key)) === "new",
    );
    if (!tour) return;
    const timer = window.setTimeout(() => {
      autoStarted.current.add(tour.key);
      launch(tour, 0);
    }, START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [
    progress,
    activeKey,
    pending,
    watching,
    guides,
    guideOffers,
    pages,
    tours,
    launch,
  ]);

  useEffect(() => () => run.current?.stop(), []);

  const dismissNotice = useCallback(() => setNotice(null), []);
  const closeGuide = useCallback(() => setWatching(null), []);
  const entries = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          tours: group.tours.flatMap((item): HelpEntry[] => {
            const state = progress
              ? tourState(item, progress.get(item.key))
              : null;
            if (isGuide(item)) return [{ kind: "guide", guide: item, state }];
            // A per-item page's tour is listed only while that page offers it.
            if (!item.route && !pages.has(item.key)) return [];
            return [{ kind: "tour", tour: item, state }];
          }),
        }))
        .filter((group) => group.tours.length > 0),
    [groups, progress, pages],
  );
  const value = useMemo(
    () => ({
      groups: entries,
      start,
      play,
      register,
      setReady,
      offerGuide,
    }),
    [entries, start, play, register, setReady, offerGuide],
  );

  const handover = watching ? handoverTour(watching.guide) : undefined;
  return (
    <TourContext.Provider value={value}>
      {children}
      {watching ? (
        <GuideDialog
          key={watching.guide.key}
          guide={watching.guide}
          startIndex={watching.index}
          onClose={closeGuide}
          onSceneChange={(scene) =>
            persist(watching.guide, "in_progress", scene.id)
          }
          onEnd={() => persist(watching.guide, "completed", null)}
          onTakeTour={handover ? () => start(handover) : undefined}
        />
      ) : null}
      {notice ? (
        <Toast message={notice} variant="info" onDismiss={dismissNotice} />
      ) : null}
    </TourContext.Provider>
  );
}

/** Tours and guides for Help & Support, grouped like the sidebar; `null`
 *  outside a `TourProvider`. */
export function useTours() {
  const context = useContext(TourContext);
  return context
    ? { groups: context.groups, start: context.start, play: context.play }
    : null;
}

/** Offers a guide on the current page, opening it once on its own when
 *  `autoOpen` (e.g. Integrations before the first connection). */
export function usePageGuide(
  key: string,
  { autoOpen = false }: { autoOpen?: boolean } = {},
) {
  const offerGuide = useContext(TourContext)?.offerGuide;
  useEffect(() => offerGuide?.(key, autoOpen), [offerGuide, key, autoOpen]);
}

/**
 * Offers a tour on the current page. `ready` turns true once every element
 * the tour points at can render; `available: false` withdraws the offer once
 * the page knows it has nothing to show the tour on (e.g. no data), so a
 * started tour explains why instead of waiting. `actions` are the page's
 * handlers for the tour's `prepare` steps (the latest ones are always used).
 */
export function usePageTour(
  key: string,
  {
    ready,
    available = true,
    actions = {},
  }: { ready: boolean; available?: boolean; actions?: TourActions },
) {
  const context = useContext(TourContext);
  const latest = useRef(actions);
  useEffect(() => {
    latest.current = actions;
  });
  const register = context?.register;
  const setReady = context?.setReady;
  useEffect(
    () => (available ? register?.(key, () => latest.current) : undefined),
    [register, key, available],
  );
  useEffect(() => {
    if (available) setReady?.(key, ready);
  }, [setReady, key, ready, available]);
}
