"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  CircleHelp,
  Compass,
  LifeBuoy,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { guideDurationLabel } from "@/lib/guides/registry";
import type { TourGroup, TourState } from "@/lib/tours/eligibility";
import { useTours, type HelpEntry } from "./tour-provider";

const LABELS: Record<
  HelpEntry["kind"],
  { state: Record<TourState, string>; action: Record<TourState, string> }
> = {
  tour: {
    state: {
      new: "New",
      in_progress: "In progress",
      completed: "Completed",
      dismissed: "Skipped",
    },
    action: {
      new: "Start",
      in_progress: "Resume",
      completed: "Restart",
      dismissed: "Restart",
    },
  },
  guide: {
    state: {
      new: "New",
      in_progress: "In progress",
      completed: "Watched",
      dismissed: "Watched",
    },
    action: {
      new: "Play",
      in_progress: "Resume",
      completed: "Replay",
      dismissed: "Replay",
    },
  },
};

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** "1 video · 2 tours". */
function countLabel(entries: readonly HelpEntry[]) {
  const videos = entries.filter((entry) => entry.kind === "guide").length;
  const tours = entries.length - videos;
  return [
    videos ? plural(videos, "video") : null,
    tours ? plural(tours, "tour") : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function isUnder(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/** The group open when the menu opens: the only one, else the current
 *  page's. */
function initialGroup(
  groups: readonly TourGroup<HelpEntry>[],
  pathname: string,
) {
  const group =
    groups.length === 1
      ? groups[0]
      : groups.find((item) =>
          item.tours.some(
            (entry) =>
              entry.kind === "tour" &&
              entry.tour.route !== null &&
              isUnder(pathname, entry.tour.route),
          ),
        );
  return group?.key ?? null;
}

/** Header Help & Support menu: video guides and product tours grouped like
 *  the sidebar (one group open at a time), documentation and contact. */
export function HelpMenu() {
  const tours = useTours();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const toursHeadingId = useId();
  const groupsId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const linkClassName =
    "hover:bg-foreground/5 focus-visible:ring-accent/35 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium outline-none focus-visible:ring-2";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!open && tours)
            setOpenGroup(initialGroup(tours.groups, pathname));
          setOpen(!open);
        }}
        aria-label="Help & Support"
        title="Help & Support"
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "border-border-soft bg-dashboard-panel hover:text-foreground flex size-9 items-center justify-center rounded-xl border shadow-sm transition-colors",
          open ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <CircleHelp size={15} />
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Help & Support"
          className="border-border-soft bg-card-strong animate-menu-reveal fixed inset-x-4 top-[4.75rem] z-40 rounded-2xl border p-2 shadow-[0_24px_70px_var(--shadow-card)] sm:absolute sm:inset-x-auto sm:top-11 sm:right-0 sm:w-[22rem]"
        >
          <p className="text-muted-foreground px-3 pt-1.5 pb-2 text-[10px] font-semibold tracking-[0.16em] uppercase">
            Help & Support
          </p>
          {tours && tours.groups.length > 0 ? (
            <section
              aria-labelledby={toursHeadingId}
              className="border-border-soft mb-1 border-b pb-2"
            >
              <h2
                id={toursHeadingId}
                className="text-foreground flex items-center gap-2 px-3 pb-1 text-[13px] font-semibold"
              >
                <Compass size={14} className="text-accent" />
                Guides &amp; tours
              </h2>
              <ul className="flex max-h-[min(26rem,calc(100dvh-15rem))] flex-col overflow-y-auto">
                {tours.groups.map(({ key, name, tours: entries }, index) => {
                  const expanded = openGroup === key;
                  const listId = `${groupsId}-${index}`;
                  const fresh = entries.filter(
                    ({ state }) => state === "new",
                  ).length;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={listId}
                        onClick={() => setOpenGroup(expanded ? null : key)}
                        className="hover:bg-foreground/5 focus-visible:ring-accent/35 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left outline-none focus-visible:ring-2"
                      >
                        <ChevronRight
                          size={14}
                          aria-hidden
                          className={cn(
                            "shrink-0 transition-transform duration-200",
                            expanded
                              ? "text-accent rotate-90"
                              : "text-muted-foreground",
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                          {name}
                        </span>
                        {fresh > 0 ? (
                          <span className="bg-accent/12 text-accent shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                            {fresh} new
                          </span>
                        ) : null}
                        <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                          {countLabel(entries)}
                        </span>
                      </button>
                      {expanded ? (
                        <ul
                          id={listId}
                          aria-label={`${name} tours`}
                          className="border-border-soft mb-1 ml-[1.15rem] flex flex-col border-l pl-1"
                        >
                          {entries.map((entry) => {
                            const item =
                              entry.kind === "guide" ? entry.guide : entry.tour;
                            const { state } = entry;
                            const labels = LABELS[entry.kind];
                            const action = labels.action[state ?? "new"];
                            return (
                              <li
                                key={item.key}
                                className="flex items-center gap-3 rounded-xl px-3 py-2"
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-2">
                                    {entry.kind === "guide" ? (
                                      <PlayCircle
                                        size={13}
                                        aria-hidden
                                        className="text-accent shrink-0"
                                      />
                                    ) : null}
                                    <span className="truncate text-[13px] font-medium">
                                      {item.title}
                                    </span>
                                    {state ? (
                                      <span
                                        className={cn(
                                          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                          state === "new"
                                            ? "bg-accent/12 text-accent"
                                            : state === "completed"
                                              ? "bg-success/10 text-success"
                                              : "bg-foreground/5 text-muted-foreground",
                                        )}
                                      >
                                        {labels.state[state]}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="text-muted-foreground block truncate text-[11px]">
                                    {entry.kind === "guide"
                                      ? `${guideDurationLabel(entry.guide)} · ${item.description}`
                                      : item.description}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpen(false);
                                    if (entry.kind === "guide")
                                      tours.play(item.key);
                                    else tours.start(item.key);
                                  }}
                                  aria-label={`${action} the ${item.title} ${entry.kind === "guide" ? "video" : "tour"}`}
                                  className="border-border-soft hover:border-accent/40 hover:text-accent focus-visible:ring-accent/35 shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-2"
                                >
                                  {action}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
          <Link
            href="/dashboard/docs"
            onClick={() => setOpen(false)}
            className={linkClassName}
          >
            <BookOpen size={15} className="text-accent" />
            <span className="flex-1">Documentation</span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </Link>
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className={linkClassName}
          >
            <LifeBuoy size={15} className="text-accent" />
            <span className="flex-1">Contact support</span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
