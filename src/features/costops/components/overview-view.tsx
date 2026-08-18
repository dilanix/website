"use client";
import { useState } from "react";
import Link from "next/link";
import { Cloud, RefreshCw } from "lucide-react";
import {
  EmptyState,
  Metric,
  PageHeader,
  Section,
  Skeleton,
} from "@/components/dashboard/primitives";
import { useCostOps } from "../costops-context";
import { formatCurrency, formatPercentage, formatRelativeTime } from "../utils";
import { getCostDateRange, isValidCostDateRange } from "../date-ranges";
import type {
  CostDatePreset,
  CostSeriesGroupBy,
  OverviewPeriod,
} from "../types";
import {
  COST_GROUP_OPTIONS,
  OVERVIEW_PERIOD_METADATA,
  OVERVIEW_PERIOD_OPTIONS,
  TREND_RANGE_OPTIONS,
} from "../config";
import { DateRangeFields, SegmentedControl } from "./filter-controls";

export function OverviewView() {
  const api = useCostOps();
  const [overview, setOverview] = useState(api.overview);
  const [overviewPeriod, setOverviewPeriod] =
    useState<OverviewPeriod>("current_month");
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [series, setSeries] = useState(api.snapshot.costSeries);
  const [range, setRange] = useState(api.snapshot.defaultCostRange);
  const [trendPreset, setTrendPreset] = useState<CostDatePreset | "custom">(
    "last_30_days",
  );
  const [groupBy, setGroupBy] = useState<CostSeriesGroupBy>("day");
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [filterError, setFilterError] = useState("");
  const connected = api.integrations.filter(
    (item) => item.status === "connected",
  );
  const pending = api.integrations.find((item) => item.status === "pending");
  const failed = connected.find((item) => item.lastSyncStatus === "failed");
  const syncing = connected.some((item) => Boolean(api.activeSyncs[item.id]));
  if (!api.integrations.length)
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="CostOps"
          description="Cloud and AI infrastructure cost visibility and optimization."
        />
        <EmptyState
          title="Start with your first integration"
          description="Connect a cloud provider so CostOps can analyze real infrastructure spending."
          actions={
            <Link
              href="/dashboard/costops/integrations"
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              Connect AWS
            </Link>
          }
        />
        <p className="text-muted-foreground -mt-4 text-center text-xs">
          <Cloud size={13} className="mr-1 inline" />
          Read-only billing access · No AWS access keys required
        </p>
      </div>
    );
  if (!connected.length && pending)
    return (
      <div className="space-y-8">
        <PageHeader
          title="CostOps"
          description="Cloud and AI infrastructure cost visibility and optimization."
        />
        <EmptyState
          title="Finish connecting AWS"
          description="Your AWS integration setup is not complete."
          actions={
            <Link
              href="/dashboard/costops/integrations"
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
            >
              Continue setup
            </Link>
          }
        />
      </div>
    );
  if (!api.overview.lastSyncedAt && syncing)
    return (
      <div className="space-y-8">
        <PageHeader title="CostOps" description="Importing AWS cost data" />
        <div className="border-foreground/10 rounded-xl border p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <RefreshCw size={15} className="animate-spin" />
            Your AWS connection is ready. CostOps is importing recent billing
            history.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="mt-6 h-52" />
        </div>
      </div>
    );
  if (!api.overview.lastSyncedAt && failed)
    return (
      <div className="space-y-8">
        <PageHeader
          title="CostOps"
          description="Cloud and AI infrastructure cost visibility and optimization."
        />
        <EmptyState
          title="Cost sync failed"
          description="The AWS connection is active, but billing data could not be imported."
          actions={
            <>
              <button
                type="button"
                disabled={api.syncStarting.has(failed.id)}
                onClick={() => api.syncNow(failed.id)}
                className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
              >
                {api.syncStarting.has(failed.id) ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Starting sync…
                  </>
                ) : (
                  "Retry sync"
                )}
              </button>
              <Link
                href="/dashboard/costops/integrations"
                className="border-foreground/15 rounded-lg border px-4 py-2 text-sm"
              >
                Manage integration
              </Link>
            </>
          }
        />
      </div>
    );
  async function selectOverviewPeriod(period: OverviewPeriod) {
    setOverviewPeriod(period);
    setOverviewLoading(true);
    setFilterError("");
    try {
      setOverview(await api.queryOverview(period));
    } catch (error) {
      setFilterError(
        error instanceof Error ? error.message : "Unable to load overview.",
      );
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadSeries(nextRange = range, nextGroup = groupBy) {
    if (!isValidCostDateRange(nextRange)) {
      setFilterError("Choose a valid start and end date.");
      return;
    }
    setSeriesLoading(true);
    setFilterError("");
    try {
      setSeries(
        await api.queryCostSeries({
          start_date: nextRange.startDate,
          end_date: nextRange.endDate,
          group_by: nextGroup,
        }),
      );
    } catch (error) {
      setFilterError(
        error instanceof Error ? error.message : "Unable to load cost trend.",
      );
    } finally {
      setSeriesLoading(false);
    }
  }

  function selectTrendPreset(preset: CostDatePreset) {
    const nextRange = getCostDateRange(preset);
    setTrendPreset(preset);
    setRange(nextRange);
    void loadSeries(nextRange, groupBy);
  }

  const data = overview;
  const max = Math.max(...series.map((point) => Number(point.amount)), 1);
  const zero = Number(data.currentTotal.amount) === 0;
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="CostOps"
        description="Cloud and AI infrastructure cost visibility and optimization."
        action={
          <p className="text-muted-foreground flex items-center gap-2 text-xs sm:pt-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${syncing ? "bg-accent animate-pulse" : "bg-success"}`}
            />
            {syncing
              ? "Refreshing cost data…"
              : `Updated ${formatRelativeTime(data.lastSyncedAt)}`}
          </p>
        }
      />
      {filterError ? (
        <p role="alert" className="-mt-6 text-sm text-red-500">
          {filterError}
        </p>
      ) : null}
      {zero ? (
        <EmptyState
          title="No AWS spend found for this period"
          description="Your integration synchronized successfully, but no cost data was returned for this date range."
        />
      ) : null}
      <Section
        title="Spend summary"
        action={
          <SegmentedControl
            label="Overview period"
            value={overviewPeriod}
            options={OVERVIEW_PERIOD_OPTIONS}
            disabled={overviewLoading}
            onChange={selectOverviewPeriod}
          />
        }
      >
        <dl
          className={`border-foreground/10 grid grid-cols-2 gap-y-6 rounded-xl border px-5 py-6 transition-opacity lg:grid-cols-4 ${overviewLoading ? "opacity-50" : ""}`}
        >
          <Metric
            label="Total spend"
            value={formatCurrency(data.currentTotal)}
            detail={OVERVIEW_PERIOD_METADATA[overviewPeriod].currentLabel}
          />
          <Metric
            label="Previous period"
            value={formatCurrency(data.previousTotal)}
            detail={OVERVIEW_PERIOD_METADATA[overviewPeriod].comparisonLabel}
          />
          <Metric
            label="Change"
            value={formatPercentage(data.changePercent)}
            detail="Period over period"
            tone={data.changePercent?.startsWith("-") ? "positive" : "default"}
          />
          <Metric
            label="Connected integrations"
            value={data.integrationCount}
            detail="Active cost sources"
          />
        </dl>
      </Section>
      <Section
        title="Spend over time"
        action={
          <SegmentedControl
            label="Cost trend grouping"
            value={groupBy}
            options={COST_GROUP_OPTIONS}
            disabled={seriesLoading}
            onChange={(value) => {
              setGroupBy(value);
              void loadSeries(range, value);
            }}
          />
        }
      >
        <div className="border-foreground/10 rounded-xl border p-5">
          <div className="border-foreground/10 mb-6 flex flex-wrap items-end justify-between gap-4 border-b pb-5">
            <div>
              <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
                Range
              </p>
              <div className="flex flex-wrap gap-1.5">
                <SegmentedControl
                  label="Cost trend range"
                  value={trendPreset}
                  options={TREND_RANGE_OPTIONS}
                  disabled={seriesLoading}
                  onChange={selectTrendPreset}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <DateRangeFields
                startDate={range.startDate}
                endDate={range.endDate}
                onStartDateChange={(startDate) => {
                  setTrendPreset("custom");
                  setRange({ ...range, startDate });
                }}
                onEndDateChange={(endDate) => {
                  setTrendPreset("custom");
                  setRange({ ...range, endDate });
                }}
              />
              <button
                type="button"
                disabled={seriesLoading}
                onClick={() => loadSeries()}
                className="bg-accent text-accent-foreground h-9 rounded-md px-3 text-xs font-medium disabled:opacity-50"
              >
                {seriesLoading ? "Loading…" : "Apply"}
              </button>
            </div>
          </div>
          {series.length ? (
            <div
              className={`flex h-52 items-end gap-1 transition-opacity ${seriesLoading ? "opacity-40" : ""}`}
              role="img"
              aria-label={`Cost trend grouped by ${groupBy}`}
            >
              {series.map((point) => (
                <div
                  key={point.period}
                  title={`${point.period}: ${point.amount}${point.currency ? ` ${point.currency}` : ""}`}
                  className="bg-accent/60 hover:bg-accent min-w-0 flex-1 rounded-t-sm transition-colors"
                  style={{
                    height: `${Math.max(3, (Number(point.amount) / max) * 100)}%`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex h-52 items-center justify-center text-sm">
              No cost data found for this range.
            </div>
          )}
          <div className="text-muted-foreground mt-3 flex justify-between text-xs">
            <span>{series[0]?.period}</span>
            <span>{series.at(-1)?.period}</span>
          </div>
        </div>
      </Section>
      {data.topServices.length ? (
        <Section title="Spend by service">
          <div className="border-foreground/10 divide-foreground/10 divide-y rounded-xl border">
            {data.topServices.map((item) => (
              <div
                key={item.service}
                className="flex justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="truncate">{item.service}</span>
                <span className="shrink-0 font-mono">
                  {formatCurrency(item)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
