"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

function subscribe() {
  return () => {};
}
function getClientSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

/**
 * Renders `children` into `document.body` instead of wherever this component
 * sits in the tree. Dashboard page content renders inside `<main
 * class="relative z-0">` (`dashboard-shell.tsx`) — that `z-0` creates its own
 * stacking context, which caps every descendant's z-index below it,
 * regardless of how high a descendant's own z-index is set. A `fixed z-50`
 * modal overlay nested in there still loses to the sticky header's `z-30`,
 * since z-index only competes within the nearest shared stacking context.
 * Portaling to `document.body` escapes that context entirely.
 *
 * `useSyncExternalStore` (rather than a mount-effect + `setState`) gates
 * `createPortal` to the client, since `document` doesn't exist during SSR.
 */
export function Portal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  if (!mounted) return null;
  return createPortal(children, document.body);
}
