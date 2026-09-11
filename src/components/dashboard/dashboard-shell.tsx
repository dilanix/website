"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  Building2,
  Command,
  Sparkles,
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
        requiredCapability: "platform.application",
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

function getPageContext(pathname: string, product?: DashboardProduct) {
  if (product) {
    if (pathname.endsWith("/usage")) {
      return { section: product.name, page: "Usage" };
    }
    if (pathname.endsWith("/docs")) {
      return { section: product.name, page: "Documentation" };
    }
    return { section: "Products", page: product.name };
  }

  const item = navGroups
    .flatMap((group) =>
      group.items.map((entry) => ({ ...entry, section: group.label })),
    )
    .filter((entry) => isActiveItem(pathname, entry.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return item
    ? { section: item.section, page: item.label }
    : { section: "Workspace", page: "Command center" };
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

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
   const availableNavGroups = navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            (organization || !item.organizationRequired) &&
            (!("requiredCapability" in item) ||
              activeCapabilityCodes.some(
                (code) =>
                  code === item.requiredCapability ||
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
  const pageContext = getPageContext(pathname, activeProduct);
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
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                active
                  ? "border-border-soft bg-dashboard-panel-strong text-foreground border shadow-[0_8px_24px_var(--shadow-card)]"
                  : "text-muted-foreground hover:bg-surface/70 hover:text-foreground border border-transparent",
              )}
            >
              {active ? (
                <span className="bg-accent absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r-full" />
              ) : null}
              <Icon
                size={16}
                className={cn(
                  "transition-colors",
                  active ? "text-accent" : "group-hover:text-foreground/75",
                )}
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {active ? (
                <span className="bg-accent/70 size-1 rounded-full shadow-[0_0_8px_var(--accent)]" />
              ) : null}
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
    <div className="dashboard-canvas flex min-h-dvh flex-1">
      <aside className="border-border-soft bg-dashboard-sidebar sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r px-4 py-5 shadow-[18px_0_60px_var(--shadow-card)] backdrop-blur-xl md:flex">
        <div className="flex items-center justify-between px-2">
          <BrandLogo href="/dashboard" className="h-7 w-auto" priority />
          <span className="border-accent/15 bg-accent/7 text-accent flex size-7 items-center justify-center rounded-lg border">
            <Sparkles size={13} />
          </span>
        </div>
        {organization ? (
          <div className="border-border-soft bg-dashboard-panel dashboard-panel-highlight mt-6 flex items-center gap-3 rounded-2xl border p-3 shadow-[0_14px_34px_var(--shadow-card)]">
            <span className="border-accent/15 bg-accent/10 text-accent flex size-9 shrink-0 items-center justify-center rounded-xl border">
              <Building2 size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-muted-foreground block text-[9px] font-semibold tracking-[0.16em] uppercase">
                Active workspace
              </span>
              <span className="mt-0.5 block truncate text-[13px] font-semibold">
                {organization.name}
              </span>
            </span>
            <span className="bg-success size-1.5 shrink-0 rounded-full shadow-[0_0_8px_var(--success)]" />
          </div>
        ) : null}
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pb-4">{nav}</div>

        <div className="border-border-soft mt-auto border-t pt-4">
          <div className="flex items-center gap-3 px-2">
            <span
              aria-hidden="true"
              className="border-accent/15 from-accent/18 to-accent-secondary/18 text-accent flex size-9 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br text-xs font-semibold"
            >
              {initials(user.firstName, user.lastName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-muted-foreground mt-0.5 block truncate text-[10px]">
                {user.email}
              </span>
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border-soft bg-dashboard-header sticky top-0 z-30 flex h-[4.5rem] shrink-0 items-center justify-between border-b px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="border-border-soft bg-dashboard-panel text-foreground -ml-1 flex size-9 items-center justify-center rounded-xl border shadow-sm md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex min-w-0 items-center gap-3">
              <span className="border-border-soft bg-dashboard-panel text-accent hidden size-9 shrink-0 items-center justify-center rounded-xl border shadow-sm md:flex">
                <Command size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-muted-foreground truncate text-[10px] font-medium tracking-[0.12em] uppercase">
                  {pageContext.section}
                </p>
                <p className="truncate text-sm font-semibold tracking-tight">
                  {pageContext.page}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="border-border-soft bg-dashboard-panel rounded-xl border shadow-sm">
              <ThemeToggle />
            </div>
            <div className="border-border-soft bg-dashboard-panel hidden items-center gap-2.5 rounded-xl border py-1.5 pr-3 pl-1.5 shadow-sm sm:flex">
              <span
                aria-hidden="true"
                className="from-accent/18 to-accent-secondary/18 text-accent flex size-7 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-semibold"
              >
                {initials(user.firstName, user.lastName)}
              </span>
              <span className="max-w-28 truncate text-xs font-medium">
                {user.firstName}
              </span>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Sign out"
                title="Sign out"
                className="border-border-soft bg-dashboard-panel text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-xl border shadow-sm transition-colors"
              >
                <LogOut size={15} />
              </button>
            </form>
          </div>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard menu"
              className="border-border-soft bg-dashboard-sidebar animate-menu-reveal relative flex h-full w-[min(88vw,20rem)] flex-col border-r px-4 py-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between px-2">
                <BrandLogo href="/dashboard" className="h-7 w-auto" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="border-border-soft bg-dashboard-panel text-muted-foreground flex size-9 items-center justify-center rounded-xl border"
                >
                  <X size={18} />
                </button>
              </div>
              {organization ? (
                <div className="border-border-soft bg-dashboard-panel mt-5 flex items-center gap-3 rounded-2xl border p-3">
                  <span className="bg-accent/10 text-accent flex size-9 items-center justify-center rounded-xl">
                    <Building2 size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="text-muted-foreground block text-[9px] font-semibold tracking-[0.14em] uppercase">
                      Active workspace
                    </span>
                    <span className="block truncate text-sm font-semibold">
                      {organization.name}
                    </span>
                  </span>
                </div>
              ) : null}
              <div className="mt-6 min-h-0 flex-1 overflow-y-auto pb-6">
                {nav}
              </div>
              <div className="border-border-soft flex items-center gap-3 border-t px-2 pt-4">
                <span className="from-accent/18 to-accent-secondary/18 text-accent flex size-9 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-semibold">
                  {initials(user.firstName, user.lastName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-muted-foreground block truncate text-[10px]">
                    {user.email}
                  </span>
                </span>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="relative z-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-[96rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
