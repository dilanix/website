"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Boxes,
  Braces,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  Copy,
  DollarSign,
  Info,
  Lightbulb,
  Link2,
  Maximize2,
  Network,
  PanelsTopLeft,
  Radio,
  RefreshCw,
  Rocket,
  Send,
  ShieldAlert,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { DocsIcon } from "@/content/docs/registry";
import { Portal } from "@/components/dashboard/portal";
import { cn } from "@/lib/utils";

const ICONS = {
  sparkles: Sparkles,
  rocket: Rocket,
  boxes: Boxes,
  cloud: Cloud,
  refresh: RefreshCw,
  network: Network,
  bell: Bell,
  users: Users,
  dollar: DollarSign,
  lightbulb: Lightbulb,
  app: PanelsTopLeft,
  radio: Radio,
  send: Send,
  code: Code2,
  braces: Braces,
} satisfies Record<DocsIcon, typeof Sparkles>;

export function DocsIconView({
  icon,
  size = 16,
  className,
}: {
  icon: DocsIcon;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[icon];
  return <Icon size={size} className={className} aria-hidden />;
}

/** Fades and lifts its children in the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DocHero({
  eyebrow,
  title,
  description,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: DocsIcon;
  children?: ReactNode;
}) {
  return (
    <header className="border-border-soft bg-dashboard-panel relative overflow-hidden rounded-3xl border px-6 py-8 shadow-[0_24px_60px_var(--shadow-card)] sm:px-10 sm:py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-accent/20 animate-float-slow absolute -top-24 -right-16 size-72 rounded-full blur-3xl" />
        <div className="bg-accent-secondary/15 animate-drift absolute -bottom-28 left-1/3 size-72 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)] bg-[size:28px_28px]" />
      </div>
      <div className="relative">
        <p className="text-accent flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
          <span className="border-accent/25 bg-accent/10 flex size-7 items-center justify-center rounded-lg border">
            <DocsIconView icon={icon} size={14} />
          </span>
          {eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-[15px] leading-7">
          {description}
        </p>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </header>
  );
}

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** A titled section; its heading feeds "On this page" and gets a copyable anchor. */
export function DocSection({
  title,
  children,
  id,
}: {
  title: string;
  children: ReactNode;
  id?: string;
}) {
  const anchor = id ?? slugifyHeading(title);
  const [copied, setCopied] = useState(false);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.href.split("#")[0]}#${anchor}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable; the anchor still works.
    }
  }
  return (
    <section id={anchor} data-doc-section={title} className="scroll-mt-28">
      <Reveal>
        <h2 className="group flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
          <button
            type="button"
            onClick={() => void copyLink()}
            aria-label={`Copy link to ${title}`}
            className="text-muted-foreground hover:text-accent opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            {copied ? (
              <Check size={15} className="text-success" />
            ) : (
              <Link2 size={15} />
            )}
          </button>
        </h2>
        <div className="text-muted-foreground mt-4 flex flex-col gap-4 text-[15px] leading-7">
          {children}
        </div>
      </Reveal>
    </section>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-foreground mt-2 text-base font-semibold tracking-tight">
      {children}
    </h3>
  );
}

const CALLOUTS = {
  note: {
    icon: Info,
    label: "Note",
    className:
      "border-blue-500/30 bg-blue-500/[0.07] [--callout:var(--color-blue-500)]",
  },
  tip: {
    icon: Zap,
    label: "Tip",
    className:
      "border-emerald-500/30 bg-emerald-500/[0.07] [--callout:var(--color-emerald-500)]",
  },
  important: {
    icon: Sparkles,
    label: "Important",
    className:
      "border-violet-500/30 bg-violet-500/[0.07] [--callout:var(--color-violet-500)]",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    className:
      "border-amber-500/35 bg-amber-500/[0.08] [--callout:var(--color-amber-500)]",
  },
  danger: {
    icon: ShieldAlert,
    label: "Caution",
    className:
      "border-red-500/35 bg-red-500/[0.07] [--callout:var(--color-red-500)]",
  },
} as const;

