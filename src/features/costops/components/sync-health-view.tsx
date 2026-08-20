"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  PageHeader,
  Section,
  StatusBadge,
} from "@/components/dashboard/primitives";
import { getSyncHealthAction } from "@/app/dashboard/costops/actions";
import type { SyncHealth } from "../api/costops-api";
import { useCostOps } from "../costops-context";
import { formatDateTime } from "../utils";

export function SyncHealthView({
  initialHealth,
}: {
  initialHealth: SyncHealth;
}) {
  const { integrations } = useCostOps();
  const [health, setHealth] = useState(initialHealth);
  const [integrationId, setIntegrationId] = useState("");
  const [status, setStatus] = useState("");
  const [warningsOnly, setWarningsOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(
    page = 1,
    overrides?: {
      integrationId?: string;
      status?: string;
      warningsOnly?: boolean;
    },
  ) {
    setLoading(true);
    setError("");
    const query = {
      integrationId: overrides?.integrationId ?? (integrationId || undefined),
      status: overrides?.status ?? (status || undefined),
      warningsOnly: overrides?.warningsOnly ?? warningsOnly,
      page,
    };
    const result = await getSyncHealthAction(query);
    setLoading(false);
    if (!result.data) {
      setError(result.error ?? "Unable to load sync health.");
      return;
    }
    setHealth(result.data);
  }

  const integrationName = (id: string) =>
    integrations.find((item) => item.id === id)?.name ?? id;
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Sync Health"
        description="Persistent run outcomes, collection warnings, data completeness alerts, and retention-aware operational history."
        action={
          <button
            type="button"
            onClick={() => void load(health.page)}
            disabled={loading}
            className="border-foreground/15 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthMetric label="Total runs" value={health.summary.totalRuns} />
        <HealthMetric
          label="Failed"
          value={health.summary.failedRuns}
          warning={health.summary.failedRuns > 0}
        />
        <HealthMetric
          label="With warnings"
          value={health.summary.runsWithWarnings}
          warning={health.summary.runsWithWarnings > 0}
        />
        <HealthMetric label="Active" value={health.summary.activeRuns} />
        <HealthMetric
          label="Stale resources"
          value={health.summary.staleResources}
          warning={health.summary.staleResources > 0}
        />
        <HealthMetric
          label="Insufficient evidence"
          value={health.summary.insufficientEvidence}
          warning={health.summary.insufficientEvidence > 0}
        />
        <HealthMetric
          label="Missing policy"
          value={health.summary.resourcesMissingPolicy}
          warning={health.summary.resourcesMissingPolicy > 0}
        />
        <HealthMetric
          label="Latest success"
          value={
            health.summary.latestSuccessAt
              ? formatDateTime(health.summary.latestSuccessAt)
              : "Never"
          }
        />
      </dl>
      <Section title="Operational alerts">
        {health.alerts.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {health.alerts.map((alert) => (
              <article
                key={`${alert.key}-${alert.integrationId ?? "global"}`}
                className={`rounded-xl border p-4 ${alert.severity === "critical" ? "border-red-500/25 bg-red-500/5" : "border-amber-500/25 bg-amber-500/5"}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={17}
                    className={
                      alert.severity === "critical"
                        ? "text-red-500"
                        : "text-amber-500"
                    }
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium">
                        {alert.key.replaceAll("_", " ")}
                      </h3>
                      <StatusBadge status="warning">
                        {alert.severity}
                      </StatusBadge>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {alert.message}
                    </p>
                    {alert.integrationId ? (
                      <p className="text-muted-foreground mt-2 text-xs">
                        Integration: {integrationName(alert.integrationId)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground border-foreground/10 rounded-xl border border-dashed p-6 text-sm">
            No active operational alerts.
          </p>
        )}
      </Section>
      <Section title="Run history">
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={integrationId}
            onChange={(event) => {
              const value = event.target.value;
              setIntegrationId(value);
              void load(1, { integrationId: value || undefined });
            }}
            className="border-foreground/15 bg-background h-9 rounded-lg border px-3 text-xs"
          >
            <option value="">All integrations</option>
            {integrations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => {
              const value = event.target.value;
              setStatus(value);
              void load(1, { status: value || undefined });
            }}
            className="border-foreground/15 bg-background h-9 rounded-lg border px-3 text-xs"
          >
            <option value="">All statuses</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
          </select>
          <label className="border-foreground/15 flex h-9 items-center gap-2 rounded-lg border px-3 text-xs">
            <input
              type="checkbox"
              checked={warningsOnly}
              onChange={(event) => {
                setWarningsOnly(event.target.checked);
                void load(1, { warningsOnly: event.target.checked });
              }}
            />
            Warnings only
          </label>
        </div>
        {error ? (
          <p role="alert" className="mb-4 text-sm text-red-500">
            {error}
          </p>
        ) : null}
        <div className="border-foreground/10 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-4xl text-left text-xs">
            <thead className="bg-foreground/[0.025] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Integration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Warnings</th>
                <th className="px-4 py-3">Summary</th>
              </tr>
            </thead>
            <tbody>
              {health.runs.map((run) => (
                <tr
                  key={run.id}
                  className="border-foreground/7 border-t align-top"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDateTime(run.heartbeatAt)}
                  </td>
                  <td className="px-4 py-3">
                    {integrationName(run.integrationId)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={
                        run.status === "succeeded"
                          ? run.warningCount
                            ? "warning"
                            : "success"
                          : run.status === "failed"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {run.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    {run.progressMessage ?? run.stage}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs space-y-1">
                      {run.warnings.length
                        ? run.warnings.map((warning, index) => (
                            <p
                              key={`${warning.code}-${index}`}
                              className="text-amber-600 dark:text-amber-300"
                            >
                              {warning.stage}: {warning.message}
                            </p>
                          ))
                        : "—"}
                      {run.errorMessage ? (
                        <p className="text-red-500">{run.errorMessage}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px]">
                    {Object.entries(run.summary).map(([key, value]) => (
                      <div key={key}>
                        {key}: {String(value)}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {health.total} runs · page {health.page} of{" "}
            {Math.max(health.pages, 1)}
          </span>
          <div className="flex gap-2">
            <button
              disabled={loading || health.page <= 1}
              onClick={() => void load(health.page - 1)}
              className="border-foreground/15 rounded-lg border p-2 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={loading || health.page >= health.pages}
              onClick={() => void load(health.page + 1)}
              className="border-foreground/15 rounded-lg border p-2 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}

function HealthMetric({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string | number;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${warning ? "border-amber-500/25 bg-amber-500/5" : "border-foreground/10"}`}
    >
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-2 font-mono text-lg font-medium">{value}</dd>
    </div>
  );
}
