"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Lightbulb, ShieldCheck, Terminal } from "lucide-react";
import { demoRecommendations, formatUsd } from "@/components/product/demo-data";
import { cn } from "@/lib/utils";

const ready = demoRecommendations.filter((item) => item.command);
const CYCLE_MS = 4200;

function usePrefersReducedMotion() {
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  return reduced;
}

/**
 * The hero's living preview: ranked recommendations take turns, and the
 * selected one's verified CLI fix types itself out below.
 */
export function HeroPreview() {
  const reducedMotion = usePrefersReducedMotion();
  const [{ active, typed }, setState] = useState({ active: 0, typed: 0 });
  const [cycleKey, setCycleKey] = useState(0);
  const command = ready[active].command;

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(
      () =>
        setState((current) => ({
          active: (current.active + 1) % ready.length,
          typed: 0,
        })),
      CYCLE_MS,
    );
    return () => window.clearInterval(timer);
  }, [reducedMotion, cycleKey]);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(
      () =>
        setState((current) =>
          current.typed >= command.length
            ? current
            : { ...current, typed: current.typed + 2 },
        ),
      22,
    );
    return () => window.clearInterval(timer);
  }, [command, reducedMotion]);

  const total = ready.reduce((sum, item) => sum + item.savingUsd, 0);
  const shown = reducedMotion ? command : command.slice(0, typed);

  return (
    <div className="border-border-soft bg-card-strong/72 relative mx-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] border p-5 shadow-[0_28px_80px_var(--shadow-brand)] backdrop-blur-xl sm:p-6">
      <div
        aria-hidden="true"
        className="bg-accent/12 pointer-events-none absolute -top-24 -right-20 size-64 rounded-full blur-[80px]"
      />
      <div className="border-border-soft/70 relative flex items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <span className="border-accent/20 bg-accent/10 text-accent flex size-9 items-center justify-center rounded-xl border">
            <Lightbulb size={16} />
          </span>
          <div>
            <p className="text-muted-foreground text-[9px] font-semibold tracking-[0.16em] uppercase">
              Recommendations · ranked
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              <span className="text-success font-mono">{formatUsd(total)}</span>{" "}
              / month ready to fix
            </p>
          </div>
        </div>
        <span className="border-accent/20 bg-accent/8 text-accent rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-wide uppercase">
          Sample
        </span>
      </div>

      <ul className="relative mt-4 space-y-2">
        {ready.map((item, index) => {
          const selected = index === active;
          return (
            <li key={item.rank}>
              <button
                type="button"
                onClick={() => {
                  setState({ active: index, typed: 0 });
                  setCycleKey((key) => key + 1);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-500",
                  selected
                    ? "border-accent/45 bg-accent/8 shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_8%,transparent)]"
                    : "border-border-soft bg-surface/50 opacity-70 hover:opacity-100",
                )}
              >
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                    selected
                      ? "bg-accent text-accent-foreground"
                      : "bg-foreground/[0.06] text-muted-foreground",
                  )}
                >
                  #{item.rank}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">
                    {item.title}
                  </span>
                  <span className="text-muted-foreground block truncate text-[10px]">
                    {item.resourceName} · {item.resourceKind}
                  </span>
                </span>
                <span className="text-success shrink-0 font-mono text-xs font-semibold">
                  {formatUsd(item.savingUsd)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-border-soft relative mt-4 overflow-hidden rounded-2xl border bg-[#060b16] text-[#d7e3f4] shadow-inner">
        <div className="flex items-center justify-between gap-2 border-b border-white/8 px-3 py-2">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-white/70">
            <Terminal size={12} /> How to fix · AWS CLI
          </span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">
            <BadgeCheck size={11} /> Verified: {ready[active].verifiedAgainst}
          </span>
        </div>
        <pre className="min-h-[4.5rem] px-3 py-3 font-mono text-[10.5px] leading-5 break-all whitespace-pre-wrap">
          <span className="text-emerald-300">$ </span>
          {shown}
          {!reducedMotion ? (
            <span className="animate-breathe ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-[#d7e3f4]/80" />
          ) : null}
        </pre>
      </div>

      <p className="text-muted-foreground relative mt-3 flex items-center gap-1.5 text-[10px]">
        <ShieldCheck size={12} className="text-success" />
        You review and run every step — Dilanix never changes your account.
      </p>
    </div>
  );
}
