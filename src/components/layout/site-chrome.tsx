"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { NavLink, SiteSettings } from "@/types";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

/**
 * The dashboard renders its own sidebar/topbar shell, so the marketing
 * header and footer are hidden for every `/dashboard` route instead of
 * being duplicated inside each page.
 */
export function SiteChrome({
  links,
  calendlyUrl,
  settings,
  children,
}: {
  links: NavLink[];
  calendlyUrl: string;
  settings: SiteSettings;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <>
      {isDashboard ? null : <Navbar links={links} calendlyUrl={calendlyUrl} />}
      <main className="flex flex-1 flex-col">{children}</main>
      {isDashboard ? null : <Footer settings={settings} />}
    </>
  );
}
