"use client";
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
import { formatCurrency, formatRelativeTime } from "../utils";

export function OverviewView() {
  const api = useCostOps();
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
                onClick={() => api.syncNow(failed.id)}
                className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm"
              >
                Retry sync
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
  const data = api.overview;
  const max = Math.max(...data.daily.map((point) => Number(point.amount)), 1);
  const zero = Number(data.currentTotal.amount) === 0;
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="CostOps"
        description="Cloud and AI infrastructure cost visibility and optimization."
        action={
          <div className="text-right">
            <span className="border-foreground/10 rounded-lg border px-3 py-2 text-sm">
              Current month
            </span>
            <p className="text-muted-foreground mt-2 text-xs">
              Updated {formatRelativeTime(data.lastSyncedAt)}
              {syncing ? " · Refreshing data…" : ""}
            </p>
          </div>
        }
      />
      {zero ? (
        <EmptyState
          title="No AWS spend found for this period"
          description="Your integration synchronized successfully, but no cost data was returned for this date range."
        />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-y-6 lg:grid-cols-4">
            <Metric
              label="Total spend"
              value={formatCurrency(data.currentTotal)}
            />
            <Metric
              label="Previous period"
              value={formatCurrency(data.previousTotal)}
            />
            <Metric
              label="Change"
              value={data.changePercent ? `${data.changePercent}%` : "—"}
              tone={
                data.changePercent?.startsWith("-") ? "positive" : "default"
              }
            />
            <Metric
              label="Connected integrations"
              value={data.integrationCount}
            />
          </dl>
          <Section title="Spend over time">
            <div className="border-foreground/10 rounded-xl border p-5">
              <div
                className="flex h-52 items-end gap-1"
                role="img"
                aria-label="Daily cost trend"
              >
                {data.daily.map((point) => (
                  <div
                    key={point.date}
                    title={`${point.date}: ${formatCurrency(point)}`}
                    className="bg-accent/60 hover:bg-accent min-w-0 flex-1 rounded-t-sm transition-colors"
                    style={{
                      height: `${Math.max(3, (Number(point.amount) / max) * 100)}%`,
                    }}
                  />
                ))}
              </div>
              <div className="text-muted-foreground mt-3 flex justify-between text-xs">
                <span>{data.daily[0]?.date}</span>
                <span>{data.daily.at(-1)?.date}</span>
              </div>
            </div>
          </Section>
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
        </>
      )}
    </div>
  );
}
