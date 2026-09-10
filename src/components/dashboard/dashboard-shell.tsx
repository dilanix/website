"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KeyRound,
  CircleDollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Boxes,
  ChevronRight,
  Package,
  PanelsTopLeft,
  Plug,
  Activity,
  Server,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/dashboard/actions";
import type { DashboardProduct } from "@/lib/data/dashboard-mocks";
import { BrandLogo } from "@/components/layout/brand-logo";

const navGroups = [
  {
    label: "Workspace",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        organizationRequired: true,
      },
      {
        label: "Resources",
        href: "/dashboard/resources",
        icon: Boxes,
        organizationRequired: true,
        requiredCapability: "inventory.read",
      },
      {
        label: "Applications",
        href: "/dashboard/applications",
        icon: PanelsTopLeft,
        organizationRequired: true,
      },
      {
        label: "Costs",
        href: "/dashboard/costs",
        icon: CircleDollarSign,
        organizationRequired: true,
        requiredCapability: "billing.read",
      },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        label: "Integrations",
        href: "/dashboard/integrations",
        icon: Plug,
        organizationRequired: true,
      },
      {
        label: "API Keys",
        href: "/dashboard/api-keys",
        icon: KeyRound,
        organizationRequired: true,
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        organizationRequired: false,
      },
    ],
  },
] as const;

