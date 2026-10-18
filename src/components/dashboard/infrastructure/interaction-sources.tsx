"use client";

import { useState } from "react";
import { Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoreInteractionSourceStatus } from "@/lib/core/api";

export const SOURCE_LABELS: Record<
  string,
  {
    label: string;
    description: string;
    /** What the customer turns on when the source is not enabled. */
    enable?: string;
  }
> = {
  service_configuration: {
    label: "Service configuration",
    description:
      "Environment variables and event sources that reference other resources.",
  },
  iam_policies: {
    label: "IAM policies",
    description: "What each workload's role is allowed to read or write.",
  },
  xray: {
    label: "AWS X-Ray",
    description: "Traced calls between services.",
    enable:
      "Instrument services with X-Ray or OpenTelemetry to trace their calls.",
  },
  vpc_flow_logs: {
    label: "VPC Flow Logs",
    description: "Observed network traffic, read from CloudWatch Logs.",
    enable:
      "Enable VPC flow logs for each VPC (to CloudWatch Logs, or plain-text to S3) — without them, resources' traffic is not visible.",
  },
  vpc_flow_logs_s3: {
    label: "VPC Flow Logs (S3)",
    description:
      "Observed network traffic, read from the flow log objects in S3 for VPCs without a CloudWatch Logs flow log.",
  },
  dns_query_logs: {
    label: "DNS query logs",
    description:
      "Names each resource looked up, read from Route 53 Resolver query logs in CloudWatch Logs; joined with flow logs to name the hosts traffic went to.",
    enable:
      "Enable Route 53 Resolver query logging for each VPC to name the external hosts traffic goes to.",
  },
  dns_query_logs_s3: {
    label: "DNS query logs (S3)",
    description:
      "The same, read from the query log objects in S3 for VPCs without CloudWatch Logs query logging.",
  },
  alb_access_logs: {
    label: "ALB access logs",
    description:
      "Requests to each load balancer and the targets it sent them to, read from its S3 access logs.",
    enable: "Turn on access logs (to S3) for each application load balancer.",
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
  partial: {
    label: "Partial",
    className: "border-orange-400/30 bg-orange-400/10 text-orange-400",
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
    (source) => source.state === "collected" || source.state === "partial",
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
          {collected < sources.length ? (
            <p className="text-muted-foreground mt-1 text-[11px] leading-4">
              A source that is off sees nothing: missing connections may only
              mean nobody looked. Each resource&apos;s Traffic tab says whether
              its own traffic was visible.
            </p>
          ) : null}
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
                    {source.stale && source.last_succeeded_at ? (
                      <p className="mt-1 text-[11px] leading-4 text-amber-400">
                        Showing facts from the last successful run,{" "}
                        {new Date(source.last_succeeded_at).toLocaleString(
                          "en",
                        )}
                        .
                      </p>
                    ) : null}
                    <p className="text-muted-foreground mt-1 text-[11px] leading-4">
                      {source.detail ?? info.description}
                    </p>
                    {source.state === "not_enabled" && info.enable ? (
                      <p className="mt-1 text-[11px] leading-4 text-sky-300">
                        {info.enable}
                      </p>
                    ) : null}
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