export function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: keyof typeof CALLOUTS;
  title?: string;
  children: ReactNode;
}) {
  const { icon: Icon, label, className } = CALLOUTS[tone];
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-4 text-sm leading-6",
        className,
      )}
    >
      <Icon
        size={18}
        className="mt-0.5 shrink-0 text-[var(--callout)]"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-foreground font-semibold">{title ?? label}</p>
        <div className="text-muted-foreground mt-1">{children}</div>
      </div>
    </div>
  );
}

/** A vertical, numbered timeline; each step animates in as it scrolls into view. */
export function Steps({ children }: { children: ReactNode }) {
  const steps = Children.toArray(children).filter(isValidElement);
  return (
    <ol className="relative flex flex-col gap-6">
      <span
        aria-hidden
        className="from-accent/60 via-accent/20 absolute top-3 bottom-3 left-[15px] w-px bg-gradient-to-b to-transparent"
      />
      {steps.map((step, index) => (
        <li key={index} className="relative flex gap-4">
          <Reveal delay={index * 70} className="flex w-full gap-4">
            <span className="border-accent/40 bg-background text-accent relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-semibold shadow-[0_0_0_4px_var(--background)]">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">{step}</div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

export function Step({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-foreground font-semibold">{title}</p>
      <div className="text-muted-foreground mt-1.5 flex flex-col gap-3 text-[15px] leading-7">
        {children}
      </div>
    </div>
  );
}

export function CopyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? "Copied" : "Copy"}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 transition-colors hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      {copied ? (
        <Check size={12} className="text-emerald-400" />
      ) : (
        <Copy size={12} />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export interface CodeSample {
  label: string;
  language: string;
  code: string;
}

/** Light syntax colouring: strings, numbers, keys, comments — enough to read, no dependency. */
function highlight(code: string): ReactNode[] {
  const pattern =
    /(#[^\n]*|\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(\d+(?:\.\d+)?)\b|\b(curl|import|from|const|await|async|def|return|fetch|print|func|package|let|true|false|null|None|True|False)\b/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(code)) !== null) {
    if (match.index > last) parts.push(code.slice(last, match.index));
    const [token, comment, string, number, keyword] = match;
    const className = comment
      ? "text-slate-500 italic"
      : string
        ? "text-emerald-300"
        : number
          ? "text-amber-300"
          : keyword
            ? "text-sky-300"
            : "";
    parts.push(
      <span key={key++} className={className}>
        {token}
      </span>,
    );
    last = match.index + token.length;
  }
  if (last < code.length) parts.push(code.slice(last));
  return parts;
}

export function CodeTabs({
  samples,
  title,
}: {
  samples: CodeSample[];
  title?: string;
}) {
  const [active, setActive] = useState(0);
  const sample = samples[active] ?? samples[0];
  if (!sample) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-[0_20px_50px_rgba(2,6,23,0.35)]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2">
        <div
          className="flex min-w-0 items-center gap-1 overflow-x-auto py-1.5"
          role="tablist"
          aria-label={title ?? "Code samples"}
        >
          {title ? (
            <span className="px-2 text-[11px] font-medium text-slate-400">
              {title}
            </span>
          ) : null}
          {samples.map((item, index) => (
            <button
              key={item.label}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                index === active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <CopyButton text={sample.code} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-slate-200">
        <code>{highlight(sample.code)}</code>
      </pre>
    </div>
  );
}

export function CardGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}

export function LinkCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: DocsIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href as Route}
      className="group border-border-soft bg-dashboard-panel hover:border-accent/45 relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_var(--shadow-card)]"
    >
      <span
        aria-hidden
        className="bg-accent/0 group-hover:bg-accent/10 absolute -top-10 -right-10 size-28 rounded-full blur-2xl transition-colors duration-500"
      />
      <span className="border-accent/20 bg-accent/10 text-accent flex size-9 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110">
        <DocsIconView icon={icon} size={16} />
      </span>
      <span className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
        {title}
        <ArrowRight
          size={14}
          className="text-accent -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
        />
      </span>
      <span className="text-muted-foreground text-[13px] leading-6">
        {description}
      </span>
    </Link>
  );
}

/** A framed screenshot with a browser bar; click to see it full size. */
export function Screenshot({
  src,
  alt,
  caption,
  url,
}: {
  src: string;
  alt: string;
  caption?: string;
  url?: string;
}) {
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    if (!zoomed) return;
    const close = (event: KeyboardEvent) =>
      event.key === "Escape" && setZoomed(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [zoomed]);
  return (
    <figure className="my-1">
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label={`Enlarge: ${alt}`}
        className="group border-border-soft bg-dashboard-panel relative block w-full overflow-hidden rounded-2xl border text-left shadow-[0_24px_60px_var(--shadow-card)] transition-transform duration-300 hover:-translate-y-0.5"
      >
        <span className="border-border-soft flex items-center gap-1.5 border-b px-3 py-2">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <span className="bg-foreground/5 text-muted-foreground ml-3 truncate rounded-md px-2 py-0.5 font-mono text-[10px]">
            {url ?? "app.dilanix.com"}
          </span>
        </span>
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={1000}
          className="h-auto w-full"
        />
        <span className="bg-background/80 text-foreground absolute right-3 bottom-3 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <Maximize2 size={12} /> Enlarge
        </span>
      </button>
      {caption ? (
        <figcaption className="text-muted-foreground mt-2 text-center text-xs">
          {caption}
        </figcaption>
      ) : null}
      {zoomed ? (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            className="animate-toast-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
            onClick={() => setZoomed(false)}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={() => setZoomed(false)}
            >
              <X size={18} />
            </button>
            <Image
              src={src}
              alt={alt}
              width={2400}
              height={1500}
              className="max-h-[90vh] w-auto rounded-xl shadow-2xl"
            />
          </div>
        </Portal>
      ) : null}
    </figure>
  );
}

export function DocTable({
  head,
  rows,
}: {
  /** Omit for a key/value table without a header row. */
  head?: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="border-border-soft overflow-x-auto rounded-2xl border">
      <table className="w-full text-left text-sm">
        {head ? (
          <thead className="bg-foreground/[0.03] text-foreground">
            <tr>
              {head.map((cell) => (
                <th
                  key={cell}
                  className="border-border-soft border-b px-4 py-3 font-semibold whitespace-nowrap"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody className="divide-border-soft divide-y">
          {rows.map((row, index) => (
            <tr
              key={index}
              className="hover:bg-foreground/[0.02] transition-colors"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "px-4 py-3 align-top leading-6",
                    cellIndex === 0
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Faq({
  items,
}: {
  items: { question: string; answer: ReactNode }[];
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="border-border-soft divide-border-soft divide-y overflow-hidden rounded-2xl border">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : index)}
              className="hover:bg-foreground/[0.02] text-foreground flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium"
            >
              {item.question}
              <ChevronDown
                size={16}
                className={cn(
                  "text-muted-foreground shrink-0 transition-transform duration-300",
                  expanded && "text-accent rotate-180",
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                expanded
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="text-muted-foreground px-4 pb-4 text-sm leading-6">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** An in-app link styled for running text. */
export function DocLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href as Route}
      className={cn(
        "text-accent underline-offset-2 hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="border-border-soft bg-card-strong/70 text-foreground rounded-md border px-1.5 py-0.5 font-mono text-[11px] shadow-sm">
      {children}
    </kbd>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="bg-foreground/[0.07] text-foreground rounded-md px-1.5 py-0.5 font-mono text-[13px]">
      {children}
    </code>
  );
}

export function Pill({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: "accent" | "success" | "warning" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tone === "accent" && "border-accent/30 bg-accent/10 text-accent",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "warning" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
        tone === "neutral" &&
          "border-border-soft bg-card-strong/60 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
