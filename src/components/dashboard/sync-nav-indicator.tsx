"use client";

import { useEffect, useState } from "react";
import { getSyncIndicatorAction } from "@/app/dashboard/sync/actions";
import type { SyncState } from "@/lib/sync/overview";
import { cn } from "@/lib/utils";

const REFRESH_MS = 60_000;

/** A dot beside the Sync menu item: spinning while any connection syncs,
 * red when one is failing, amber when one needs attention; nothing when all
 * is well. Refreshed every minute and on each navigation. */
export function SyncNavIndicator({ pathname }: { pathname: string }) {
  const [state, setState] = useState<SyncState | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      void getSyncIndicatorAction().then((next) => {
        if (!cancelled) setState(next);
      });
    refresh();
    const handle = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [pathname]);

  if (state === "running")
    return (
      <span
        role="status"
        aria-label="Sync running"
        className="border-accent size-2.5 animate-spin rounded-full border-2 border-t-transparent"
      />
    );
  if (state === "failing" || state === "attention")
    return (
      <span
        role="status"
        aria-label={
          state === "failing" ? "Sync failing" : "Sync needs attention"
        }
        className={cn(
          "size-2 rounded-full",
          state === "failing"
            ? "bg-red-500 shadow-[0_0_8px_rgb(239_68_68)]"
            : "bg-amber-500",
        )}
      />
    );
  return null;
}
