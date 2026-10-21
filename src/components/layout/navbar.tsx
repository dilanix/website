"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import type { NavGroup, NavItem, NavLink } from "@/types";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./brand-logo";

function isActiveLink(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

function ActiveUnderline() {
  return (
    <span
      aria-hidden="true"
      className="bg-accent absolute -bottom-[1px] left-0 h-px w-full"
    />
  );
}

function NavDropdown({
  group,
  pathname,
  open,
  onOpenChange,
}: {
  group: NavGroup;
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const active = group.children.some((link) =>
    isActiveLink(pathname, link.href),
  );
  const panelId = `nav-${group.label.toLowerCase()}`;

  return (
    <div
      className="relative"
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
    >
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "relative flex items-center gap-1 py-1 text-sm transition-colors",
          active || open
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {group.label}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn("transition-transform", open && "rotate-180")}
        />
        {active ? <ActiveUnderline /> : null}
      </button>
      {open ? (
        // pt-3 bridges the gap to the trigger so moving the pointer down
        // into the panel doesn't fire onMouseLeave and close it.
        <div
          id={panelId}
          className="absolute top-full left-1/2 -translate-x-1/2 pt-3"
        >
          <div className="border-border-soft bg-background w-72 rounded-2xl border p-2 shadow-[0_24px_60px_var(--shadow-card)]">
            {group.children.map((link) => {
              const linkActive = isActiveLink(pathname, link.href);
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => onOpenChange(false)}
                  aria-current={linkActive ? "page" : undefined}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 transition-colors",
                    linkActive ? "bg-foreground/5" : "hover:bg-foreground/5",
                  )}
                >
                  <span className="text-foreground block text-sm font-medium">
                    {link.label}
                  </span>
                  {link.description ? (
                    <span className="text-muted-foreground mt-0.5 block text-xs">
                      {link.description}
                    </span>
                  ) : null}
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileLink({
  link,
  pathname,
  onNavigate,
}: {
  link: NavLink;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isActiveLink(pathname, link.href);
  return (
    <a
      href={link.href}
      onClick={onNavigate}
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
}

export function Navbar({
  links,
  calendlyUrl,
}: {
  links: NavItem[];
  calendlyUrl: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  // null = not resolved yet. The session cookie is httpOnly, so the real
  // state is only known after the /api/auth/session round trip below —
  // defaulting to a guess (signed in or out) causes a visible flash from
  // the wrong state to the right one on every load. Rendering nothing for
  // this slot until resolved avoids that flash entirely.
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);

  useEffect(() => {
    let frame = 0;

    const syncScrolled = () => {
      const next = window.scrollY > 8;
      if (next !== scrolledRef.current) {
        scrolledRef.current = next;
        setScrolled(next);
      }
      frame = 0;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncScrolled);
    };

    syncScrolled();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
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

  useEffect(() => {
    if (!openGroup) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenGroup(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenGroup(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openGroup]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-border-soft bg-background/96 border-b shadow-[0_12px_34px_var(--shadow-card)]"
          : "bg-background/0 border-b border-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <BrandLogo className="h-7 w-auto" priority />

        <nav ref={navRef} className="hidden items-center gap-8 md:flex">
          {links.map((item) => {
            if (isGroup(item)) {
              return (
                <NavDropdown
                  key={item.label}
                  group={item}
                  pathname={pathname}
                  open={openGroup === item.label}
                  onOpenChange={(next) =>
                    setOpenGroup(next ? item.label : null)
                  }
                />
              );
            }
            const active = isActiveLink(pathname, item.href);
            return (
              <a
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-1 text-sm transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {active ? <ActiveUnderline /> : null}
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {authenticated === true ? (
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Dashboard
            </Link>
          ) : authenticated === false ? (
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
          ) : null}
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
            {links.map((item) =>
              isGroup(item) ? (
                <div
                  key={item.label}
                  className="border-foreground/10 flex flex-col gap-1 border-t py-3 first:border-t-0 first:pt-0"
                >
                  <p className="text-muted-foreground px-3 pb-1 text-[11px] font-semibold tracking-[0.14em] uppercase">
                    {item.label}
                  </p>
                  {item.children.map((link) => (
                    <MobileLink
                      key={link.label}
                      link={link}
                      pathname={pathname}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </div>
              ) : (
                <div
                  key={item.label}
                  className="border-foreground/10 flex flex-col border-t py-3 first:border-t-0 first:pt-0"
                >
                  <MobileLink
                    link={item}
                    pathname={pathname}
                    onNavigate={() => setOpen(false)}
                  />
                </div>
              ),
            )}

            <div className="border-foreground/10 flex flex-col gap-3 border-t pt-4">
              {authenticated === true ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground px-3 text-sm transition-colors"
                >
                  Dashboard
                </Link>
              ) : authenticated === false ? (
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
              ) : null}
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
