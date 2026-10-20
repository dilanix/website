"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  CircleHelp,
  Compass,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TourState } from "@/lib/tours/eligibility";
import { useTours } from "./tour-provider";

const STATE_LABELS: Record<TourState, string> = {
  new: "New",
  in_progress: "In progress",
  completed: "Completed",
  dismissed: "Skipped",
};

const ACTION_LABELS: Record<TourState, string> = {
  new: "Start",
  in_progress: "Resume",
  completed: "Restart",
  dismissed: "Restart",
};

/** Header Help & Support menu: product tours, documentation and contact. */
export function HelpMenu() {
  const tours = useTours();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const toursHeadingId = useId();

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
        onClick={() => setOpen((value) => !value)}
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
          className="border-border-soft bg-card-strong animate-menu-reveal fixed inset-x-4 top-[4.75rem] z-40 rounded-2xl border p-2 shadow-[0_24px_70px_var(--shadow-card)] sm:absolute sm:inset-x-auto sm:top-11 sm:right-0 sm:w-80"
        >
          <p className="text-muted-foreground px-3 pt-1.5 pb-2 text-[10px] font-semibold tracking-[0.16em] uppercase">
            Help & Support
          </p>
          {tours && tours.tours.length > 0 ? (
            <section
              aria-labelledby={toursHeadingId}
              className="border-border-soft mb-1 border-b pb-2"
            >
              <h2
                id={toursHeadingId}
                className="text-foreground flex items-center gap-2 px-3 pb-1 text-[13px] font-semibold"
              >
                <Compass size={14} className="text-accent" />
                Product tours
              </h2>
              <ul className="flex flex-col">
                {tours.tours.map(({ tour, state }) => (
                  <li
                    key={tour.key}
                    className="flex items-center gap-3 rounded-xl px-3 py-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium">
                          {tour.title}
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
                            {STATE_LABELS[state]}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground block truncate text-[11px]">
                        {tour.description}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        tours.start(tour.key);
                      }}
                      aria-label={`${ACTION_LABELS[state ?? "new"]} the ${tour.title} tour`}
                      className="border-border-soft hover:border-accent/40 hover:text-accent focus-visible:ring-accent/35 shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-2"
                    >
                      {ACTION_LABELS[state ?? "new"]}
                    </button>
                  </li>
                ))}
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
