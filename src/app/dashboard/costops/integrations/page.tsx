import type { Metadata } from "next";
import { RefreshCw } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/dashboard/primitives";
import { getIntegrations } from "@/lib/data/dashboard-mocks";
export const metadata: Metadata = {
  title: "Integrations — CostOps",
  robots: { index: false, follow: false },
};
export default async function IntegrationsPage() {
  const items = await getIntegrations();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Integrations"
        description="Connect your cloud and AI providers to start analyzing costs."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.id}
            className="border-foreground/10 flex min-h-48 flex-col rounded-xl border p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="bg-foreground/5 flex h-10 min-w-10 items-center justify-center rounded-lg font-mono text-xs font-semibold">
                {item.shortName}
              </span>
              <StatusBadge status={item.connected ? "success" : "neutral"}>
                {item.connected ? "Connected" : "Not connected"}
              </StatusBadge>
            </div>
            <h2 className="mt-5 text-sm font-medium">{item.name}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{item.detail}</p>
            {item.connected && item.sync ? (
              <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                <RefreshCw size={11} /> Last sync: {item.sync}
              </p>
            ) : null}
            <button className="border-foreground/15 hover:border-accent/50 mt-auto self-start rounded-lg border px-3 py-2 text-xs font-medium">
              {item.connected ? "Manage" : "Connect"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
