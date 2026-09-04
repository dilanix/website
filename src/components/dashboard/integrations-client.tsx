"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Clock3,
  Plus,
  X,
} from "lucide-react";
import type {
  CoreIntegration,
  CoreIntegrationConnection,
  IntegrationConnectionStatus,
} from "@/lib/core/api";
import { createConnectionAction } from "@/app/dashboard/integrations/actions";
import { EmptyState, StatusBadge } from "./primitives";
import { AwsOnboardingWizard } from "./integrations/aws-onboarding-wizard";

// The one integration with a dedicated onboarding wizard today — see
// `integrations/aws-onboarding-wizard.tsx`. A future provider (GCP, Azure,
// Cloudflare, ...) with its own multi-step setup would add its own wizard
// component and a corresponding branch here, not change this one.
const AWS_INTEGRATION_SLUG = "aws";

function statusTone(
  status: IntegrationConnectionStatus,
): "success" | "neutral" | "warning" {
  if (status === "connected") return "success";
  if (status === "error") return "warning";
  return "neutral";
}

function providerCode(integration: CoreIntegration) {
  const slug = integration.slug.toLowerCase();
  if (slug === "aws") return "AWS";
  if (slug === "azure") return "AZ";
  if (slug === "gcp" || slug === "google-cloud") return "GCP";
  return integration.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function providerTone(slug: string) {
  if (slug === "aws")
    return "bg-amber-500/12 text-amber-600 dark:text-amber-300";
  if (slug === "azure") return "bg-sky-500/12 text-sky-600 dark:text-sky-300";
  if (slug === "gcp" || slug === "google-cloud")
    return "bg-blue-500/12 text-blue-600 dark:text-blue-300";
  return "bg-accent/10 text-accent";
}

function formatLastSync(value: string | null) {
  if (!value) return "Not synced yet";
  return `Synced ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))}`;
}

export function IntegrationsClient({
  integrations,
  initialConnections,
}: {
  integrations: CoreIntegration[];
  initialConnections: CoreIntegrationConnection[];
}) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [connectTo, setConnectTo] = useState<CoreIntegration | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [onboarding, setOnboarding] = useState<{
    connection: CoreIntegrationConnection;
    integrationName: string;
  } | null>(null);

  function close() {
    setConnectTo(null);
    setError("");
  }

  useEffect(() => {
    if (!connectTo) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConnectTo(null);
        setError("");
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [connectTo]);

  if (!integrations.length) {
    return (
      <EmptyState
        title="No integrations available"
        description="There are no integrations to connect to yet."
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border-border-soft bg-card-strong/50 rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs">Providers</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {integrations.length}
          </p>
        </div>
        <div className="border-border-soft bg-card-strong/50 rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs">Connections</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {connections.length}
          </p>
        </div>
        <div className="border-border-soft bg-card-strong/50 rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs">Needs attention</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {
              connections.filter((connection) => connection.status === "error")
                .length
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const integrationConnections = connections.filter(
            (connection) => connection.integration_id === integration.id,
          );
          const connectedCount = integrationConnections.filter(
            (connection) => connection.status === "connected",
          ).length;
          const errorCount = integrationConnections.filter(
            (connection) => connection.status === "error",
          ).length;
          return (
            <article
              key={integration.id}
              className="border-border-soft bg-card-strong/45 flex min-h-72 flex-col rounded-2xl border p-5 shadow-[0_16px_40px_var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl font-mono text-xs font-bold ${providerTone(integration.slug)}`}
                    aria-hidden="true"
                  >
                    {providerCode(integration)}
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold">
                      {integration.name}
                    </h2>
                    {integration.category ? (
                      <p className="text-muted-foreground text-xs capitalize">
                        {integration.category}
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConnectTo(integration)}
                  disabled={!integration.connection_supported}
                  title={
                    integration.connection_supported
                      ? `Connect ${integration.name}`
                      : `${integration.name} connection support is coming soon`
                  }
                  className="border-foreground/15 hover:bg-foreground/5 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  {integration.connection_supported ? <Plus size={13} /> : null}
                  {integration.connection_supported
                    ? "Add connection"
                    : "Coming soon"}
                </button>
              </div>
              {integration.description ? (
                <p className="text-muted-foreground mt-3 text-xs leading-5">
                  {integration.description}
                </p>
              ) : null}
              <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-success" />
                  {connectedCount} connected
                </span>
                {errorCount ? (
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
                    <AlertTriangle size={13} /> {errorCount} needs attention
                  </span>
                ) : null}
              </div>
              {integrationConnections.length ? (
                <ul className="border-foreground/10 mt-4 divide-y border-t">
                  {integrationConnections.map((connection) => (
                    <li key={connection.id} className="py-3">
                      <Link
                        href={`/dashboard/integrations/${connection.id}`}
                        className="group flex items-center justify-between gap-3"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="group-hover:text-foreground block truncate text-sm font-medium">
                            {connection.name}
                          </span>
                          <span className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                            <Clock3 size={11} />
                            {formatLastSync(connection.last_success_at)}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={statusTone(connection.status)}>
                            {connection.status}
                          </StatusBadge>
                          <span className="text-muted-foreground group-hover:text-accent text-xs font-medium">
                            Manage
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-4 text-xs">
                  No connections yet.
                </p>
              )}
            </article>
          );
        })}
      </div>

      {connectTo ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-title"
            className="bg-background border-foreground/15 w-full max-w-lg rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-accent/10 text-accent flex h-9 w-9 items-center justify-center rounded-lg">
                  <Cloud size={17} />
                </span>
                <h2 id="connect-title" className="mt-4 text-lg font-semibold">
                  Connect {connectTo.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setError("");
                const data = new FormData(event.currentTarget);
                const name = String(data.get("name") ?? "").trim();
                startTransition(async () => {
                  const result = await createConnectionAction({
                    integrationId: connectTo.id,
                    name,
                    externalReference: null,
                  });
                  if (result.error) return setError(result.error);
                  if (result.data) {
                    setConnections((current) => [result.data!, ...current]);
                    if (connectTo.slug === AWS_INTEGRATION_SLUG) {
                      setOnboarding({
                        connection: result.data,
                        integrationName: connectTo.name,
                      });
                      close();
                    } else {
                      close();
                      router.push(`/dashboard/integrations/${result.data.id}`);
                    }
                  }
                });
              }}
              className="mt-6 space-y-5"
            >
              <label className="block text-sm">
                <span className="mb-2 block font-medium">Connection name</span>
                <input
                  name="name"
                  required
                  defaultValue={`${connectTo.name} Production`}
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                />
              </label>
              {error ? (
                <p role="alert" className="text-sm text-red-500">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={pending}
                className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {pending ? "Connecting…" : "Connect"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {onboarding ? (
        <AwsOnboardingWizard
          connection={onboarding.connection}
          integrationName={onboarding.integrationName}
          onClose={() => setOnboarding(null)}
          onConnectionChange={(updated) =>
            setConnections((current) =>
              current.map((c) => (c.id === updated.id ? updated : c)),
            )
          }
        />
      ) : null}
    </>
  );
}
