"use client";

import { GuidePlayer } from "@/components/guides/guide-player";
import { buildOnDilanixVideo } from "@/lib/guides/explainers/build-on-dilanix";
import { BUILD_ON_DILANIX_VISUALS } from "./build-on-dilanix-scenes";

/** Build on Dilanix's explainer: paused until played, nothing saved, and its
 *  end screen books a call. */
export function BuildOnDilanixVideo({ calendlyUrl }: { calendlyUrl: string }) {
  return (
    <figure className="border-border-soft bg-card-strong/64 rounded-2xl border p-4 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
          <span className="bg-accent size-1.5 rounded-full shadow-[0_0_9px_var(--accent)]" />
          How it works
        </span>
        <span className="border-accent/20 bg-accent/8 text-accent rounded-full border px-2.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
          Sample project
        </span>
      </div>
      <GuidePlayer
        guide={buildOnDilanixVideo}
        visuals={BUILD_ON_DILANIX_VISUALS}
        inline
        endAction={{ label: "Book a call", href: calendlyUrl }}
      />
    </figure>
  );
}
