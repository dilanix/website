"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/dashboard/primitives";
import { useCostOps } from "../costops-context";
import { COSTOPS_PROVIDERS, getProvider } from "../providers/registry";
import { formatDateTime, formatRelativeTime } from "../utils";
import { AwsConnectWizard } from "../providers/aws/aws-connect-wizard";
import type { CostOpsIntegration } from "../types";

export function IntegrationsView() {
  const api = useCostOps();
  const [wizard, setWizard] = useState<CostOpsIntegration | "new" | null>(null);
  const [pageError, setPageError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-9">
      <PageHeader
        title="Integrations"
        description="Connect cloud and AI providers to CostOps."
      />
      {api.integrations.length ? (
        <section>
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Configured
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {api.integrations.map((item) => {
              const provider = getProvider(item.provider);
              const syncing = api.activeSyncs[item.id]?.status === "running";
              return (
                <article
                  key={item.id}
                  className="border-foreground/10 flex min-h-52 flex-col rounded-xl border p-5"
                >
                  <div className="flex justify-between gap-3">
                    <span className="bg-foreground/5 flex h-10 min-w-10 items-center justify-center rounded-lg font-mono text-xs font-semibold">
                      {provider?.shortName}
                    </span>
                    <StatusBadge
                      status={
                        item.status === "connected"
                          ? "success"
                          : item.status === "error"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {item.status === "pending"
                        ? "Setup incomplete"
                        : item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)}
                    </StatusBadge>
                  </div>
                  <h3 className="mt-5 text-sm font-medium">{item.name}</h3>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {provider?.name}
                    {item.externalAccountId
                      ? ` · ${item.externalAccountId}`
                      : ""}
                  </p>
                  <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
                    <RefreshCw
                      size={11}
                      className={syncing ? "animate-spin" : ""}
                    />
                    {syncing
                      ? "Sync in progress"
                      : `Last sync ${formatRelativeTime(item.lastSyncedAt)}`}
                  </p>
                  <div className="mt-auto flex gap-2 pt-5">
                    {item.status === "pending" || item.status === "error" ? (
                      <button
                        onClick={async () => {
                          setPageError("");
                          try {
                            setWizard(await api.loadIntegration(item.id));
                          } catch (error) {
                            setPageError(
                              error instanceof Error
                                ? error.message
                                : "Unable to load integration.",
                            );
                          }
                        }}
                        className="border-foreground/15 rounded-lg border px-3 py-2 text-xs font-medium"
                      >
                        {item.status === "error"
                          ? "Fix connection"
                          : "Continue setup"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelected(item.id)}
                        className="border-foreground/15 rounded-lg border px-3 py-2 text-xs font-medium"
                      >
                        Manage
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
      <section>
        {pageError ? (
          <p role="alert" className="mb-4 text-sm text-red-500">
            {pageError}
          </p>
        ) : null}
        <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Available integrations
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COSTOPS_PROVIDERS.map((provider) => (
            <article
              key={provider.id}
              className="border-foreground/10 flex min-h-44 flex-col rounded-xl border p-5"
            >
              <div className="flex justify-between">
                <span className="bg-foreground/5 flex h-9 min-w-9 items-center justify-center rounded-lg font-mono text-xs font-semibold">
                  {provider.shortName}
                </span>
                {provider.status === "coming_soon" ? (
                  <StatusBadge>Coming soon</StatusBadge>
                ) : null}
              </div>
              <h3 className="mt-4 text-sm font-medium">{provider.name}</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-5">
                {provider.description}
              </p>
              {provider.status === "available" ? (
                <button
                  onClick={() => setWizard("new")}
                  className="text-accent mt-auto self-start pt-4 text-sm font-medium"
                >
                  Connect
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
      {wizard ? (
        <AwsConnectWizard
          initialIntegration={wizard === "new" ? undefined : wizard}
          onClose={() => setWizard(null)}
        />
      ) : null}
      {selected
        ? (() => {
            const item = api.integrations.find(
              (value) => value.id === selected,
            );
            if (!item) return null;
            return (
              <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div
                  role="dialog"
                  aria-modal="true"
                  className="bg-background border-foreground/15 w-full max-w-lg rounded-xl border p-6"
                >
                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <dl className="mt-5 space-y-3 text-sm">
                    {[
                      [
                        "Provider",
                        getProvider(item.provider)?.name ?? item.provider,
                      ],
                      ["AWS account", item.externalAccountId ?? "Not verified"],
                      ["Role ARN", item.roleArn ?? "Not configured"],
                      ["Created", formatDateTime(item.createdAt)],
                      ["Last sync", formatDateTime(item.lastSyncedAt)],
                      ["Sync status", item.lastSyncStatus ?? "Never"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="grid gap-1 sm:grid-cols-[8rem_1fr]"
                      >
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="break-all">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6 flex justify-end gap-2">
                    {item.status === "connected" ? (
                      <button
                        onClick={() => setSelected(null)}
                        className="border-foreground/15 rounded-lg border px-3 py-2 text-sm"
                      >
                        Close
                      </button>
                    ) : null}
                    <button
                      disabled={api.activeSyncs[item.id]?.status === "running"}
                      onClick={async () => {
                        setPageError("");
                        try {
                          await api.syncNow(item.id);
                        } catch (error) {
                          setPageError(
                            error instanceof Error
                              ? error.message
                              : "Unable to start sync.",
                          );
                        }
                      }}
                      className="bg-accent text-accent-foreground rounded-lg px-3 py-2 text-sm disabled:opacity-50"
                    >
                      Sync now
                    </button>
                    {item.status !== "disabled" ? (
                      <button
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Disable ${item.name}? CostOps will stop syncing new cost data.`,
                            )
                          )
                            return;
                          setPageError("");
                          try {
                            await api.disableIntegration(item.id);
                            setSelected(null);
                          } catch (error) {
                            setPageError(
                              error instanceof Error
                                ? error.message
                                : "Unable to disable integration.",
                            );
                          }
                        }}
                        className="text-muted-foreground rounded-lg px-3 py-2 text-sm hover:text-red-500"
                      >
                        Disable
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })()
        : null}
    </div>
  );
}
