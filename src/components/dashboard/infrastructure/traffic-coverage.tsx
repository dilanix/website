"use client";

import { EyeOff, Eye, CircleMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CoreResourceTrafficCoverage,
  CoreSignalCoverage,
  CoreTrafficState,
} from "@/lib/core/api";
import { SOURCE_LABELS } from "./interaction-sources";

const STATES: Record<
  CoreTrafficState | CoreSignalCoverage["state"],
  { label: string; className: string }
> = {
  covered: {
    label: "Visible",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  },
  partial: {
    label: "Partly visible",
    className: "border-orange-400/30 bg-orange-400/10 text-orange-400",
  },
  none: {
    label: "Not visible",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  },
  not_observable: {
    label: "Cannot be observed",
    className: "border-border-soft text-muted-foreground",
  },
  not_applicable: {
    label: "Not applicable",
    className: "border-border-soft text-muted-foreground",
  },
};

const SIGNALS: Record<CoreSignalCoverage["signal"], string> = {
  network_traffic: "Network traffic (VPC flow logs)",
  load_balancer_requests: "Requests (access logs)",
  name_lookups: "Name lookups (DNS query logs) — not traffic",
};

const SUMMARY: Record<CoreTrafficState, string> = {
  covered:
    "Every flow or request of this resource over the period was read: a missing connection here means none was seen.",
  partial:
    "Only part of this resource's traffic over the period was read — connections may be missing.",
  none: "Nothing that can see this resource's traffic was read. Missing connections do not mean it is unused.",
  not_observable:
    "No source Dilanix reads can show this resource's traffic (it is not in a network). Its connections come from configuration only.",
};

/** What the customer can turn on so the traffic becomes visible, by reason. */
function remedy(reasons: string[]): string | null {
  const text = reasons.join(" ").toLowerCase();
  if (text.includes("no flow log"))
    return "Enable VPC flow logs for its VPC (to CloudWatch Logs, or plain-text to S3). The next Runtime Interactions run reads them.";
  if (text.includes("no query log"))
    return "Enable Route 53 Resolver query logging for its VPC to see which hosts it looks up.";
  if (text.includes("access logs are off"))
    return "Turn on access logs for this load balancer (to S3).";
  if (text.includes("could not be listed"))
    return "Update the onboarding stack to the current Dilanix template so the integration role can read the log bucket.";
  if (text.includes("no network address"))
    return "Dilanix does not know its addresses yet; they are learned from its network interfaces on the next run.";
  return null;
}

function day(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

function Chip({ state }: { state: keyof typeof STATES }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STATES[state].className,
      )}
    >
      {STATES[state].label}
    </span>
  );
}

/** Resource inspector → Traffic: whether this resource's traffic could be
 *  seen at all, signal by signal, and what would make it visible. */
export function TrafficCoverage({
  coverage,
}: {
  coverage: CoreResourceTrafficCoverage | null;
}) {
  if (!coverage)
    return (
      <p className="text-muted-foreground text-xs leading-5">
        Traffic coverage could not be read right now.
      </p>
    );
  const { state, since, signals } = coverage.coverage;
  const Icon =
    state === "covered"
      ? Eye
      : state === "not_observable"
        ? CircleMinus
        : EyeOff;
  const hint = remedy(signals.flatMap((signal) => signal.reasons));
  return (
    <div className="flex flex-col gap-3">
      <div className="border-border-soft flex items-start gap-2.5 rounded-xl border p-3">
        <Icon size={16} className="text-muted-foreground mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Last 7 days</span>
            <Chip state={state} />
          </div>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            {SUMMARY[state]}
          </p>
          <p className="text-muted-foreground/80 mt-1 text-[11px]">
            Since {day(since)}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {signals.map((signal) => (
          <li
            key={signal.signal}
            className="border-border-soft rounded-xl border p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">
                {SIGNALS[signal.signal]}
              </span>
              <Chip state={signal.state} />
            </div>
            {signal.source ? (
              <p className="text-muted-foreground mt-1 text-[11px]">
                {SOURCE_LABELS[signal.source]?.label ?? signal.source}
                {signal.visible_until
                  ? ` · read ${Math.round(signal.read_ratio * 100)}% of the period, last ${day(signal.visible_until)}`
                  : ""}
                {signal.gaps ? ` · ${signal.gaps} gap(s)` : ""}
              </p>
            ) : null}
            {signal.reasons.length ? (
              <ul className="text-muted-foreground mt-1.5 list-disc pl-4 text-[11px] leading-5">
                {signal.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
      {hint && state !== "covered" ? (
        <p className="rounded-xl border border-sky-400/25 bg-sky-400/[0.06] p-3 text-xs leading-5 text-sky-200">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
