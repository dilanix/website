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
import { Toast } from "@/components/ui/toast";
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

export interface TourEntry {
  tour: TourDefinition;
  /** `null` when progress could not be loaded. */
  state: TourState | null;
}

interface TourContextValue {
  groups: readonly TourGroup<TourEntry>[];
  start: (key: string) => void;
  register: (key: string, actions: () => TourActions) => () => void;
  setReady: (key: string, ready: boolean) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

/**
 * Orchestrates product tours for the dashboard: which tours the organization
 * can access, auto-starting a tour once on the page that offers it, starting
 * one from Help & Support (navigating to its page first), and saving
 * progress. Pages offer a tour with `usePageTour`; the tour definitions
 * themselves are declarative (`src/lib/tours`).
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
  const groups = useMemo(
    () =>
      tourGroups(
        TOURS,
        JSON.parse(productsKey) as TourProduct[],
        hasOrganization,
      ),
    [productsKey, hasOrganization],
  );
  const tours = useMemo(() => groups.flatMap((group) => group.tours), [groups]);

  /** Updates local state at once; writes to Core one at a time, in order. */
  const persist = useCallback(
    (
      tour: TourDefinition,
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
      const index = startIndex(tour, progressRef.current?.get(key));
      if (pagesRef.current.get(key)?.ready) {
        launch(tour, index);
        return;
      }
      setPending({ key, index });
      if (!pagesRef.current.has(key)) router.push(tour.route);
    },
    [tours, launch, router],
  );

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
    if (!tour || page || pathname !== tour.route) return;
    const timer = window.setTimeout(() => {
      setPending(null);
      setNotice(
        `The ${tour.title} tour is available once this page has data to show.`,
      );
    }, PENDING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [pending, pages, pathname, tours, launch]);

  // Each tour starts on its own once, the first time its page is ready —
  // never when progress is unknown, so a failed load cannot nag.
  useEffect(() => {
    if (!progress || activeKey || pending) return;
    if (!window.matchMedia?.(AUTO_START_QUERY).matches) return;
    const tour = tours.find(
      (item) =>
        pages.get(item.key)?.ready &&
        !autoStarted.current.has(item.key) &&
        tourState(item, progress.get(item.key)) === "new",
    );
    if (!tour) return;
    const timer = window.setTimeout(() => {
      autoStarted.current.add(tour.key);
      launch(tour, 0);
    }, START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [progress, activeKey, pending, pages, tours, launch]);

  useEffect(() => () => run.current?.stop(), []);

  const dismissNotice = useCallback(() => setNotice(null), []);
  const entries = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        tours: group.tours.map((tour) => ({
          tour,
          state: progress ? tourState(tour, progress.get(tour.key)) : null,
        })),
      })),
    [groups, progress],
  );
  const value = useMemo(
    () => ({ groups: entries, start, register, setReady }),
    [entries, start, register, setReady],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {notice ? (
        <Toast message={notice} variant="info" onDismiss={dismissNotice} />
      ) : null}
    </TourContext.Provider>
  );
}

/** Tours for Help & Support, grouped like the sidebar; `null` outside a
 *  `TourProvider`. */
export function useTours() {
  const context = useContext(TourContext);
  return context ? { groups: context.groups, start: context.start } : null;
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
