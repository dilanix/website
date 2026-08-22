"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  KeyRound,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Boxes,
  ChevronsUpDown,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/dashboard/actions";
import type { DashboardProduct } from "@/lib/data/dashboard-mocks";

const navItems = [
  { label: "Products", href: "/dashboard/products", icon: LayoutGrid },
  { label: "API Keys", href: "/dashboard/api-keys", icon: KeyRound },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
] as const;

function isActiveItem(pathname: string, href: string) {
  return pathname.startsWith(href);
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function DashboardShell({
  user,
  organization,
  products,
  children,
}: {
  user: { firstName: string; lastName: string; email: string };
  organization: { id: string; name: string } | null;
  products: DashboardProduct[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Dashboard navigation" className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = isActiveItem(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
      <div className="border-foreground/10 my-4 border-t" />
      {products
        .filter((product) => product.status === "active")
        .map((product) => (
          <div key={product.id} className="mb-3">
            <div className="text-muted-foreground mb-1 flex items-center gap-2 px-3 text-[10px] font-semibold tracking-[0.16em] uppercase">
              <Boxes size={12} /> {product.name}
            </div>
            {product.navigation.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== `/dashboard/products/${product.slug}` &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "ml-3 flex items-center rounded-lg border-l px-4 py-2 text-sm transition-colors",
                    active
                      ? "border-accent bg-accent/8 text-foreground"
                      : "border-foreground/10 text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
    </nav>
  );

  return (
    <div className="flex flex-1">
      <aside className="border-foreground/10 bg-card-strong/30 hidden w-60 shrink-0 flex-col border-r px-4 py-5 md:flex">
        <Link
          href="/dashboard"
          className="text-foreground px-3 text-sm font-semibold tracking-[0.25em]"
        >
          DILANIX
        </Link>
        <button
          type="button"
          aria-label="Switch organization"
          className="border-foreground/10 hover:bg-foreground/5 mt-6 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors"
        >
          <span>
            <span className="text-muted-foreground block text-[10px] tracking-wider uppercase">
              Organization
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium">
              {organization?.name ?? "No organization"}
            </span>
          </span>
          <ChevronsUpDown className="text-muted-foreground" size={14} />
        </button>
        <div className="mt-5">{nav}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-foreground/10 flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-foreground -ml-2 p-2 md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <p className="text-muted-foreground hidden text-sm md:block">
              Welcome back, {user.firstName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span
              aria-hidden="true"
              className="bg-accent/10 text-accent hidden h-8 w-8 items-center justify-center rounded-full text-xs font-medium sm:flex"
            >
              {initials(user.firstName, user.lastName)}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        {open ? (
          <div className="border-foreground/10 bg-background border-b px-4 py-4 md:hidden">
            {nav}
          </div>
        ) : null}

        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
