"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Boxes,
  Building2,
  ChevronRight,
  CircleDollarSign,
  Command,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Plug,
  RefreshCw,
  Server,
  Settings,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  CostView,
  FixGuidePanel,
  InfrastructureView,
  OverviewView,
  RecommendationsView,
  SyncView,
} from "@/components/product/demo/demo-views";
import {
  DEMO_PRODUCTS,
  DEMO_USER,
  DEMO_WORKSPACE,
} from "@/components/product/demo-data";
import { cn } from "@/lib/utils";

export type DemoView =
  "overview" | "cost" | "recommendations" | "infrastructure" | "sync";

const STEP_MS = 9000;

/** The tour: what each screen shows, in the order a customer meets them. */
const steps: { id: DemoView; label: string; caption: string }[] = [
  {
    id: "overview",
    label: "Overview",
    caption: "Every connected account and its health at a glance.",
  },
  {
    id: "cost",
    label: "Cost",
    caption: "Effective spend from your FOCUS bill, budgets and cost drivers.",
  },
  {
    id: "recommendations",
    label: "Recommendations",
    caption:
      "Ranked, reviewed savings — open one, then How to fix for verified steps.",
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    caption:
      "What talks to what, and the evidence behind every line. Click a resource.",
  },
  {
    id: "sync",
    label: "Sync",
    caption: "Each dataset on its own schedule, with its freshness and health.",
  },
];

const PAGE_CONTEXT: Record<DemoView, { section: string; page: string }> = {
  overview: { section: "Workspace", page: "Overview" },
  recommendations: { section: "Workspace", page: "Recommendations" },
  cost: { section: "Products", page: "Cost" },
  infrastructure: { section: "Products", page: "Infrastructure" },
  sync: { section: "Manage", page: "Sync" },
};

const PRODUCT_VISUALS: Record<
  string,
  { icon: LucideIcon; iconClassName: string; glow: string }
> = {
  cost: {
    icon: CircleDollarSign,
    iconClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    glow: "bg-emerald-500",
  },
  infrastructure: {
    icon: Server,
    iconClassName: "border-blue-500/20 bg-blue-500/10 text-blue-500",
    glow: "bg-blue-500",
  },
};

/** The dashboard is drawn at a desktop size and scaled to fit the page;
 *  narrow screens get it at their own width, like the real mobile layout. */
const SCREEN_WIDTH = 1440;
const SCREEN_HEIGHT = 900;
const MOBILE_HEIGHT = 720;

function useScreenScale(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(SCREEN_WIDTH);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  const mobile = width < 700;
  return mobile
    ? { mobile, scale: 1, screenWidth: width, screenHeight: MOBILE_HEIGHT }
    : {
        mobile,
        scale: Math.min(1, width / SCREEN_WIDTH),
        screenWidth: SCREEN_WIDTH,
        screenHeight: SCREEN_HEIGHT,
      };
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  trailing,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      tabIndex={onClick ? 0 : -1}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200",
        active
          ? "border-border-soft bg-dashboard-panel-strong text-foreground border shadow-[0_8px_24px_var(--shadow-card)]"
          : "text-muted-foreground border border-transparent",
        onClick && !active && "hover:bg-surface/70 hover:text-foreground",
        !onClick && "cursor-default",
      )}
    >
      {active ? (
        <span className="bg-accent absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r-full" />
      ) : null}
      <Icon size={16} className={active ? "text-accent" : undefined} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing}
      {active ? (
        <span className="bg-accent/70 size-1 rounded-full shadow-[0_0_8px_var(--accent)]" />
      ) : null}
    </button>
  );
}

