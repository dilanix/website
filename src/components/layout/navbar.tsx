"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { NavLink } from "@/types";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background/80 border-foreground/5 sticky top-0 z-50 border-b backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-foreground text-sm font-semibold tracking-[0.25em]"
        >
          DILANIX
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Sign in
          </a>
          <Button href="#products" className="px-4 py-2 text-sm">
            Explore products
          </Button>
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
        <div className="border-foreground/5 border-t md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-md px-2 py-2.5 text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-md px-2 py-2.5 text-sm transition-colors"
            >
              Sign in
            </a>
            <Button
              href="#products"
              onClick={() => setOpen(false)}
              className="mt-2"
            >
              Explore products
            </Button>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
