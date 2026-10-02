"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { getCostOverviewHighlightsAction } from "@/app/dashboard/products/cost-actions";
import type { CoreCostOverviewHighlights } from "@/lib/core/api";
import { formatAmount } from "@/components/dashboard/cost/format";

/**
 * What needs attention right now: budgets over or forecast to overrun, and
 * open anomalies — straight from Core's `GET .../cost/overview/highlights`
 * (budget health is the same read the hourly evaluation uses). Renders a
 * single quiet "all clear" line when nothing does.
 */
export function CostAttentionStrip({
  periodStart,
  periodEnd,
  scopeSuffix,
}: {
  periodStart: string;
  periodEnd: string;
  scopeSuffix: string;
}) {
  const [highlights, setHighlights] =
    useState<CoreCostOverviewHighlights | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCostOverviewHighlightsAction({ periodStart, periodEnd }).then(
      (response) => {
        if (!cancelled) setHighlights(response.data ?? null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [periodStart, periodEnd]);

  if (!highlights) return null;
  const { budgets, anomalies } = highlights;
  const needsAttention = budgets.attention.length > 0 || anomalies.open > 0;

  if (!needsAttention) {
    return (
      <p className="text-muted-foreground mt-3 inline-flex items-center gap-1.5 text-xs">
        <CheckCircle2 size={13} className="text-success" />
        {budgets.total > 0
          ? `All ${budgets.total} budget${budgets.total === 1 ? "" : "s"} on track`
          : "No budgets set"}
        {" · "}no open anomalies
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle
            size={15}
            className="text-amber-600 dark:text-amber-300"
          />
          Needs attention
        </h3>
        <div className="flex gap-3 text-xs font-semibold">
          {budgets.attention.length > 0 ? (
            <Link
              href={`/dashboard/products/cost/budgets${scopeSuffix}` as Route}
              className="text-accent inline-flex items-center gap-1"
            >
              Budgets <ArrowRight size={12} />
            </Link>
          ) : null}
          {anomalies.open > 0 ? (
            <Link
              href={`/dashboard/products/cost/anomalies${scopeSuffix}` as Route}
              className="text-accent inline-flex items-center gap-1"
            >
              Anomalies <ArrowRight size={12} />
            </Link>
          ) : null}
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-xs">
        {budgets.attention.map((status) => (
          <li
            key={status.budget_id}
            className="flex flex-wrap items-baseline justify-between gap-2"
          >
            <span className="font-medium">{status.name}</span>
            <span className="text-muted-foreground font-mono">
              {status.health === "over_budget"
                ? `over budget: ${formatAmount(Number(status.spent), status.currency)} of ${formatAmount(Number(status.limit), status.currency)}`
                : `forecast ${formatAmount(Number(status.forecast_amount ?? 0), status.currency)} of ${formatAmount(Number(status.limit), status.currency)} (${Math.round(status.forecast_usage_percent ?? 0)}%)`}
            </span>
          </li>
        ))}
        {anomalies.open > 0 ? (
          <li className="text-muted-foreground">
            {anomalies.open} open cost anomal
            {anomalies.open === 1 ? "y" : "ies"}
            {anomalies.acknowledged > 0
              ? `, ${anomalies.acknowledged} acknowledged`
              : ""}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