function isActiveItem(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getProductVisual(product: DashboardProduct) {
  const identity = `${product.slug} ${product.name}`.toLowerCase();

  if (/automation|workflow/.test(identity)) {
    return {
      icon: Workflow,
      iconClassName: "border-violet-500/20 bg-violet-500/10 text-violet-500",
      glowClassName: "bg-violet-500",
      markerClassName: "bg-violet-500",
    };
  }
  if (/cost|billing|finops/.test(identity)) {
    return {
      icon: CircleDollarSign,
      iconClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
      glowClassName: "bg-emerald-500",
      markerClassName: "bg-emerald-500",
    };
  }
  if (/observ|pulse|monitor|telemetr/.test(identity)) {
    return {
      icon: Activity,
      iconClassName: "border-cyan-500/20 bg-cyan-500/10 text-cyan-500",
      glowClassName: "bg-cyan-500",
      markerClassName: "bg-cyan-500",
    };
  }
  if (/security|guard|protect/.test(identity)) {
    return {
      icon: ShieldCheck,
      iconClassName: "border-rose-500/20 bg-rose-500/10 text-rose-500",
      glowClassName: "bg-rose-500",
      markerClassName: "bg-rose-500",
    };
  }
  if (/infra|cloud|storage|dena/.test(identity)) {
    return {
      icon: Server,
      iconClassName: "border-blue-500/20 bg-blue-500/10 text-blue-500",
      glowClassName: "bg-blue-500",
      markerClassName: "bg-blue-500",
    };
  }
  return {
    icon: Package,
    iconClassName: "border-accent/20 bg-accent/10 text-accent",
    glowClassName: "bg-accent",
    markerClassName: "bg-accent",
  };
}

export function DashboardShell({
  user,
  organization,
  products,
  activeCapabilityCodes,
  children,
}: {
  user: { firstName: string; lastName: string; email: string };
  organization: { name: string } | null;
  products: DashboardProduct[];
  activeCapabilityCodes: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const availableNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (organization || !item.organizationRequired) &&
          (!("requiredCapability" in item) ||
            activeCapabilityCodes.some((code) =>
              code.endsWith(`.${item.requiredCapability}`),
            )),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const activeProducts = organization
    ? products.filter((product) => product.status === "active")
    : [];
  const activeProduct = activeProducts.find(
    (product) =>
      pathname === product.href || pathname.startsWith(`${product.href}/`),
  );
  const activeProductId = activeProduct?.id ?? null;
  const renderNavGroup = (group: (typeof availableNavGroups)[number]) => (
    <div key={group.label}>
      <p className="text-muted-foreground mb-1.5 px-3 text-[10px] font-semibold tracking-[0.16em] uppercase">
        {group.label}
      </p>
      <div className="flex flex-col gap-1">
        {group.items.map((item) => {
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
                  ? "text-accent bg-[linear-gradient(135deg,color-mix(in_oklab,var(--accent)_16%,transparent),color-mix(in_oklab,var(--accent-secondary)_18%,transparent))]"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );

  const nav = (
    <nav aria-label="Dashboard navigation" className="flex flex-col gap-5">
      {availableNavGroups.slice(0, 1).map(renderNavGroup)}
      {activeProducts.length > 0 ? (
        <div>
          <div className="text-muted-foreground mb-2 flex items-center gap-2 px-3 text-[10px] font-semibold tracking-[0.16em] uppercase">
            <Boxes size={12} />
            <span>Products</span>
            <span className="bg-foreground/[0.055] ml-auto rounded-full px-1.5 py-0.5 font-mono text-[9px] tracking-normal">
              {activeProducts.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {activeProducts.map((product) => {
              const productActive = activeProductId === product.id;
              const visual = getProductVisual(product);
              const ProductIcon = visual.icon;

              return (
                <Link
                  key={product.id}
                  href={product.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === product.href ? "page" : undefined}
                  className={cn(
                    "group focus-visible:ring-accent/35 relative isolate flex min-h-14 items-center gap-3 overflow-hidden rounded-xl border px-2.5 py-2.5 text-sm transition-all duration-200 outline-none focus-visible:ring-2",
                    productActive
                      ? "border-border-soft bg-card-strong text-foreground shadow-[0_10px_28px_var(--shadow-card)]"
                      : "text-muted-foreground hover:border-border-soft hover:bg-surface/70 hover:text-foreground border-transparent hover:-translate-y-px hover:shadow-[0_8px_22px_var(--shadow-card)]",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-y-0 -left-8 -z-10 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300",
                      visual.glowClassName,
                      productActive
                        ? "opacity-[0.14]"
                        : "group-hover:opacity-[0.08]",
                    )}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1/2 left-0 h-7 w-0.5 -translate-y-1/2 rounded-r-full transition-opacity",
                      visual.markerClassName,
                      productActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span
                    className={cn(
                      "relative flex size-9 shrink-0 items-center justify-center rounded-[10px] border shadow-sm transition-transform duration-200 group-hover:scale-[1.04]",
                      visual.iconClassName,
                    )}
                  >
                    <ProductIcon
                      aria-hidden="true"
                      size={17}
                      strokeWidth={1.8}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] leading-4 font-semibold text-current">
                      {product.name}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-muted-foreground mt-0.5 block truncate text-[10px] leading-4"
                    >
                      {product.description}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    size={14}
                    className={cn(
                      "shrink-0 transition-all duration-200 group-hover:translate-x-0.5",
                      productActive
                        ? "opacity-70"
                        : "opacity-30 group-hover:opacity-70",
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
      {availableNavGroups.slice(1).map(renderNavGroup)}
    </nav>
  );

  return (
    <div className="flex flex-1">
      <aside className="border-border-soft bg-card-strong/72 hidden w-64 shrink-0 flex-col border-r px-4 py-5 shadow-[0_20px_56px_var(--shadow-card)] backdrop-blur-sm md:flex">
        <div className="px-3">
          <BrandLogo href="/dashboard" className="h-7 w-auto" />
        </div>
        {organization ? (
          <div className="border-border-soft bg-surface/72 mt-6 rounded-2xl border px-3 py-2.5 shadow-[0_12px_28px_var(--shadow-card)]">
            <span className="text-muted-foreground block text-[10px] tracking-wider uppercase">
              Organization
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium">
              {organization.name}
            </span>
          </div>
        ) : null}
        <div className="mt-5">{nav}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border-soft bg-background/58 flex h-16 shrink-0 items-center justify-between border-b px-4 backdrop-blur-sm sm:px-6">
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
          <div className="border-border-soft bg-card-strong/80 border-b px-4 py-4 backdrop-blur-sm md:hidden">
            {nav}
          </div>
        ) : null}

        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
