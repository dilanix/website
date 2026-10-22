import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleAlert,
  Hourglass,
  Lock,
  Mail,
  PackageCheck,
  Puzzle,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import {
  getOrganizationPlan,
  getPublicPlans,
  listConnections,
  listTargets,
  type CoreOrganizationPlan,
  type CorePlanAccess,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { PageHeader, Section } from "@/components/dashboard/primitives";
import {
  AccountManager,
  LimitMeter,
  type PlanAccount,
} from "@/components/dashboard/plan/plan-usage";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { formatDate, planStateLabel, planStateTone } from "@/lib/plans/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Plan & usage",
  robots: { index: false, follow: false },
};

const CLOUD_ACCOUNTS = "cloud.accounts";

const TONE = {
  success: "border-success/25 bg-success/10 text-success",
  info: "border-accent/25 bg-accent/10 text-accent",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  danger: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
} as const;

function trialProgress(plan: CoreOrganizationPlan) {
  if (!plan.starts_at || !plan.expires_at) return null;
  const start = new Date(plan.starts_at).getTime();
  const end = new Date(plan.expires_at).getTime();
  if (!(end > start)) return null;
  return Math.min(1, Math.max(0, (Date.now() - start) / (end - start)));
}

function AccessList({ items }: { items: CorePlanAccess[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.code}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-3.5 py-3",
            item.allowed
              ? "border-success/20 bg-success/[0.05]"
              : "border-border-soft bg-card-strong/40",
          )}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg border",
              item.allowed
                ? "border-success/25 bg-success/10 text-success"
                : "border-border-soft text-muted-foreground",
            )}
          >
            {item.allowed ? <BadgeCheck size={15} /> : <Lock size={14} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {item.name
                .replace(/^Product Access:\s*/, "")
                .replace(/\s*Platform Access$/, "")}
            </span>
            <span className="text-muted-foreground block text-[11px]">
              {item.allowed
                ? item.sources.some((source) => source.startsWith("addon:"))
                  ? "Included with an add-on"
                  : item.sources.includes("override:allow")
                    ? "Enabled for your workspace"
                    : "Included in your plan"
                : item.access_status === "expired"
                  ? "Paused — your plan ended"
                  : "Not in your plan"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function PlanPage() {
  const { token, organization } = await requireDashboardOrganization();
  const organizationId = organization.organization_id;
  const [plan, publicPlans, connections] = await Promise.all([
    getOrganizationPlan(organizationId, token),
    getPublicPlans(),
    listConnections(organizationId, token).catch(() => []),
  ]);
  const targetsByConnection = await Promise.all(
    connections
      .filter((connection) => connection.status !== "disabled")
      .map(async (connection) => ({
        connection,
        targets: await listTargets(organizationId, connection.id, token).catch(
          () => [],
        ),
      })),
  );
  const accounts: PlanAccount[] = targetsByConnection
    .flatMap(({ connection, targets }) =>
      targets.map((target) => ({
        connectionId: connection.id,
        connectionName: connection.name,
        target,
      })),
    )
    .sort(
      (a, b) =>
        Number(a.target.status !== "verified") -
          Number(b.target.status !== "verified") ||
        a.connectionName.localeCompare(b.connectionName),
    );

  const accountLimit = plan.limits.find(
    (limit) => limit.code === CLOUD_ACCOUNTS,
  );
  const tone = planStateTone(plan.state);
  const progress = plan.state === "trial" ? trialProgress(plan) : null;
  const ended =
    plan.state === "trial_expired" ||
    plan.state === "expired" ||
    plan.state === "none";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Workspace"
        title="Plan & usage"
        description="Your plan, what it includes, and how much of it you're using. Dilanix never charges you here — changes go through our team."
        action={
          <Link
            href="/contact?plan=upgrade"
            className="text-accent-foreground from-accent to-accent-secondary inline-flex items-center gap-2 rounded-xl bg-gradient-to-br px-4 py-2.5 text-sm font-semibold shadow-[0_14px_34px_var(--shadow-brand)] transition-transform hover:-translate-y-0.5"
          >
            <Mail size={15} />
            Talk to us about your plan
          </Link>
        }
      />

      <section className="border-border-soft bg-dashboard-panel dashboard-panel-highlight relative overflow-hidden rounded-[1.75rem] border p-6 shadow-[0_24px_70px_var(--shadow-card)] backdrop-blur-sm sm:p-8">
        <div className="from-accent/16 pointer-events-none absolute -top-32 -right-24 size-80 rounded-full bg-radial to-transparent blur-2xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
          <div>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase",
                TONE[tone],
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {planStateLabel(plan.state)}
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              {plan.plan?.name ?? "No active plan"}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6">
              {plan.state === "trial"
                ? `You're on the free trial with every live product. It ends ${formatDate(plan.expires_at)}.`
                : plan.state === "trial_expired"
                  ? `Your trial ended ${formatDate(plan.expires_at)}. Your data and settings are kept — products and sync resume as soon as a plan is active.`
                  : plan.state === "expired"
                    ? `Your plan ended ${formatDate(plan.expires_at)}. Your data is kept — contact us to continue.`
                    : plan.state === "pending"
                      ? `Your plan starts ${formatDate(plan.starts_at)}.`
                      : plan.state === "none"
                        ? "Your workspace has no plan yet. Your data is kept — contact us to get started."
                        : plan.expires_at
                          ? `Active until ${formatDate(plan.expires_at)}.`
                          : "Active with no end date."}
            </p>
            {progress !== null ? (
              <div className="mt-5 max-w-md">
                <div className="text-muted-foreground mb-1.5 flex justify-between text-[11px]">
                  <span>Trial</span>
                  <span>
                    {plan.days_remaining} day
                    {plan.days_remaining === 1 ? "" : "s"} left
                  </span>
                </div>
                <div className="bg-foreground/[0.07] h-2 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      (plan.days_remaining ?? 0) <= 3
                        ? "bg-amber-500"
                        : "bg-[linear-gradient(90deg,var(--accent),var(--accent-secondary))]",
                    )}
                    style={{ width: `${Math.max(4, progress * 100)}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <dl className="border-border-soft bg-card-strong/55 grid gap-3 rounded-3xl border p-5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground text-xs">Started</dt>
              <dd className="text-sm font-semibold">
                {formatDate(plan.starts_at) ?? "—"}
              </dd>
            </div>
            <div className="border-border-soft flex items-center justify-between gap-3 border-t pt-3">
              <dt className="text-muted-foreground text-xs">
                {ended ? "Ended" : "Ends"}
              </dt>
              <dd className="text-sm font-semibold">
                {formatDate(plan.expires_at) ?? "No end date"}
              </dd>
            </div>
            <div className="border-border-soft flex items-center justify-between gap-3 border-t pt-3">
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <RefreshCw size={12} /> Cloud sync
              </dt>
              <dd
                className={cn(
                  "text-sm font-semibold",
                  plan.provider_sync.allowed
                    ? "text-success"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {plan.provider_sync.allowed ? "Running" : "Paused"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {plan.warnings.length ? (
        <div className="flex flex-col gap-3">
          {plan.warnings.map((warning) => {
            const Icon =
              warning.severity === "critical"
                ? TriangleAlert
                : warning.code === "trial_ending"
                  ? Hourglass
                  : CircleAlert;
            return (
              <div
                key={`${warning.code}-${warning.message}`}
                role={warning.severity === "critical" ? "alert" : "status"}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
                  warning.severity === "critical"
                    ? "border-red-500/25 bg-red-500/[0.06]"
                    : warning.severity === "warning"
                      ? "border-amber-500/25 bg-amber-500/[0.06]"
                      : "border-accent/20 bg-accent/[0.05]",
                )}
              >
                <Icon size={16} className="mt-0.5 shrink-0" />
                {warning.message}
              </div>
            );
          })}
        </div>
      ) : null}

      {plan.limits.length ? (
        <Section
          title="Usage"
          description="Limits are checked when something is added. Going over never deletes data."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {plan.limits.map((limit) => (
              <LimitMeter key={limit.code} limit={limit} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section
        title="Connected cloud accounts"
        description="Pause accounts you don't need to sync; resume them when there's room in your plan."
        action={
          <Link
            href="/dashboard/integrations"
            className="text-accent inline-flex items-center gap-1 text-xs font-semibold"
          >
            Integrations <ArrowUpRight size={13} />
          </Link>
        }
      >
        <AccountManager accounts={accounts} limit={accountLimit} />
      </Section>

      <div className="grid gap-8 xl:grid-cols-2">
        <Section title="Products" description="What your plan unlocks.">
          {plan.products.length ? (
            <AccessList items={plan.products} />
          ) : (
            <p className="text-muted-foreground text-sm">
              No products are available yet.
            </p>
          )}
        </Section>
        <Section title="Features" description="Platform features on your plan.">
          {plan.features.length ? (
            <AccessList items={plan.features} />
          ) : (
            <p className="text-muted-foreground text-sm">
              No extra features on this plan.
            </p>
          )}
        </Section>
      </div>

      {plan.addons.length ? (
        <Section title="Add-ons" description="Extras on top of your plan.">
          <ul className="grid gap-2 sm:grid-cols-2">
            {plan.addons.map((addon) => (
              <li
                key={addon.code}
                className="border-border-soft bg-dashboard-panel flex items-center gap-3 rounded-xl border px-3.5 py-3"
              >
                <span className="border-accent/20 bg-accent/10 text-accent flex size-8 items-center justify-center rounded-lg border">
                  <Puzzle size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {addon.name}
                    {addon.quantity > 1 ? ` × ${addon.quantity}` : ""}
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    {addon.expires_at
                      ? `Until ${formatDate(addon.expires_at)}`
                      : "No end date"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {publicPlans.length ? (
        <Section
          title="Plans"
          description="Need more accounts, seats or products? Pick a plan and we'll switch you over."
        >
          <div className="pt-4">
            <PricingCards
              plans={publicPlans}
              currentPlanCode={plan.plan?.code ?? null}
            />
          </div>
        </Section>
      ) : (
        <div className="border-border-soft bg-dashboard-panel flex flex-col items-start gap-3 rounded-[1.35rem] border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="border-accent/20 bg-accent/10 text-accent flex size-10 items-center justify-center rounded-xl border">
              <PackageCheck size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold">Need a different plan?</p>
              <p className="text-muted-foreground text-xs">
                Tell us about your accounts and team — we&apos;ll tailor it.
              </p>
            </div>
          </div>
          <Link
            href="/contact?plan=upgrade"
            className="text-accent inline-flex items-center gap-1 text-sm font-semibold"
          >
            Contact sales <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
