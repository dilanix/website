import Link from "next/link";
import type { Route } from "next";
import {
  CoreApiError,
  querySpendTrends,
  type CoreCurrencySpendTrend,
  type CoreSpendTrends,
} from "@/lib/core/api";
import {
  SPEND_TREND_RANGES,
  parseSpendTrendRange,
  spendTrendPeriod,
} from "@/lib/billing/spend-trends";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState, StatusBadge } from "@/components/dashboard/primitives";
import { formatAmount } from "@/components/dashboard/cost/format";
import { cn } from "@/lib/utils";

type SearchParams = Record<string, string | string[] | undefined>;

function hrefWith(
  searchParams: SearchParams,
  overrides: Record<string, string>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || key in overrides) continue;
    for (const item of Array.isArray(value) ? value : [value])
      query.append(key, item);
  }
  for (const [key, value] of Object.entries(overrides)) query.set(key, value);
  return `/dashboard/products/cost?${query.toString()}` as Route;
}

function bucketLabel(iso: string, monthly: boolean) {
  return new Intl.DateTimeFormat(
    undefined,
    monthly
      ? { month: "short", year: "2-digit", timeZone: "UTC" }
      : { month: "short", day: "numeric", timeZone: "UTC" },
  ).format(new Date(iso));
}

function changeLabel(changePercent: number | null) {
  if (changePercent === null) return "No previous-period baseline";
  if (changePercent === 0) return "Unchanged from the previous period";
  return `${Math.abs(changePercent).toFixed(1)}% ${changePercent > 0 ? "higher" : "lower"} than the previous period`;
}

/** Current vs. previous period per bucket. Negative buckets (credits netting
 * out usage) render as empty bars; exact amounts stay in each bar's title and
 * the detail table. */
function ComparisonBars({
  trend,
  monthly,
}: {
  trend: CoreCurrencySpendTrend;
  monthly: boolean;
}) {
  const peak = Math.max(
    0,
    ...trend.items.flatMap((item) => [
      Number(item.current_amount),
      Number(item.previous_amount),
    ]),
  );
  const height = (amount: string) =>
    peak > 0 ? `${(Math.max(0, Number(amount)) / peak) * 100}%` : "0%";
  const labelEvery = Math.max(1, Math.ceil(trend.items.length / 8));
  return (
    <div>
      <div
        className="flex h-44 items-end gap-[3px]"
        role="img"
        aria-label={`Spend per ${monthly ? "month" : "day"}, current and previous period`}
      >
        {trend.items.map((item) => (
          <div
            key={item.bucket_start}
            className="flex h-full min-w-0 flex-1 items-end gap-px"
          >
            <span
              className="bg-muted-foreground/25 w-1/2 rounded-t-sm"
              style={{ height: height(item.previous_amount) }}
              title={`${bucketLabel(item.previous_bucket_start, monthly)} · ${formatAmount(Number(item.previous_amount), trend.currency)}`}
            />
            <span
              className="bg-accent w-1/2 rounded-t-sm"
              style={{ height: height(item.current_amount) }}
              title={`${bucketLabel(item.bucket_start, monthly)} · ${formatAmount(Number(item.current_amount), trend.currency)}`}
            />
          </div>
        ))}
      </div>
      <div className="text-muted-foreground mt-2 flex gap-[3px] text-[10px]">
        {trend.items.map((item, index) => (
          <span key={item.bucket_start} className="min-w-0 flex-1 truncate">
            {index % labelEvery === 0
              ? bucketLabel(item.bucket_start, monthly)
              : ""}
          </span>
        ))}
      </div>
      <div className="text-muted-foreground mt-3 flex gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-accent size-2 rounded-sm" /> Current period
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-muted-foreground/25 size-2 rounded-sm" /> Previous
          period
        </span>
      </div>
    </div>
  );
}

