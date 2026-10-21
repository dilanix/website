"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { GUIDES, guideDurationLabel } from "@/lib/guides/registry";
import { cn } from "@/lib/utils";
import { GuidePlayer } from "./guide-player";

/** Connecting and syncing first: the product guides build on their data. */
const GROUPS = [
  { label: "Get started", guides: GUIDES.filter((guide) => guide.section) },
  { label: "Products", guides: GUIDES.filter((guide) => guide.product) },
].filter((group) => group.guides.length > 0);

/**
 * Every video guide for visitors who aren't signed in (`/guides`): the first
 * one waits paused, a picked one plays at once. Nothing is saved and there is
 * no tour to hand over to, so the end screen only replays.
 */
export function GuideLibrary() {
  const [selected, setSelected] = useState({
    key: GROUPS[0].guides[0].key,
    picked: false,
  });
  const guide =
    GUIDES.find((item) => item.key === selected.key) ?? GROUPS[0].guides[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start">
      <nav aria-label="Video guides" className="flex flex-col gap-5">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-muted-foreground px-1 text-[11px] font-semibold tracking-[0.16em] uppercase">
              {group.label}
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {group.guides.map((item) => {
                const current = item.key === guide.key;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected({ key: item.key, picked: true })
                      }
                      aria-current={current ? "true" : undefined}
                      className={cn(
                        "flex h-full w-full gap-3 rounded-xl border p-3.5 text-left transition-colors",
                        current
                          ? "border-accent/40 bg-accent/8"
                          : "border-border-soft bg-card-strong/64 hover:border-accent/30",
                      )}
                    >
                      <PlayCircle
                        size={18}
                        className={cn(
                          "mt-0.5 shrink-0",
                          current ? "text-accent" : "text-muted-foreground",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold tracking-tight">
                          {item.title}
                        </span>
                        <span className="text-muted-foreground mt-0.5 block text-xs leading-5">
                          {item.description}
                        </span>
                        <span className="text-muted-foreground/80 mt-1.5 block text-[11px] font-medium">
                          {guideDurationLabel(item)} · {item.scenes.length}{" "}
                          scenes
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <figure className="border-border-soft bg-card-strong/64 rounded-2xl border p-4 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl sm:p-5">
        <GuidePlayer key={guide.key} guide={guide} inline={!selected.picked} />
      </figure>
    </div>
  );
}
