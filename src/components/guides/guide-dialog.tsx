"use client";

import { useEffect, useId } from "react";
import { PlayCircle, X } from "lucide-react";
import { ModalOverlay } from "@/components/dashboard/modal-overlay";
import type { GuideDefinition, GuideScene } from "@/lib/guides/types";
import { GuidePlayer } from "./guide-player";

/** A guide playing in a dialog; Escape or the backdrop closes it. */
export function GuideDialog({
  guide,
  startIndex,
  onClose,
  onSceneChange,
  onEnd,
  onTakeTour,
}: {
  guide: GuideDefinition;
  startIndex: number;
  onClose: () => void;
  onSceneChange: (scene: GuideScene) => void;
  onEnd: () => void;
  onTakeTour?: () => void;
}) {
  const titleId = useId();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <ModalOverlay onClose={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="border-border-soft bg-background w-full max-w-4xl rounded-2xl border p-4 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] uppercase">
              <PlayCircle size={12} className="text-accent" /> Video guide
            </p>
            <h2
              id={titleId}
              className="mt-1 text-lg font-semibold tracking-tight"
            >
              {guide.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground rounded-lg p-1.5"
          >
            <X size={18} />
          </button>
        </div>
        <GuidePlayer
          guide={guide}
          startIndex={startIndex}
          onSceneChange={onSceneChange}
          onEnd={onEnd}
          onTakeTour={onTakeTour}
        />
      </div>
    </ModalOverlay>
  );
}
