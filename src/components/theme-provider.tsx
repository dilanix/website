"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      themes={["light", "dark"]}
      defaultTheme="light"
      enableSystem={false}
      storageKey="theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
