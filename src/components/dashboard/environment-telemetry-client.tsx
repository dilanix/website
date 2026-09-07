"use client";

import {
  Archive,
  Check,
  Copy,
  KeyRound,
  Pencil,
  Plus,
  RadioTower,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createTelemetrySourceAction,
  createTelemetryTokenAction,
  deleteEnvironmentAction,
  deleteTelemetrySourceAction,
  deleteTelemetryTokenAction,
  revokeTelemetryTokenAction,
  updateEnvironmentAction,
  updateTelemetrySourceAction,
} from "@/app/dashboard/applications/actions";
import type {
  CoreApplication,
  CoreApplicationEnvironment,
  CoreTelemetryIngestionToken,
  CoreTelemetrySource,
  TelemetryIngestionScope,
  TelemetrySourceType,
} from "@/lib/core/api";
import { DestructiveActionDialog } from "./destructive-action-dialog";
import { hasResourceMetadata, ResourceMetadata } from "./resource-metadata";
import { EmptyState, StatusBadge } from "./primitives";

export interface TelemetryTargetOption {
  id: string;
  label: string;
}

const SOURCE_TYPES: Array<{ value: TelemetrySourceType; label: string }> = [
  { value: "otlp", label: "OTLP" },
  { value: "dilanix_python", label: "Dilanix Python" },
  { value: "dilanix_php", label: "Dilanix PHP" },
  { value: "dilanix_go", label: "Dilanix Go" },
  { value: "dilanix_node", label: "Dilanix Node" },
  { value: "custom_http", label: "Custom HTTP" },
  { value: "aws_cloudwatch", label: "AWS CloudWatch" },
  { value: "cloudflare", label: "Cloudflare" },
  { value: "kubernetes", label: "Kubernetes" },
];

const TOKEN_SCOPES: Array<{
  value: TelemetryIngestionScope;
  label: string;
}> = [
  { value: "telemetry:logs:write", label: "Logs" },
  { value: "telemetry:traces:write", label: "Traces" },
  { value: "telemetry:metrics:write", label: "Metrics" },
  { value: "telemetry:events:write", label: "Events" },
];