function Sidebar({
  view,
  onSelect,
}: {
  view: DemoView;
  onSelect: (view: DemoView) => void;
}) {
  const group = (label: string) => (
    <p className="text-muted-foreground mb-1.5 px-3 text-[10px] font-semibold tracking-[0.16em] uppercase">
      {label}
    </p>
  );
  return (
    <aside className="border-border-soft bg-dashboard-sidebar flex h-full w-72 shrink-0 flex-col border-r px-4 py-5 shadow-[18px_0_60px_var(--shadow-card)]">
      <div className="flex items-center justify-between px-2">
        <BrandLogo href="/#demo" className="h-7 w-auto" />
        <span className="border-accent/15 bg-accent/7 text-accent flex size-7 items-center justify-center rounded-lg border">
          <Sparkles size={13} />
        </span>
      </div>
      <div className="border-border-soft bg-dashboard-panel dashboard-panel-highlight mt-6 flex items-center gap-3 rounded-2xl border p-3 shadow-[0_14px_34px_var(--shadow-card)]">
        <span className="border-accent/15 bg-accent/10 text-accent flex size-9 shrink-0 items-center justify-center rounded-xl border">
          <Building2 size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-muted-foreground block text-[9px] font-semibold tracking-[0.16em] uppercase">
            Active workspace
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-semibold">
            {DEMO_WORKSPACE}
          </span>
        </span>
        <span className="bg-success size-1.5 shrink-0 rounded-full shadow-[0_0_8px_var(--success)]" />
      </div>

      <nav
        aria-label="Sample dashboard navigation"
        className="mt-6 flex min-h-0 flex-1 flex-col gap-5 overflow-hidden"
      >
        <div>
          {group("Workspace")}
          <div className="flex flex-col gap-1">
            <NavItem
              icon={LayoutDashboard}
              label="Overview"
              active={view === "overview"}
              onClick={() => onSelect("overview")}
            />
            <NavItem
              icon={Lightbulb}
              label="Recommendations"
              active={view === "recommendations"}
              onClick={() => onSelect("recommendations")}
            />
          </div>
        </div>
        <div>
          <div className="text-muted-foreground mb-2 flex items-center gap-2 px-3 text-[10px] font-semibold tracking-[0.16em] uppercase">
            <Boxes size={12} />
            <span>Products</span>
            <span className="bg-foreground/[0.055] ml-auto rounded-full px-1.5 py-0.5 font-mono text-[9px] tracking-normal">
              {DEMO_PRODUCTS.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {DEMO_PRODUCTS.map((product) => {
              const visual = PRODUCT_VISUALS[product.slug]!;
              const Icon = visual.icon;
              const active = view === product.slug;
              return (
                <button
                  key={product.slug}
                  type="button"
                  onClick={() => onSelect(product.slug as DemoView)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative isolate flex min-h-14 items-center gap-3 overflow-hidden rounded-xl border px-2.5 py-2.5 text-left text-sm transition-all duration-200",
                    active
                      ? "border-border-soft bg-card-strong text-foreground shadow-[0_10px_28px_var(--shadow-card)]"
                      : "text-muted-foreground hover:border-border-soft hover:bg-surface/70 hover:text-foreground border-transparent",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-y-0 -left-8 -z-10 w-24 rounded-full blur-2xl transition-opacity duration-300",
                      visual.glow,
                      active ? "opacity-[0.14]" : "opacity-0",
                    )}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1/2 left-0 h-7 w-0.5 -translate-y-1/2 rounded-r-full",
                      visual.glow,
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span
                    className={cn(
                      "relative flex size-9 shrink-0 items-center justify-center rounded-[10px] border shadow-sm",
                      visual.iconClassName,
                    )}
                  >
                    <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
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
                      "shrink-0",
                      active ? "opacity-70" : "opacity-30",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
        <div>
          {group("Manage")}
          <div className="flex flex-col gap-1">
            <NavItem icon={Plug} label="Integrations" />
            <NavItem
              icon={RefreshCw}
              label="Sync"
              active={view === "sync"}
              onClick={() => onSelect("sync")}
            />
            <NavItem icon={Bell} label="Notifications" />
            <NavItem icon={KeyRound} label="API Keys" />
            <NavItem icon={Settings} label="Settings" />
          </div>
        </div>
      </nav>

      <div className="border-border-soft mt-auto border-t pt-4">
        <div className="border-border-soft bg-dashboard-panel text-muted-foreground relative mb-3 flex items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 text-[13px] font-medium">
          <span className="border-accent/20 bg-accent/10 text-accent flex size-7 items-center justify-center rounded-lg border">
            <BookOpen size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block">Documentation</span>
            <span className="text-muted-foreground block text-[10px] font-normal">
              Guides and API reference
            </span>
          </span>
          <ChevronRight size={14} />
        </div>
        <div className="flex items-center gap-3 px-2">
          <span className="border-accent/15 from-accent/18 to-accent-secondary/18 text-accent flex size-9 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br text-xs font-semibold">
            AM
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">
              {DEMO_USER.firstName} {DEMO_USER.lastName}
            </span>
            <span className="text-muted-foreground mt-0.5 block truncate text-[10px]">
              {DEMO_USER.email}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function Header({ view, mobile }: { view: DemoView; mobile: boolean }) {
  const context = PAGE_CONTEXT[view];
  return (
    <header className="border-border-soft bg-dashboard-header z-30 flex h-[4.5rem] shrink-0 items-center justify-between border-b px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {mobile ? (
          <span className="border-border-soft bg-dashboard-panel text-foreground -ml-1 flex size-9 items-center justify-center rounded-xl border shadow-sm">
            <Menu size={20} />
          </span>
        ) : (
          <span className="border-border-soft bg-dashboard-panel text-accent flex size-9 shrink-0 items-center justify-center rounded-xl border shadow-sm">
            <Command size={16} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-[10px] font-medium tracking-[0.12em] uppercase">
            {context.section}
          </p>
          <p className="truncate text-sm font-semibold tracking-tight">
            {context.page}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="border-border-soft bg-dashboard-panel text-muted-foreground flex size-9 items-center justify-center rounded-xl border shadow-sm">
          <Sun size={15} />
        </span>
        {!mobile ? (
          <span className="border-border-soft bg-dashboard-panel flex items-center gap-2.5 rounded-xl border py-1.5 pr-3 pl-1.5 shadow-sm">
            <span className="from-accent/18 to-accent-secondary/18 text-accent flex size-7 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-semibold">
              AM
            </span>
            <span className="text-xs font-medium">{DEMO_USER.firstName}</span>
          </span>
        ) : null}
        <span className="border-border-soft bg-dashboard-panel text-muted-foreground flex size-9 items-center justify-center rounded-xl border shadow-sm">
          <LogOut size={15} />
        </span>
      </div>
    </header>
  );
}

/**
 * The marketing product tour: the real dashboard's layout and components,
 * rendered with sample data. It walks through the screens on its own until
 * the visitor clicks anything inside.
 */
export function GuidedDashboardDemo() {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { mobile, scale, screenWidth, screenHeight } = useScreenScale(frameRef);
  const [view, setView] = useState<DemoView>("overview");
  const [autoplay, setAutoplay] = useState(true);
  const [paused, setPaused] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);
  const [graphSelection, setGraphSelection] = useState<string | null>(null);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const playing = autoplay && !paused && !reducedMotion;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const index = steps.findIndex((step) => step.id === view);
      setView(steps[(index + 1) % steps.length]!.id);
      setFixOpen(false);
      setGraphSelection(null);
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, view]);

  useEffect(() => {
    contentRef.current?.scrollTo?.({ top: 0 });
  }, [view]);

  function go(next: DemoView) {
    setView(next);
    setAutoplay(false);
    setFixOpen(false);
    setGraphSelection(null);
  }

  const current = steps.find((step) => step.id === view) ?? steps[0]!;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Product tour"
        className="mb-4 flex flex-wrap items-center justify-center gap-2"
      >
        {steps.map((step, index) => {
          const active = step.id === view;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => go(step.id)}
              className={cn(
                "relative flex items-center gap-2 overflow-hidden rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-accent/50 bg-accent/10 text-foreground"
                  : "border-border-soft bg-card-strong/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full font-mono text-[10px]",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "bg-foreground/[0.06]",
                )}
              >
                {index + 1}
              </span>
              {step.label}
              {active && playing ? (
                <span
                  key={view}
                  className="bg-accent absolute inset-x-3 bottom-0 h-px origin-left"
                  style={{ animation: `demo-progress ${STEP_MS}ms linear` }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground mb-5 text-center text-sm">
        {current.caption}
      </p>

      <div
        className="border-border-soft bg-card-strong/82 relative overflow-hidden rounded-[1.65rem] border p-2 shadow-[0_34px_90px_var(--shadow-brand)] backdrop-blur-xl sm:p-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDownCapture={() => setAutoplay(false)}
        // Links inside the sample lead into the real dashboard; keep visitors here.
        onClickCapture={(event) => {
          if ((event.target as HTMLElement).closest("a"))
            event.preventDefault();
        }}
      >
        <div
          ref={frameRef}
          className="border-border-soft overflow-hidden rounded-[1.25rem] border"
          style={{ height: screenHeight * scale }}
        >
          <div
            className="dashboard-canvas relative flex origin-top-left"
            style={{
              width: screenWidth,
              height: screenHeight,
              transform: scale === 1 ? undefined : `scale(${scale})`,
            }}
          >
            {!mobile ? <Sidebar view={view} onSelect={go} /> : null}
            <div className="relative flex min-w-0 flex-1 flex-col">
              <Header view={view} mobile={mobile} />
              <div
                ref={contentRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              >
                <main className="relative z-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                  <div
                    key={view}
                    className="animate-[demo-panel-in_.35s_ease-out] motion-reduce:animate-none"
                  >
                    {view === "overview" ? (
                      <OverviewView />
                    ) : view === "cost" ? (
                      <CostView />
                    ) : view === "recommendations" ? (
                      <RecommendationsView onOpenFix={() => setFixOpen(true)} />
                    ) : view === "infrastructure" ? (
                      <InfrastructureView
                        selectedId={graphSelection}
                        onSelect={setGraphSelection}
                      />
                    ) : (
                      <SyncView />
                    )}
                  </div>
                </main>
              </div>
              {fixOpen && view === "recommendations" ? (
                <FixGuidePanel onClose={() => setFixOpen(false)} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
