"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // `resolvedTheme` can already be resolved (from localStorage or
  // prefers-color-scheme) by the time this first renders on the client —
  // e.g. after a client-side navigation — which would mismatch the
  // server's always-light render. Gate on mount so both the server render
  // and the client's first render agree, then swap in the real value.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
