"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight, Loader2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/** A table whose rows open in place — the shared shell of the
 * Recommendations and Sync lists. `gridClassName` sets the columns from `md`
 * up; below that each row stacks. */
export function ExpandableTable({
  label,
  columns,
  gridClassName,
  children,
  footer,
}: {
  label: string;
  columns: string[];
  gridClassName: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="border-border-soft bg-dashboard-panel/60 overflow-hidden rounded-2xl border shadow-[0_18px_48px_var(--shadow-card)]"
    >
      <div
        aria-hidden
        className={cn(
          "border-border-soft text-muted-foreground hidden border-b px-5 py-3 text-xs font-medium md:grid",
          gridClassName,
        )}
      >
        {columns.map((column, index) => (
          <span key={index} className={cn(index === 0 && "pl-10")}>
            {column}
          </span>
        ))}
      </div>
      <div className="flex flex-col">{children}</div>
      {footer ? (
        <div className="border-border-soft text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

/** One row: `title` is the toggle (chevron + text), `cells` the remaining
 * columns. Open, the row lifts into an outlined panel with its body below, so
 * several open rows stay clearly apart. */
export function ExpandableRow({
  id,
  label,
  open,
  onToggle,
  gridClassName,
  title,
  cells,
  children,
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  gridClassName: string;
  title: ReactNode;
  cells: ReactNode[];
  children: ReactNode;
}) {
  const bodyId = `row-${id}`;
  return (
    <article
      aria-label={label}
      className={cn(
        "transition-all duration-200",
        open
          ? "border-accent/55 bg-card-strong/45 relative z-[1] mx-2 my-2 rounded-xl border shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_8%,transparent),0_22px_48px_var(--shadow-card)]"
          : "border-border-soft hover:bg-card-strong/35 border-b last:border-b-0",
      )}
    >
      <div
        className={cn(
          "grid grid-cols-1 items-center gap-3 px-5 py-4 md:gap-4",
          open && "px-3",
          gridClassName,
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
          className="group/toggle flex min-w-0 items-start gap-3 text-left"
        >
          <span
            className={cn(
              "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
              open
                ? "border-accent/60 text-accent rotate-90"
                : "border-border-soft text-muted-foreground group-hover/toggle:border-accent/50 group-hover/toggle:text-accent",
            )}
          >
            <ChevronRight size={15} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">{title}</span>
        </button>
        {cells.map((cell, index) => (
          <div key={index} className="min-w-0 pl-10 md:pl-0">
            {cell}
          </div>
        ))}
      </div>
      {open ? (
        <div
          id={bodyId}
          className="border-border-soft animate-toast-in border-t px-4 py-5 sm:px-6"
        >
          {children}
        </div>
      ) : null}
    </article>
  );
}

export type PillTone = "success" | "warning" | "danger" | "accent" | "neutral";

const PILL_TONES: Record<PillTone, string> = {
  success: "border-success/35 bg-success/10 text-success",
  warning:
    "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  danger: "border-red-500/40 bg-red-500/10 text-red-500",
  accent: "border-accent/40 bg-accent/10 text-accent",
  neutral: "border-border-soft bg-card-strong/60 text-muted-foreground",
};

const DOT_TONES: Record<PillTone, string> = {
  success: "bg-success",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  accent: "bg-accent",
  neutral: "bg-muted-foreground",
};

/** A status pill: dot (or spinner) plus label. */
export function StatePill({
  tone,
  spinning,
  children,
}: {
  tone: PillTone;
  spinning?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap",
        PILL_TONES[tone],
      )}
    >
      {spinning ? (
        <Loader2 size={11} className="animate-spin" aria-hidden />
      ) : (
        <span className={cn("size-2 rounded-full", DOT_TONES[tone])} />
      )}
      {children}
    </span>
  );
}

/** A small tag under a row's title (`cost`, `low priority`, `active`). */
export function RowTag({
  tone = "neutral",
  children,
}: {
  tone?: PillTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]",
        PILL_TONES[tone],
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_TONES[tone])} />
      {children}
    </span>
  );
}

export type RowMenuItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
};

/** The row's "⋮" menu. */
export function RowMenu({
  label,
  items,
}: {
  label: string;
  items: RowMenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (items.length === 0) return <span className="size-8" />;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 flex size-8 items-center justify-center rounded-lg transition-colors"
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="border-border-soft bg-background animate-menu-reveal absolute top-full right-0 z-20 mt-1 min-w-40 overflow-hidden rounded-xl border p-1 shadow-2xl"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "hover:bg-foreground/5 flex w-full items-center rounded-lg px-3 py-2 text-left text-xs transition-colors disabled:opacity-50",
                item.tone === "danger" ? "text-red-500" : "text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