function formatDate(value: string | null, fallback = "Never") {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function sortSources(sources: CoreTelemetrySource[]) {
  return [...sources].sort((left, right) => {
    if (left.status !== right.status) return left.status === "active" ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

function expiration(value: string): string | null {
  if (value === "never") return null;
  const date = new Date();
  date.setDate(date.getDate() + Number(value));
  return date.toISOString();
}

function parseConfiguration(
  value: string,
): { data: Record<string, unknown> } | { error: string } {
  if (!value.trim()) return { data: {} };
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return { error: "Configuration must be a JSON object." };
    }
    return { data: parsed as Record<string, unknown> };
  } catch {
    return { error: "Configuration is not valid JSON." };
  }
}

export function EnvironmentTelemetryClient({
  application,
  initialEnvironment,
  initialSources,
  initialTokens,
  targetOptions,
}: {
  application: CoreApplication;
  initialEnvironment: CoreApplicationEnvironment;
  initialSources: CoreTelemetrySource[];
  initialTokens: Record<string, CoreTelemetryIngestionToken[]>;
  targetOptions: TelemetryTargetOption[];
}) {
  const router = useRouter();
  const [environment, setEnvironment] = useState(initialEnvironment);
  const [sources, setSources] = useState(() => sortSources(initialSources));
  const [tokens, setTokens] = useState(initialTokens);
  const [environmentDialog, setEnvironmentDialog] = useState(false);
  const [sourceDialog, setSourceDialog] = useState<{
    mode: "create" | "edit";
    source?: CoreTelemetrySource;
  } | null>(null);
  const [tokenSource, setTokenSource] = useState<CoreTelemetrySource | null>(
    null,
  );
  const [generatedToken, setGeneratedToken] = useState<{
    sourceName: string;
    value: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "environment" }
    | { kind: "source"; source: CoreTelemetrySource }
    | {
        kind: "token";
        sourceId: string;
        token: CoreTelemetryIngestionToken;
      }
    | null
  >(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function closeDialogs() {
    setEnvironmentDialog(false);
    setSourceDialog(null);
    setTokenSource(null);
    setError("");
  }

  function toggleEnvironmentStatus() {
    setError("");
    startTransition(async () => {
      const result = await updateEnvironmentAction(
        application.id,
        environment.id,
        {
          status: environment.status === "active" ? "archived" : "active",
        },
      );
      if (result.error) return setError(result.error);
      if (result.data) setEnvironment(result.data);
    });
  }

  function toggleSourceStatus(source: CoreTelemetrySource) {
    setError("");
    startTransition(async () => {
      const result = await updateTelemetrySourceAction(
        application.id,
        environment.id,
        source.id,
        { status: source.status === "active" ? "archived" : "active" },
      );
      if (result.error) return setError(result.error);
      if (result.data) {
        setSources((current) =>
          sortSources(
            current.map((item) =>
              item.id === result.data!.id ? result.data! : item,
            ),
          ),
        );
      }
    });
  }

  function revokeToken(sourceId: string, tokenId: string) {
    setError("");
    startTransition(async () => {
      const result = await revokeTelemetryTokenAction(
        application.id,
        environment.id,
        sourceId,
        tokenId,
      );
      if (result.error) return setError(result.error);
      if (result.data) {
        setTokens((current) => ({
          ...current,
          [sourceId]: (current[sourceId] ?? []).map((item) =>
            item.id === result.data!.id ? result.data! : item,
          ),
        }));
      }
    });
  }

  function deleteSelectedTarget(confirmName?: string) {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setError("");
    startTransition(async () => {
      if (target.kind === "environment") {
        const result = await deleteEnvironmentAction(
          application.id,
          environment.id,
          confirmName ?? "",
        );
        if (result.error) return setError(result.error);
        router.push(`/dashboard/applications/${application.id}` as Route);
        router.refresh();
        return;
      }

      if (target.kind === "source") {
        const result = await deleteTelemetrySourceAction(
          application.id,
          environment.id,
          target.source.id,
          confirmName ?? "",
        );
        if (result.error) return setError(result.error);
        setSources((current) =>
          current.filter((source) => source.id !== target.source.id),
        );
        setTokens((current) => {
          const next = { ...current };
          delete next[target.source.id];
          return next;
        });
        setDeleteTarget(null);
        return;
      }

      const result = await deleteTelemetryTokenAction(
        application.id,
        environment.id,
        target.sourceId,
        target.token.id,
      );
      if (result.error) return setError(result.error);
      setTokens((current) => ({
        ...current,
        [target.sourceId]: (current[target.sourceId] ?? []).filter(
          (token) => token.id !== target.token.id,
        ),
      }));
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <section className="border-border-soft bg-card-strong/70 rounded-2xl border p-5 shadow-[0_16px_40px_var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{environment.name}</h2>
              <StatusBadge
                status={environment.status === "active" ? "success" : "neutral"}
              >
                {environment.status}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              {application.slug} / {environment.slug}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEnvironmentDialog(true)}
              className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium"
            >
              <Pencil size={13} /> Rename
            </button>
            <button
              type="button"
              onClick={toggleEnvironmentStatus}
              disabled={pending}
              className="border-foreground/15 hover:bg-foreground/5 text-muted-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"
            >
              {environment.status === "active" ? (
                <Archive size={13} />
              ) : (
                <RotateCcw size={13} />
              )}
              {environment.status === "active" ? "Archive" : "Restore"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setDeleteTarget({ kind: "environment" });
              }}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/5 disabled:opacity-50"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </section>

      {error &&
      !environmentDialog &&
      !sourceDialog &&
      !tokenSource &&
      !generatedToken &&
      !deleteTarget ? (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}

      <section>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Telemetry sources</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Configure how this environment sends telemetry to Dilanix.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSourceDialog({ mode: "create" })}
            className="bg-accent text-accent-foreground inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
          >
            <Plus size={14} /> Add source
          </button>
        </div>

        {sources.length === 0 ? (
          <EmptyState
            title="No telemetry sources"
            description="Add an SDK, OTLP, cloud, or custom HTTP source for this environment."
          />
        ) : (
          <div className="space-y-4">
            {sources.map((source) => {
              const sourceTokens = tokens[source.id] ?? [];
              return (
                <article
                  key={source.id}
                  className="border-border-soft bg-card-strong/55 rounded-2xl border p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <span className="bg-accent/10 text-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        <RadioTower size={16} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{source.name}</h3>
                          <StatusBadge
                            status={
                              source.status === "active" ? "success" : "neutral"
                            }
                          >
                            {source.status}
                          </StatusBadge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {SOURCE_TYPES.find(
                            (item) => item.value === source.source_type,
                          )?.label ?? source.source_type}
                          {source.integration_target_id
                            ? ` · target ${source.integration_target_id}`
                            : " · direct ingestion"}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Last received: {formatDate(source.last_received_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setSourceDialog({ mode: "edit", source })
                        }
                        className="text-accent inline-flex items-center gap-1 text-xs hover:underline"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setTokenSource(source)}
                        disabled={source.status !== "active"}
                        className="text-accent inline-flex items-center gap-1 text-xs hover:underline disabled:opacity-40"
                      >
                        <KeyRound size={12} /> Create token
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSourceStatus(source)}
                        disabled={pending}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs disabled:opacity-50"
                      >
                        {source.status === "active" ? (
                          <Archive size={12} />
                        ) : (
                          <RotateCcw size={12} />
                        )}
                        {source.status === "active" ? "Archive" : "Restore"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setDeleteTarget({ kind: "source", source });
                        }}
                        disabled={pending}
                        className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>

                  {hasResourceMetadata(source.configuration) ? (
                    <div className="border-border-soft mt-4 border-t pt-4">
                      <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-wide uppercase">
                        Configuration
                      </p>
                      <ResourceMetadata metadata={source.configuration} />
                    </div>
                  ) : null}

                  <div className="border-border-soft mt-4 border-t pt-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                        Ingestion tokens
                      </p>
                      <span className="text-muted-foreground text-xs">
                        {sourceTokens.length}
                      </span>
                    </div>
                    {sourceTokens.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No tokens created for this source.
                      </p>
                    ) : (
                      <div className="divide-border-soft divide-y rounded-xl border">
                        {sourceTokens.map((ingestionToken) => (
                          <div
                            key={ingestionToken.id}
                            className="flex flex-col gap-3 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <code>
                                  {ingestionToken.token_prefix}••••••••
                                </code>
                                <StatusBadge
                                  status={
                                    ingestionToken.is_revoked
                                      ? "neutral"
                                      : "success"
                                  }
                                >
                                  {ingestionToken.is_revoked
                                    ? "revoked"
                                    : "active"}
                                </StatusBadge>
                              </div>
                              <p className="text-muted-foreground mt-1 break-words">
                                {ingestionToken.scopes.join(", ")}
                              </p>
                              <p className="text-muted-foreground mt-1">
                                Expires: {formatDate(ingestionToken.expires_at)}{" "}
                                · Last used:{" "}
                                {formatDate(ingestionToken.last_used_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 self-start sm:self-auto">
                              <button
                                type="button"
                                disabled={ingestionToken.is_revoked || pending}
                                onClick={() =>
                                  revokeToken(source.id, ingestionToken.id)
                                }
                                className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                              >
                                {ingestionToken.is_revoked
                                  ? "Revoked"
                                  : "Revoke"}
                              </button>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => {
                                  setError("");
                                  setDeleteTarget({
                                    kind: "token",
                                    sourceId: source.id,
                                    token: ingestionToken,
                                  });
                                }}
                                aria-label={`Delete token ${ingestionToken.token_prefix} permanently`}
                                className="text-muted-foreground inline-flex items-center gap-1 hover:text-red-500 disabled:opacity-40"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {environmentDialog ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-environment-title"
            className="bg-background border-foreground/15 w-full max-w-md rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <h2
                id="rename-environment-title"
                className="text-lg font-semibold"
              >
                Rename environment
              </h2>
              <button
                type="button"
                onClick={closeDialogs}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                setError("");
                startTransition(async () => {
                  const result = await updateEnvironmentAction(
                    application.id,
                    environment.id,
                    { name: String(data.get("name") ?? "") },
                  );
                  if (result.error) return setError(result.error);
                  if (result.data) setEnvironment(result.data);
                  closeDialogs();
                });
              }}
            >
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Name</span>
                <input
                  name="name"
                  required
                  defaultValue={environment.name}
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                />
              </label>
              {error ? (
                <p role="alert" className="text-sm text-red-500">
                  {error}
                </p>
              ) : null}
              <button
                disabled={pending}
                className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {sourceDialog ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-dialog-title"
            className="bg-background border-foreground/15 my-8 w-full max-w-xl rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 id="source-dialog-title" className="text-lg font-semibold">
                  {sourceDialog.mode === "create"
                    ? "Add telemetry source"
                    : "Edit telemetry source"}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Configuration is provider-specific JSON and never stores an
                  ingestion secret.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialogs}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const configuration = parseConfiguration(
                  String(data.get("configuration") ?? ""),
                );
                if ("error" in configuration) {
                  setError(configuration.error);
                  return;
                }
                setError("");
                startTransition(async () => {
                  const result =
                    sourceDialog.mode === "create"
                      ? await createTelemetrySourceAction(
                          application.id,
                          environment.id,
                          {
                            name: String(data.get("name") ?? ""),
                            sourceType: String(data.get("source_type") ?? ""),
                            integrationTargetId:
                              String(data.get("target_id") ?? "") || null,
                            configuration: configuration.data,
                          },
                        )
                      : await updateTelemetrySourceAction(
                          application.id,
                          environment.id,
                          sourceDialog.source!.id,
                          {
                            name: String(data.get("name") ?? ""),
                            configuration: configuration.data,
                          },
                        );
                  if (result.error) return setError(result.error);
                  if (result.data) {
                    setSources((current) =>
                      sortSources(
                        sourceDialog.mode === "create"
                          ? [...current, result.data!]
                          : current.map((item) =>
                              item.id === result.data!.id ? result.data! : item,
                            ),
                      ),
                    );
                    if (sourceDialog.mode === "create") {
                      setTokens((current) => ({
                        ...current,
                        [result.data!.id]: [],
                      }));
                    }
                  }
                  closeDialogs();
                });
              }}
            >
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Name</span>
                <input
                  name="name"
                  required
                  defaultValue={sourceDialog.source?.name ?? ""}
                  className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 outline-none"
                />
              </label>
              {sourceDialog.mode === "create" ? (
                <>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium">
                      Source type
                    </span>
                    <select
                      name="source_type"
                      defaultValue="otlp"
                      className="border-foreground/15 bg-background h-10 w-full rounded-lg border px-3"
                    >
                      {SOURCE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium">
                      Integration target
                    </span>
                    <select
                      name="target_id"
                      defaultValue=""
                      className="border-foreground/15 bg-background h-10 w-full rounded-lg border px-3"
                    >
                      <option value="">Direct ingestion (no target)</option>
                      {targetOptions.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">
                  Configuration JSON
                </span>
                <textarea
                  name="configuration"
                  rows={8}
                  spellCheck={false}
                  defaultValue={JSON.stringify(
                    sourceDialog.source?.configuration ?? {},
                    null,
                    2,
                  )}
                  className="border-foreground/15 bg-background focus:border-accent w-full rounded-lg border px-3 py-2 font-mono text-xs outline-none"
                />
              </label>
              {error ? (
                <p role="alert" className="text-sm text-red-500">
                  {error}
                </p>
              ) : null}
              <button
                disabled={pending}
                className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {pending
                  ? "Saving…"
                  : sourceDialog.mode === "create"
                    ? "Add source"
                    : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {tokenSource ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-token-title"
            className="bg-background border-foreground/15 w-full max-w-lg rounded-xl border p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 id="create-token-title" className="text-lg font-semibold">
                  Create ingestion token
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Source: {tokenSource.name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialogs}
                aria-label="Close dialog"
                className="text-muted-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="mt-5 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                setError("");
                startTransition(async () => {
                  const result = await createTelemetryTokenAction(
                    application.id,
                    environment.id,
                    tokenSource.id,
                    {
                      scopes: data.getAll("scopes").map(String),
                      expiresAt: expiration(
                        String(data.get("expiration") ?? "never"),
                      ),
                    },
                  );
                  if (result.error) return setError(result.error);
                  if (result.data) {
                    const { token: plaintext, ...storedToken } = result.data;
                    setTokens((current) => ({
                      ...current,
                      [tokenSource.id]: [
                        storedToken,
                        ...(current[tokenSource.id] ?? []),
                      ],
                    }));
                    setGeneratedToken({
                      sourceName: tokenSource.name,
                      value: plaintext,
                    });
                    setTokenSource(null);
                  }
                });
              }}
            >
              <fieldset>
                <legend className="text-sm font-medium">Write scopes</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {TOKEN_SCOPES.map((scope, index) => (
                    <label
                      key={scope.value}
                      className="border-foreground/10 flex items-center gap-2 rounded-lg border p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="scopes"
                        value={scope.value}
                        defaultChecked={index === 0}
                      />
                      {scope.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Expiration</span>
                <select
                  name="expiration"
                  defaultValue="never"
                  className="border-foreground/15 bg-background h-10 w-full rounded-lg border px-3"
                >
                  <option value="never">Never</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </label>
              {error ? (
                <p role="alert" className="text-sm text-red-500">
                  {error}
                </p>
              ) : null}
              <button
                disabled={pending}
                className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {pending ? "Creating…" : "Create token"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {generatedToken ? (
        <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="token-created-title"
            className="bg-background border-foreground/15 w-full max-w-lg rounded-xl border p-6 shadow-2xl"
          >
            <span className="bg-accent/10 text-accent flex h-9 w-9 items-center justify-center rounded-lg">
              <KeyRound size={17} />
            </span>
            <h2 id="token-created-title" className="mt-4 text-lg font-semibold">
              Ingestion token created
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Copy this token for {generatedToken.sourceName} now. It cannot be
              retrieved again.
            </p>
            <div className="border-foreground/15 mt-4 flex items-center gap-2 rounded-lg border p-3">
              <code className="min-w-0 flex-1 overflow-hidden text-sm text-ellipsis">
                {generatedToken.value}
              </code>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(generatedToken.value);
                  setCopied(true);
                }}
                className="text-accent inline-flex items-center gap-1 text-xs"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setGeneratedToken(null);
                setCopied(false);
                setError("");
              }}
              className="bg-accent text-accent-foreground mt-5 w-full rounded-lg py-2.5 text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <DestructiveActionDialog
          key={
            deleteTarget.kind === "environment"
              ? environment.id
              : deleteTarget.kind === "source"
                ? deleteTarget.source.id
                : deleteTarget.token.id
          }
          title={
            deleteTarget.kind === "environment"
              ? `Permanently delete ${environment.name}?`
              : deleteTarget.kind === "source"
                ? `Permanently delete ${deleteTarget.source.name}?`
                : `Permanently delete token ${deleteTarget.token.token_prefix}…?`
          }
          description={
            deleteTarget.kind === "environment"
              ? "This irreversibly deletes the environment, every telemetry source, ingestion token, and all telemetry data it owns. This cannot be undone."
              : deleteTarget.kind === "source"
                ? "This irreversibly deletes the telemetry source, its ingestion tokens, and all telemetry logs it owns. This cannot be undone."
                : "This permanently removes the ingestion token record. Any client using this credential will no longer be able to authenticate. This cannot be undone."
          }
          confirmationName={
            deleteTarget.kind === "environment"
              ? environment.name
              : deleteTarget.kind === "source"
                ? deleteTarget.source.name
                : undefined
          }
          pending={pending}
          error={error}
          onCancel={() => {
            setDeleteTarget(null);
            setError("");
          }}
          onConfirm={deleteSelectedTarget}
        />
      ) : null}
    </>
  );
}
