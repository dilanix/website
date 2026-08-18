import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}

export function Metric({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "default" | "positive";
}) {
  return (
    <div className="border-foreground/10 min-w-0 border-l pl-4 first:border-l-0 first:pl-0 sm:first:border-l sm:first:pl-4">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd
        className={cn(
          "mt-2 font-mono text-xl font-medium tracking-tight",
          tone === "positive" ? "text-success" : "text-foreground",
        )}
      >
        {value}
      </dd>
      {detail ? (
        <p className="text-muted-foreground mt-1.5 text-[11px] leading-4">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({
  children,
  status = "neutral",
}: {
  children: ReactNode;
  status?: "success" | "neutral" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        status === "success" && "border-success/25 bg-success/10 text-success",
        status === "warning" &&
          "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
        status === "neutral" && "border-foreground/15 text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "success"
            ? "bg-success"
            : status === "warning"
              ? "bg-amber-500"
              : "bg-muted-foreground",
        )}
      />
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-foreground/10 bg-foreground/[0.015] flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
      <span className="bg-foreground/5 text-muted-foreground flex h-10 w-10 items-center justify-center rounded-lg">
        <Inbox size={18} />
      </span>
      <h3 className="mt-4 text-sm font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-md text-sm leading-6">
        {description}
      </p>
      {actions ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="border-foreground/10 flex items-start gap-3 rounded-xl border p-5"
    >
      <AlertTriangle className="text-muted-foreground mt-0.5" size={18} />
      <div>
        <h3 className="text-sm font-medium">Unable to load data</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Something went wrong while loading this section.
        </p>
        {onRetry ? (
          <button
            onClick={onRetry}
            className="text-accent mt-3 text-sm font-medium hover:underline"
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-foreground/7 animate-pulse rounded-md", className)}
    />
  );
}
