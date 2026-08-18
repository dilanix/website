"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

function subscribe() {
  return () => {};
}

/**
 * `false` during SSR and the client's first render, `true` right after
 * hydration — React re-renders automatically once hydration completes, no
 * effect-driven `setState` needed. `resolvedTheme` can already be resolved
 * (from localStorage or prefers-color-scheme) by the time this first runs
 * on the client — e.g. after a client-side navigation — which would
 * otherwise mismatch the server's always-light render.
 */
function useHasMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHasMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground flex h-8 w-8 items-center justify-center rounded-md transition-colors"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
