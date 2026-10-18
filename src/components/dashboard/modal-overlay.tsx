"use client";

import type { MouseEvent, ReactNode } from "react";
import { Portal } from "./portal";

export function ModalOverlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  function closeFromBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    event.stopPropagation();
    onClose();
  }

  return (
    <Portal>
      <div
        className="bg-background/75 fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm"
        onClick={closeFromBackdrop}
      >
        <div
          className="flex min-h-full items-center justify-center p-4 sm:p-6 [&>[role=alertdialog]]:max-h-[calc(100dvh-2rem)] [&>[role=alertdialog]]:overflow-y-auto sm:[&>[role=alertdialog]]:max-h-[calc(100dvh-3rem)] [&>[role=dialog]]:max-h-[calc(100dvh-2rem)] [&>[role=dialog]]:overflow-y-auto sm:[&>[role=dialog]]:max-h-[calc(100dvh-3rem)]"
          onClick={closeFromBackdrop}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}
