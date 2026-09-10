import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  CloudCog,
  Layers3,
  PackageOpen,
  Plug,
  Plus,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  listConnections,
  listIntegrations,
  listOrganizationCapabilities,
  listOrganizationProducts,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import { Section, StatusBadge } from "@/components/dashboard/primitives";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

function connectionTone(status: string) {
  if (status === "connected") return "success" as const;
  if (status === "error") return "warning" as const;
  return "neutral" as const;
}

function connectionStatusLabel(status: string) {
  if (status === "connected") return "Healthy";
  if (status === "error") return "Attention";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatLastSync(value: string | null) {
  if (!value) return "Not synced yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sync time unavailable";
  return `Synced ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}

const workspaceLinks = [
  {
    href: "/dashboard/resources" as const,
    title: "Cloud resources",
    description: "Search and inspect your live infrastructure inventory.",
    icon: Boxes,
    iconClassName: "border-cyan-500/20 bg-cyan-500/10 text-cyan-500",
  },
  {
    href: "/dashboard/costs" as const,
    title: "Cost intelligence",
    description: "Understand spend, trends, and optimization opportunities.",
    icon: CircleDollarSign,
    iconClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
  },
  {
    href: "/dashboard/integrations" as const,
    title: "Data connections",
    description: "Connect and manage your cloud providers in one place.",
    icon: Plug,
    iconClassName: "border-violet-500/20 bg-violet-500/10 text-violet-500",
  },
];

export default async function DashboardPage() {
  const { token, me, organization } = await requireDashboardOrganization();
  const [connections, integrations, products, organizationCapabilities] =
    await Promise.all([
      listConnections(organization.organization_id, token),
      listIntegrations(token),
      listOrganizationProducts(organization.organization_id, token),
      listOrganizationCapabilities(organization.organization_id, token),
    ]);
  const activeCapabilityCodes = organizationCapabilities
    .filter((capability) => capability.access_status === "active")
    .map((capability) => capability.code);
  const visibleWorkspaceLinks = workspaceLinks.filter((item) => {
    if (item.href === "/dashboard/resources") {
      return activeCapabilityCodes.some((code) =>
        code.endsWith(".inventory.read"),
      );
    }
    if (item.href === "/dashboard/costs") {
      return activeCapabilityCodes.some((code) =>
        code.endsWith(".billing.read"),
      );
    }
    return true;
  });
  const integrationsById = new Map(
    integrations.map((integration) => [integration.id, integration]),
  );
  const connectedCount = connections.filter(
    (connection) => connection.status === "connected",
  ).length;
  const errorCount = connections.filter(
    (connection) => connection.status === "error",
  ).length;
  const providerCount = new Set(
    connections.map((connection) => connection.integration_id),
  ).size;
  const activeProductCount = products.filter(
    (product) => product.access_status === "active",
  ).length;
  const connectionHealth = connections.length
    ? Math.round((connectedCount / connections.length) * 100)
    : 0;
  const healthLabel = !connections.length
    ? "Awaiting your first connection"
    : errorCount
      ? `${errorCount} source${errorCount === 1 ? "" : "s"} need attention`
      : connectedCount === connections.length
        ? "All sources are connected"
        : "Connection setup in progress";
  const metrics = [
    {
      label: "Connected sources",
      value: `${connectedCount}/${connections.length}`,
      detail: "Ready for cloud sync",
      icon: Plug,
      iconClassName: "border-cyan-500/20 bg-cyan-500/10 text-cyan-500",
    },
    {
      label: "Cloud providers",
      value: providerCount,
      detail: "Unified in one workspace",
      icon: CloudCog,
      iconClassName: "border-blue-500/20 bg-blue-500/10 text-blue-500",
    },
    {
      label: "Active products",
      value: activeProductCount,
      detail: `${products.length} available to your team`,
      icon: Layers3,
      iconClassName: "border-violet-500/20 bg-violet-500/10 text-violet-500",
    },
    {
      label: "Needs attention",
      value: errorCount,
      detail: errorCount ? "Review connection health" : "Everything looks good",
      icon: errorCount ? TriangleAlert : CheckCircle2,
      iconClassName: errorCount
        ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="border-border-soft bg-dashboard-panel dashboard-panel-highlight relative overflow-hidden rounded-[1.75rem] border p-6 shadow-[0_24px_70px_var(--shadow-card)] backdrop-blur-sm sm:p-8 lg:p-10">
        <div className="from-accent/18 pointer-events-none absolute -top-32 -right-24 size-80 rounded-full bg-radial to-transparent blur-2xl" />
        <div className="from-accent-secondary/12 pointer-events-none absolute -bottom-36 left-1/3 size-72 rounded-full bg-radial to-transparent blur-3xl" />
        <div className="relative z-10 grid items-center gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <div className="border-success/20 bg-success/8 text-success mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
              <span className="bg-success size-1.5 rounded-full shadow-[0_0_10px_var(--success)]" />
              Cloud command center
            </div>
            <h1 className="max-w-3xl text-3xl leading-[1.08] font-semibold tracking-[-0.045em] sm:text-4xl lg:text-[2.8rem]">
              Good to see you, {me.first_name}.
              <span className="text-muted-foreground mt-2 block">
                Your cloud is in focus.
              </span>
            </h1>
            <p className="text-muted-foreground mt-5 max-w-2xl text-sm leading-6 sm:text-[15px] sm:leading-7">
              Monitor connections, explore infrastructure, and move from signal
              to action across {organization.organization_name}.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/dashboard/integrations"
                className="text-accent-foreground from-accent to-accent-secondary inline-flex items-center gap-2 rounded-xl bg-gradient-to-br px-4 py-2.5 text-sm font-semibold shadow-[0_14px_34px_var(--shadow-brand)] transition-transform hover:-translate-y-0.5"
              >
                <Plus size={16} />
                Connect source
              </Link>
              <Link
                href="/dashboard/products"
                className="border-border-soft bg-card-strong/65 hover:border-accent/30 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm backdrop-blur-sm"
              >
                Explore products
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div className="border-border-soft bg-card-strong/55 relative overflow-hidden rounded-3xl border p-5 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
                  Workspace health
                </p>
                <p className="mt-2 text-sm font-semibold">{healthLabel}</p>
              </div>
              <span className="border-accent/15 bg-accent/10 text-accent flex size-9 items-center justify-center rounded-xl border">
                <Activity size={16} />
              </span>
            </div>
            <div className="mt-6 flex items-center gap-5">
              <div
                className="relative flex size-24 shrink-0 items-center justify-center rounded-full p-[7px] shadow-[0_12px_34px_var(--shadow-brand)]"
                style={{
                  background: connections.length
                    ? `conic-gradient(var(--accent) ${connectionHealth}%, color-mix(in oklab, var(--foreground) 8%, transparent) 0)`
                    : "color-mix(in oklab, var(--foreground) 8%, transparent)",
                }}
              >
                <div className="bg-card-strong flex size-full items-center justify-center rounded-full">
                  <span className="font-mono text-xl font-semibold tracking-tight">
                    {connections.length ? `${connectionHealth}%` : "—"}
                  </span>
                </div>
              </div>
              <dl className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground text-xs">Connected</dt>
                  <dd className="font-mono text-sm font-semibold">
                    {connectedCount}
                  </dd>
                </div>
                <div className="border-border-soft flex items-center justify-between gap-3 border-t pt-3">
                  <dt className="text-muted-foreground text-xs">Providers</dt>
                  <dd className="font-mono text-sm font-semibold">
                    {providerCount}
                  </dd>
                </div>
                <div className="border-border-soft flex items-center justify-between gap-3 border-t pt-3">
                  <dt className="text-muted-foreground text-xs">Products</dt>
                  <dd className="font-mono text-sm font-semibold">
                    {activeProductCount}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="border-border-soft bg-dashboard-panel group relative overflow-hidden rounded-[1.35rem] border p-5 shadow-[0_16px_44px_var(--shadow-card)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground text-[10px] font-semibold tracking-[0.12em] uppercase">
                  {metric.label}
                </dt>
                <span
                  className={`flex size-8 items-center justify-center rounded-lg border ${metric.iconClassName}`}
                >
                  <Icon size={15} />
                </span>
              </div>
              <dd className="mt-4 font-mono text-3xl font-semibold tracking-[-0.05em]">
                {metric.value}
              </dd>
              <p className="text-muted-foreground mt-1.5 text-[11px]">
                {metric.detail}
              </p>
            </div>
          );
        })}
      </dl>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Section
          title="Cloud connections"
          description="Live provider status and synchronization freshness."
          action={
            <Link
              href="/dashboard/integrations"
              className="text-accent inline-flex items-center gap-1 text-xs font-semibold"
            >
              Manage all <ArrowUpRight size={13} />
            </Link>
          }
        >
          {connections.length ? (
            <div className="border-border-soft bg-dashboard-panel overflow-hidden rounded-[1.4rem] border shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-sm">
              <div className="border-border-soft text-muted-foreground hidden grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.7fr)_auto] gap-4 border-b px-5 py-3 text-[9px] font-semibold tracking-[0.14em] uppercase sm:grid">
                <span>Connection</span>
                <span>Last activity</span>
                <span>Status</span>
              </div>
              <div className="divide-border-soft divide-y">
                {connections.slice(0, 6).map((connection) => {
                  const integration = integrationsById.get(
                    connection.integration_id,
                  );
                  return (
                    <Link
                      key={connection.id}
                      href={`/dashboard/integrations/${connection.id}`}
                      className="group hover:bg-foreground/[0.025] grid gap-3 px-4 py-4 transition-colors sm:grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.7fr)_auto] sm:items-center sm:gap-4 sm:px-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="border-border-soft bg-card-strong/70 text-accent flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-transform group-hover:scale-[1.03]">
                          <PackageOpen size={17} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {connection.name}
                          </span>
                          <span className="text-muted-foreground mt-0.5 block truncate text-[11px]">
                            {integration?.name ?? "Cloud provider"}
                          </span>
                        </span>
                      </div>
                      <span className="text-muted-foreground pl-[3.25rem] text-[11px] sm:pl-0">
                        {formatLastSync(connection.last_synced_at)}
                      </span>
                      <div className="pl-[3.25rem] sm:pl-0">
                        <StatusBadge status={connectionTone(connection.status)}>
                          {connectionStatusLabel(connection.status)}
                        </StatusBadge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <Link
              href="/dashboard/integrations"
              className="border-border-soft bg-dashboard-panel text-muted-foreground hover:border-accent/30 dashboard-panel-highlight flex min-h-52 flex-col items-center justify-center rounded-[1.4rem] border border-dashed px-6 text-center shadow-[0_18px_48px_var(--shadow-card)]"
            >
              <span className="border-accent/15 bg-accent/10 text-accent flex size-11 items-center justify-center rounded-xl border">
                <Plus size={18} />
              </span>
              <span className="text-foreground mt-4 text-sm font-semibold">
                Connect your first cloud
              </span>
              <span className="mt-1 max-w-sm text-xs leading-5">
                Add AWS, Azure, GCP, or another provider to activate your live
                command center.
              </span>
            </Link>
          )}
        </Section>

        <Section
          title="Quick access"
          description="Jump directly to the work that matters."
        >
          <div className="border-border-soft bg-dashboard-panel flex flex-col gap-1.5 rounded-[1.4rem] border p-2 shadow-[0_18px_48px_var(--shadow-card)] backdrop-blur-sm">
            {visibleWorkspaceLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group hover:bg-card-strong/70 flex items-center gap-3 rounded-2xl p-3 transition-all"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${item.iconClassName}`}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold">
                      {item.title}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block text-[10px] leading-4">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground shrink-0 opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-90"
                  />
                </Link>
              );
            })}
            <Link
              href="/dashboard/products"
              className="border-accent/10 from-accent/8 to-accent-secondary/8 group mt-1 flex items-center gap-3 rounded-2xl border bg-gradient-to-br p-3"
            >
              <span className="from-accent to-accent-secondary text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-[0_10px_24px_var(--shadow-brand)]">
                <Sparkles size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">
                  Product portfolio
                </span>
                <span className="text-muted-foreground mt-0.5 block text-[10px]">
                  {activeProductCount} active of {products.length} available
                </span>
              </span>
              <ArrowRight
                size={14}
                className="text-accent shrink-0 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
}
