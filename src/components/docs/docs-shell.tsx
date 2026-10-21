"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  DOCS_PAGES,
  DOCS_SECTIONS,
  docsHref,
  neighbours,
  type DocsPageMeta,
} from "@/content/docs/registry";
import { DocsIconView, Kbd } from "./doc-blocks";
import { cn } from "@/lib/utils";

function currentSlug(pathname: string) {
  return (
    pathname.replace(/^\/dashboard\/docs\/?/, "").split("/")[0] || "welcome"
  );
}

function matches(page: DocsPageMeta, query: string) {
  const haystack = [page.title, page.description, ...(page.keywords ?? [])]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function DocsSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(0);
  const results = useMemo(
    () =>
      query.trim()
        ? DOCS_PAGES.filter((page) => matches(page, query)).slice(0, 7)
        : [],
    [query],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(page: DocsPageMeta) {
    setQuery("");
    inputRef.current?.blur();
    router.push(docsHref(page.slug) as Route);
  }

  return (
    <div className="relative">
      <label className="border-border-soft bg-background/70 focus-within:border-accent/50 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors">
        <Search
          size={14}
          className="text-muted-foreground shrink-0"
          aria-hidden
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setCursor(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown")
              setCursor((value) => Math.min(value + 1, results.length - 1));
            if (event.key === "ArrowUp")
              setCursor((value) => Math.max(value - 1, 0));
            if (event.key === "Enter" && results[cursor]) go(results[cursor]);
            if (event.key === "Escape") setQuery("");
          }}
          placeholder="Search docs"
          aria-label="Search documentation"
          className="placeholder:text-muted-foreground w-full min-w-0 bg-transparent text-sm outline-none"
        />
        <span className="hidden shrink-0 items-center gap-0.5 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </label>
      {focused && query.trim() ? (
        <div
          role="listbox"
          className="border-border-soft bg-background animate-menu-reveal absolute top-full right-0 left-0 z-30 mt-2 overflow-hidden rounded-xl border shadow-2xl"
        >
          {results.length === 0 ? (
            <p className="text-muted-foreground px-3 py-3 text-xs">
              No pages match “{query}”.
            </p>
          ) : (
            results.map((page, index) => (
              <button
                key={page.slug}
                type="button"
                role="option"
                aria-selected={index === cursor}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => go(page)}
                onMouseEnter={() => setCursor(index)}
                className={cn(
                  "flex w-full items-start gap-2.5 px-3 py-2.5 text-left",
                  index === cursor && "bg-accent/10",
                )}
              >
                <DocsIconView
                  icon={page.icon}
                  size={14}
                  className="text-accent mt-0.5 shrink-0"
                />
                <span className="min-w-0">
                  <span className="text-foreground block text-sm font-medium">
                    {page.title}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {page.description}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function DocsNav({
  slug,
  onNavigate,
}: {
  slug: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-5">
      {DOCS_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="text-muted-foreground mb-1.5 px-2 text-[10px] font-semibold tracking-[0.16em] uppercase">
            {section.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.pages.map((page) => {
              const active = page.slug === slug;
              return (
                <li key={page.slug}>
                  <Link
                    href={docsHref(page.slug) as Route}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors",
                      active
                        ? "bg-accent/10 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                    )}
                  >
                    {active ? (
                      <span className="bg-accent absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-r-full" />
                    ) : null}
                    <DocsIconView
                      icon={page.icon}
                      size={14}
                      className={cn(
                        "shrink-0",
                        active ? "text-accent" : "group-hover:text-foreground",
                      )}
                    />
                    {page.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** "On this page": every `DocSection` heading, the one in view highlighted. */
function OnThisPage({ slug }: { slug: string }) {
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-doc-section]"),
    );
    // Read once the new page has rendered; never set state synchronously in the effect.
    const frame = requestAnimationFrame(() =>
      setItems(
        sections.map((section) => ({
          id: section.id,
          title: section.dataset.docSection ?? section.id,
        })),
      ),
    );
    if (typeof IntersectionObserver === "undefined" || sections.length === 0)
      return () => cancelAnimationFrame(frame);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [slug]);

  if (items.length < 2) return null;
  return (
    <nav aria-label="On this page" className="text-[13px]">
      <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-[0.16em] uppercase">
        On this page
      </p>
      <ul className="border-border-soft flex flex-col border-l">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l py-1 pl-3 transition-colors",
                active === item.id
                  ? "border-accent text-accent font-medium"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function PreviousNext({ slug }: { slug: string }) {
  const { previous, next } = neighbours(slug);
  return (
    <div className="border-border-soft mt-14 grid gap-3 border-t pt-8 sm:grid-cols-2">
      {previous ? (
        <Link
          href={docsHref(previous.slug) as Route}
          className="group border-border-soft hover:border-accent/40 rounded-2xl border p-4 transition-colors"
        >
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <ArrowLeft
              size={13}
              className="transition-transform group-hover:-translate-x-0.5"
            />{" "}
            Previous
          </span>
          <span className="text-foreground mt-1 block text-sm font-semibold">
            {previous.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={docsHref(next.slug) as Route}
          className="group border-border-soft hover:border-accent/40 rounded-2xl border p-4 text-right transition-colors"
        >
          <span className="text-muted-foreground flex items-center justify-end gap-1 text-xs">
            Next{" "}
            <ArrowRight
              size={13}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
          <span className="text-foreground mt-1 block text-sm font-semibold">
            {next.title}
          </span>
        </Link>
      ) : null}
    </div>
  );
}

export function DocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const slug = currentSlug(pathname);
  const wide = slug === "api-reference";
  const [menuOpen, setMenuOpen] = useState(false);
  const current = DOCS_PAGES.find((page) => page.slug === slug);

  return (
    <div className="flex gap-8 xl:gap-10">
      <aside className="sticky top-24 hidden h-[calc(100dvh-7.5rem)] w-60 shrink-0 flex-col gap-5 overflow-y-auto pr-1 pb-6 lg:flex">
        <Link
          href={"/dashboard/docs" as Route}
          className="flex items-center gap-2 px-2 text-sm font-semibold"
        >
          <span className="border-accent/25 bg-accent/10 text-accent flex size-7 items-center justify-center rounded-lg border">
            <BookOpen size={14} />
          </span>
          Documentation
        </Link>
        <DocsSearch />
        <DocsNav slug={slug} />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-5 flex flex-col gap-3 lg:hidden">
          <DocsSearch />
          <button
            type="button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className="border-border-soft bg-dashboard-panel flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm"
          >
            <span className="flex items-center gap-2">
              {current ? (
                <DocsIconView
                  icon={current.icon}
                  size={14}
                  className="text-accent"
                />
              ) : null}
              {current?.title ?? "Documentation"}
            </span>
            <ChevronDown
              size={15}
              className={cn("transition-transform", menuOpen && "rotate-180")}
            />
          </button>
          {menuOpen ? (
            <div className="border-border-soft bg-dashboard-panel animate-toast-in rounded-2xl border p-3">
              <DocsNav slug={slug} onNavigate={() => setMenuOpen(false)} />
            </div>
          ) : null}
        </div>
        <article
          key={slug}
          className={cn(
            "animate-toast-in @container mx-auto flex w-full flex-col gap-12",
            wide ? "max-w-none" : "max-w-3xl",
          )}
        >
          {children}
        </article>
        {current ? <PreviousNext slug={slug} /> : null}
      </div>

      {wide ? null : (
        <aside className="sticky top-24 hidden h-fit w-52 shrink-0 xl:block">
          <OnThisPage slug={slug} />
        </aside>
      )}
    </div>
  );
}
