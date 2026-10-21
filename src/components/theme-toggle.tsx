"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

function subscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const activeTheme = mounted ? theme ?? resolvedTheme ?? "light" : "light";
  const isDark = activeTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground flex h-8 w-8 items-center justify-center rounded-md transition-colors"
      aria-label={mounted
        ? isDark
          ? "Switch to light theme"
          : "Switch to dark theme"
        : "Toggle theme"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
