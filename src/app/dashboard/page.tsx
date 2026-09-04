import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  PackageOpen,
  Plug,
} from "lucide-react";
import {
  listConnections,
  listIntegrations,
  listOrganizationProducts,
} from "@/lib/core/api";
import { requireDashboardOrganization } from "@/lib/dashboard/session";
import {
  PageHeader,
  Section,
  StatusBadge,
} from "@/components/dashboard/primitives";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

function connectionTone(status: string) {
  if (status === "connected") return "success" as const;
  if (status === "error") return "warning" as const;
  return "neutral" as const;
}

const workspaceLinks = [
  {
    href: "/dashboard/resources" as const,
    title: "Resources",
    description: "Browse infrastructure across cloud connections.",
    icon: Boxes,
  },
  {
    href: "/dashboard/costs" as const,
    title: "Costs",
    description: "Analyze provider spend and cost trends.",
    icon: CircleDollarSign,
  },
  {
    href: "/dashboard/integrations" as const,
    title: "Integrations",
    description: "Connect and manage cloud data sources.",
    icon: Plug,
  },
];

export default async function DashboardPage() {
  const { token, organization } = await requireDashboardOrganization();
  const [connections, integrations, products] = await Promise.all([
    listConnections(organization.organization_id, token),
    listIntegrations(token),
    listOrganizationProducts(organization.organization_id, token),
  ]);
  const integrationNames = new Map(
    integrations.map((integration) => [integration.id, integration.name]),
  );
  const connectedCount = connections.filter(
    (connection) => connection.status === "connected",
  ).length;
  const providerCount = new Set(
    connections.map((connection) => connection.integration_id),
  ).size;
  const activeProductCount = products.filter(
    (product) => product.access_status === "active",
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Overview"
        description="Your multicloud workspace for infrastructure inventory, provider costs, and connected data sources."
        action={
          <Link
            href="/dashboard/products"
            className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-3 py-2 text-sm font-medium"
          >
            View products
          </Link>
        }
      />

      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Connected sources",
            value: connectedCount,
            detail: `${connections.length} configured`,
          },
          {
            label: "Cloud providers",
            value: providerCount,
            detail: "Across all connections",
          },
          {
            label: "Active products",
            value: activeProductCount,
            detail: `${products.length} available`,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="border-border-soft bg-card-strong/60 rounded-2xl border p-5 shadow-[0_16px_40px_var(--shadow-card)]"
          >
            <dt className="text-muted-foreground text-xs">{metric.label}</dt>
            <dd className="mt-2 font-mono text-2xl font-semibold">
              {metric.value}
            </dd>
            <p className="text-muted-foreground mt-1 text-xs">
              {metric.detail}
            </p>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-3">
        {workspaceLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="border-border-soft bg-card-strong/45 hover:border-accent/35 group rounded-2xl border p-5 transition-colors"
            >
              <span className="bg-accent/10 text-accent flex h-10 w-10 items-center justify-center rounded-xl">
                <Icon size={18} />
              </span>
              <h2 className="mt-5 text-sm font-semibold">{item.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {item.description}
              </p>
              <span className="text-accent mt-4 inline-flex items-center gap-1 text-xs font-medium">
                Open
                <ArrowRight
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          );
        })}
      </div>

      <Section
        title="Cloud connections"
        action={
          <Link
            href="/dashboard/integrations"
            className="text-accent text-xs font-medium hover:underline"
          >
            Manage integrations
          </Link>
        }
      >
        {connections.length ? (
          <div className="border-border-soft divide-border-soft divide-y overflow-hidden rounded-2xl border">
            {connections.slice(0, 6).map((connection) => (
              <Link
                key={connection.id}
                href={`/dashboard/integrations/${connection.id}`}
                className="hover:bg-foreground/[0.02] flex items-center justify-between gap-4 p-4 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-foreground/5 text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    <PackageOpen size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {connection.name}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {integrationNames.get(connection.integration_id) ??
                        "Cloud provider"}
                    </p>
                  </div>
                </div>
                <StatusBadge status={connectionTone(connection.status)}>
                  {connection.status}
                </StatusBadge>
              </Link>
            ))}
          </div>
        ) : (
          <Link
            href="/dashboard/integrations"
            className="border-border-soft text-muted-foreground hover:border-accent/30 flex min-h-32 items-center justify-center rounded-2xl border border-dashed px-6 text-center text-sm transition-colors"
          >
            Connect AWS, Azure, GCP, or another provider to start building your
            cloud inventory.
          </Link>
        )}
      </Section>
    </div>
  );
}