function CurrencyTrend({
  trend,
  monthly,
}: {
  trend: CoreCurrencySpendTrend;
  monthly: boolean;
}) {
  return (
    <section className="border-border-soft bg-dashboard-panel rounded-2xl border p-5 shadow-[0_16px_44px_var(--shadow-card)]">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={`Current · ${trend.currency}`}
          value={formatAmount(Number(trend.current_total), trend.currency)}
        />
        <StatCard
          label={`Previous · ${trend.currency}`}
          value={formatAmount(Number(trend.previous_total), trend.currency)}
        />
        <StatCard
          label="Change"
          tone={Number(trend.absolute_delta) < 0 ? "success" : "default"}
          value={
            <>
              <span className="block">
                {Number(trend.absolute_delta) > 0 ? "+" : ""}
                {formatAmount(Number(trend.absolute_delta), trend.currency)}
              </span>
              <span className="text-muted-foreground mt-1 block text-xs font-normal tracking-normal">
                {changeLabel(trend.change_percent)}
              </span>
            </>
          }
        />
      </div>
      <div className="mt-6">
        <ComparisonBars trend={trend} monthly={monthly} />
      </div>
      <details className="mt-5">
        <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium">
          {monthly ? "Monthly" : "Daily"} detail
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left text-[11px] tracking-wide uppercase">
              <tr>
                <th className="py-2 pr-4 font-medium">
                  {monthly ? "Month" : "Day"}
                </th>
                <th className="py-2 pr-4 text-right font-medium">Current</th>
                <th className="py-2 pr-4 text-right font-medium">Previous</th>
                <th className="py-2 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody className="divide-border-soft divide-y">
              {trend.items.map((item) => (
                <tr key={item.bucket_start}>
                  <td className="py-2 pr-4">
                    {bucketLabel(item.bucket_start, monthly)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {formatAmount(Number(item.current_amount), trend.currency)}
                  </td>
                  <td className="text-muted-foreground py-2 pr-4 text-right tabular-nums">
                    {formatAmount(Number(item.previous_amount), trend.currency)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {item.change_percent === null
                      ? "—"
                      : `${item.change_percent > 0 ? "+" : ""}${item.change_percent.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

/** Cost → Overview → Trends: spend per day or month against the immediately
 * preceding equal-length period, from Core's spend-trends read (FOCUS, with a
 * disclosed Cost Explorer fallback for unscoped trends). */
export async function CostTrends({
  organizationId,
  token,
  connectionId,
  targetId,
  searchParams,
}: {
  organizationId: string;
  token: string;
  connectionId: string | null;
  targetId: string | null;
  searchParams: SearchParams;
}) {
  const rangeParam = Array.isArray(searchParams.range)
    ? searchParams.range[0]
    : searchParams.range;
  const rangeId = parseSpendTrendRange(rangeParam);
  const period = spendTrendPeriod(rangeId);
  const monthly = period.granularity === "monthly";

  let trends: CoreSpendTrends;
  try {
    trends = await querySpendTrends(organizationId, token, {
      period_start: period.periodStart,
      period_end: period.periodEnd,
      granularity: period.granularity,
      connection_id: connectionId,
      target_id: targetId,
    });
  } catch (error) {
    if (!(error instanceof CoreApiError)) throw error;
    return (
      <EmptyState
        title="Trends are unavailable for this scope"
        description={error.message}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Trend range"
          className="border-border-soft bg-dashboard-panel flex w-fit gap-1 rounded-lg border p-1 text-xs"
        >
          {SPEND_TREND_RANGES.map((range) => (
            <Link
              key={range.id}
              href={hrefWith(searchParams, { view: "trends", range: range.id })}
              aria-current={range.id === rangeId ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                range.id === rangeId
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {range.label}
            </Link>
          ))}
        </nav>
        <StatusBadge
          status={trends.source === "cost_usage" ? "success" : "neutral"}
        >
          {trends.source === "cost_usage" ? "FOCUS" : "Cost Explorer"} ·
          effective cost
        </StatusBadge>
      </div>
      {trends.by_currency.length === 0 ? (
        <EmptyState
          title="No spend in this range"
          description="Nothing was billed in this period or the one before it for the selected scope. Choose a longer range or another cost data scope."
        />
      ) : (
        trends.by_currency.map((trend) => (
          <CurrencyTrend key={trend.currency} trend={trend} monthly={monthly} />
        ))
      )}
    </div>
  );
}
