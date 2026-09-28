"use client";

import { useState } from "react";
import { Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoreInteractionSourceStatus } from "@/lib/core/api";

const SOURCE_LABELS: Record<string, { label: string; description: string }> = {
  service_configuration: {
    label: "Service configuration",
    description:
      "Environment variables and event sources that reference other resources.",
  },
  iam_policies: {
    label: "IAM policies",
    description: "What each workload's role is allowed to read or write.",
  },
  xray: { label: "AWS X-Ray", description: "Traced calls between services." },
  vpc_flow_logs: {
    label: "VPC Flow Logs",
    description: "Observed network traffic.",
  },
  ai_inference: {
    label: "AI inference",
    description:
      "Dependencies suggested from configuration and redacted logs, with confidence.",
  },
};

const STATE_STYLES: Record<
  CoreInteractionSourceStatus["state"],
  { label: string; className: string }
> = {
  collected: {
    label: "Collected",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  },
  empty: {
    label: "Nothing found",
    className: "border-border-soft text-muted-foreground",
  },
  not_enabled: {
    label: "Not enabled",
    className: "border-sky-400/30 bg-sky-400/10 text-sky-400",
  },
  not_permitted: {
    label: "No permission",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  },
  failed: {
    label: "Failed",
    className: "border-rose-400/30 bg-rose-400/10 text-rose-400",
  },
};

/** Runtime-mode panel: where interactions come from, and why a source is silent. */
export function InteractionSources({
  sources,
}: {
  sources: CoreInteractionSourceStatus[];
}) {
  const [open, setOpen] = useState(false);
  const collected = sources.filter(
    (source) => source.state === "collected",
  ).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
          open && "text-foreground bg-foreground/5",
        )}
      >
        <Radar size={13} />
        Sources
        <span className="font-mono text-[10px]">
          {collected}/{sources.length}
        </span>
      </button>
      {open ? (
        <div className="border-border-soft bg-dashboard-panel-strong absolute top-10 right-0 z-30 w-[22rem] rounded-xl border p-3 shadow-[0_18px_48px_var(--shadow-card)]">
          <p className="text-sm font-semibold">Interaction sources</p>
          {sources.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-xs leading-5">
              Runtime interactions are collected by the “Runtime Interactions”
              sync dataset. Run it from the connection’s Sync tab to populate
              this view.
            </p>
          ) : (
            <ul className="mt-2 flex max-h-80 flex-col gap-2 overflow-y-auto">
              {sources.map((source) => {
                const info = SOURCE_LABELS[source.source] ?? {
                  label: source.source,
                  description: "",
                };
                const state = STATE_STYLES[source.state];
                return (
                  <li
                    key={`${source.source}:${source.region}`}
                    className="border-border-soft rounded-lg border p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{info.label}</span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          state.className,
                        )}
                      >
                        {state.label}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-[11px] leading-4">
                      {source.region} · {source.evidence_count} facts ·{" "}
                      {new Date(source.collected_at).toLocaleString("en")}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[11px] leading-4">
                      {source.detail ?? info.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
