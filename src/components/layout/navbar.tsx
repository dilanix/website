"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { NavLink } from "@/types";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

function isActiveLink(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({
  links,
  calendlyUrl,
}: {
  links: NavLink[];
  calendlyUrl: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(
    () => typeof window !== "undefined" && window.scrollY > 8,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The session cookie is httpOnly, so it can't be read from client JS —
  // ask the server instead. Re-checked on every navigation so sign-in /
  // sign-out are reflected without a full page reload.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data: { authenticated?: boolean }) => {
        if (!cancelled) setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        if (!cancelled) setAuthenticated(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 backdrop-blur-md transition-colors duration-300",
        scrolled
          ? "bg-background/90 border-foreground/10 border-b"
          : "bg-background/0 border-b border-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-foreground text-sm font-semibold tracking-[0.25em]"
        >
          DILANIX
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active = isActiveLink(pathname, link.href);
            return (
              <a
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-1 text-sm transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="bg-accent absolute -bottom-[1px] left-0 h-px w-full"
                  />
                ) : null}
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {authenticated ? (
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Sign in
              </Link>
              <Button
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm"
              >
                Book a demo
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-foreground -mr-2 p-2"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </Container>

      {open ? (
        <div
          className="border-foreground/10 bg-background animate-menu-reveal border-t motion-reduce:animate-none md:hidden"
          style={{ transformOrigin: "top" }}
        >
          <Container className="flex flex-col gap-1 py-6">
            {links.map((link) => {
              const active = isActiveLink(pathname, link.href);
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-3 text-base font-medium transition-colors",
                    active
                      ? "bg-foreground/5 text-foreground"
                      : "text-foreground hover:bg-foreground/5",
                  )}
                >
                  {link.label}
                </a>
              );
            })}

            <div className="border-foreground/10 mt-3 flex flex-col gap-3 border-t pt-4">
              {authenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground px-3 text-sm transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground px-3 text-sm transition-colors"
                  >
                    Sign in
                  </Link>
                  <Button
                    href={calendlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="justify-center"
                  >
                    Book a demo
                  </Button>
                </>
              )}
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
