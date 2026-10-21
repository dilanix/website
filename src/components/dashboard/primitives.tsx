import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-accent mb-2 text-[10px] font-semibold tracking-[0.18em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
    <div className="border-border-soft min-w-0 border-l pl-4 first:border-l-0 first:pl-0 sm:first:border-l sm:first:pl-4">
      <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-2 font-mono text-xl font-medium tracking-tight",
          tone === "positive" ? "text-success" : "text-foreground",
        )}
      >
        {value}
      </dd>
      {detail ? (
        <div className="text-muted-foreground mt-1.5 text-[11px] leading-4">
          {detail}
        </div>
      ) : null}
    </div>
  );
}

export function Section({
  title,
  action,
  children,
  className,
  description,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          {description ? (
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {description}
            </p>
          ) : null}
        </div>
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-[0_8px_20px_var(--shadow-card)] backdrop-blur-sm",
        status === "success" && "border-success/25 bg-success/10 text-success",
        status === "warning" &&
          "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
        status === "neutral" &&
          "border-border-soft bg-card-strong/75 text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shadow-[0_0_0_3px_color-mix(in_oklab,currentColor_10%,transparent)]",
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
    <div className="border-border-soft bg-dashboard-panel dashboard-panel-highlight flex min-h-56 flex-col items-center justify-center rounded-[1.4rem] border border-dashed px-6 py-10 text-center shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-sm">
      <span className="border-border-soft bg-card-strong/80 text-muted-foreground flex size-11 items-center justify-center rounded-xl border shadow-[0_10px_24px_var(--shadow-card)]">
        <Inbox size={19} />
      </span>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
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
      className="border-border-soft bg-dashboard-panel flex items-start gap-3 rounded-[1.4rem] border p-5 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-sm"
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
      className={cn(
        "from-foreground/[0.045] via-foreground/[0.085] to-foreground/[0.045] animate-pulse rounded-xl bg-gradient-to-r",
        className,
      )}
    />
  );
}
