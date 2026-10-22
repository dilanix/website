"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Cloud, Loader2, Pause, Play, Users } from "lucide-react";
import type { CoreIntegrationTarget, CorePlanLimitUsage } from "@/lib/core/api";
import {
  disableTargetAction,
  resumeTargetAction,
} from "@/app/dashboard/integrations/actions";
import { formatDate, limitRatio } from "@/lib/plans/format";
import { StatusBadge } from "@/components/dashboard/primitives";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<CorePlanLimitUsage["status"], string> = {
  ok: "Within limit",
  at_limit: "At limit",
  over_limit: "Over limit",
  over_limit_grace: "Grace period",
  over_limit_blocked: "Sync paused",
};

export function LimitMeter({ limit }: { limit: CorePlanLimitUsage }) {
  const ratio = limitRatio(limit);
  const over = limit.status.startsWith("over_limit");
  const tone =
    limit.status === "over_limit_blocked"
      ? "bg-red-500"
      : over
        ? "bg-amber-500"
        : limit.status === "at_limit"
          ? "bg-accent"
          : "bg-success";

  return (
    <article className="border-border-soft bg-dashboard-panel flex flex-col gap-4 rounded-[1.35rem] border p-5 shadow-[0_16px_44px_var(--shadow-card)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="border-accent/20 bg-accent/10 text-accent flex size-9 items-center justify-center rounded-xl border">
            {limit.code.endsWith("members") ? (
              <Users size={16} />
            ) : (
              <Cloud size={16} />
            )}
          </span>
          <div>
            <h3 className="text-sm font-semibold">{limit.name}</h3>
            <p className="text-muted-foreground text-[11px]">
              {limit.limit === null
                ? "Unlimited on your plan"
                : `${limit.limit} included`}
            </p>
          </div>
        </div>
        <StatusBadge
          status={
            over ? "warning" : limit.status === "ok" ? "success" : "neutral"
          }
        >
          {STATUS_LABEL[limit.status]}
        </StatusBadge>
      </div>
      <div>
        <p className="font-mono text-3xl font-semibold tracking-[-0.05em]">
          {limit.usage}
          <span className="text-muted-foreground text-base font-medium">
            {" "}
            / {limit.limit === null ? "∞" : limit.limit}
          </span>
        </p>
        <div
          role="meter"
          aria-label={`${limit.name} usage`}
          aria-valuemin={0}
          aria-valuemax={limit.limit ?? limit.usage}
          aria-valuenow={limit.usage}
          className="bg-foreground/[0.07] mt-3 h-2 overflow-hidden rounded-full"
        >
          <div
            className={cn("h-full rounded-full transition-all", tone)}
            style={{
              width: `${limit.limit === null ? 8 : Math.max(4, ratio * 100)}%`,
            }}
          />
        </div>
      </div>
      {limit.status === "over_limit_grace" && limit.grace_ends_at ? (
        <p className="text-xs leading-5 text-amber-600 dark:text-amber-300">
          Over by {limit.usage - (limit.limit ?? 0)}. Sync keeps running until{" "}
          {formatDate(limit.grace_ends_at)} — pause or disconnect accounts
          before then.
        </p>
      ) : null}
      {limit.status === "over_limit_blocked" ? (
        <p className="text-xs leading-5 text-red-600 dark:text-red-400">
          The grace period ended, so sync is paused. It resumes on its own once
          you are within the limit.
        </p>
      ) : null}
      {limit.status === "over_limit" ? (
        <p className="text-muted-foreground text-xs leading-5">
          New ones can&apos;t be added until you are within the limit.
        </p>
      ) : null}
    </article>
  );
}

export interface PlanAccount {
  connectionId: string;
  connectionName: string;
  target: CoreIntegrationTarget;
}

function AccountRow({ account }: { account: PlanAccount }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const { target } = account;
  const paused = target.status !== "verified";

  function run(action: typeof disableTargetAction) {
    setError("");
    startTransition(async () => {
      const result = await action(account.connectionId, target.id);
      if (result.error) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-3.5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl border",
              paused
                ? "border-border-soft bg-card-strong/70 text-muted-foreground"
                : "border-success/20 bg-success/10 text-success",
            )}
          >
            <Cloud size={15} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {target.display_name || target.external_id}
            </span>
            <span className="text-muted-foreground block truncate text-[11px]">
              <span className="font-mono">{target.external_id}</span> ·{" "}
              {account.connectionName}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={paused ? "neutral" : "success"}>
            {paused ? "Paused" : "Active"}
          </StatusBadge>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(paused ? resumeTargetAction : disableTargetAction)
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
              paused
                ? "border-accent/30 text-accent hover:bg-accent/10"
                : "border-border-soft text-muted-foreground hover:border-amber-500/40 hover:text-amber-600",
            )}
          >
            {pending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : paused ? (
              <Play size={12} />
            ) : (
              <Pause size={12} />
            )}
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </li>
  );
}

/** Every connected cloud account with Pause/Resume. You choose what to pause —
 * Dilanix never pauses or removes an account for you, and paused accounts
 * keep their collected data. */
export function AccountManager({
  accounts,
  limit,
}: {
  accounts: PlanAccount[];
  limit: CorePlanLimitUsage | undefined;
}) {
  if (!accounts.length) {
    return (
      <p className="border-border-soft bg-dashboard-panel text-muted-foreground rounded-[1.35rem] border border-dashed p-6 text-sm">
        No cloud accounts are connected yet.
      </p>
    );
  }
  const over = limit?.status.startsWith("over_limit");
  return (
    <div className="border-border-soft bg-dashboard-panel overflow-hidden rounded-[1.35rem] border shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-sm">
      {over && limit?.limit !== null && limit ? (
        <p className="border-b border-amber-500/20 bg-amber-500/[0.06] px-5 py-3 text-xs leading-5 text-amber-700 dark:text-amber-300">
          Pause {limit.usage - (limit.limit ?? 0)} account
          {limit.usage - (limit.limit ?? 0) === 1 ? "" : "s"} to get back within
          your plan. Paused accounts stop syncing and keep their data.
        </p>
      ) : null}
      <ul className="divide-border-soft divide-y">
        {accounts.map((account) => (
          <AccountRow key={account.target.id} account={account} />
        ))}
      </ul>
    </div>
  );
}
