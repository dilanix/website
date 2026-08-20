"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Plus, ShieldCheck } from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Section,
  StatusBadge,
} from "@/components/dashboard/primitives";
import { formatDateTime } from "../utils";
import type { AnalysisPolicy, AnalysisPolicyDefinition } from "./types";
import {
  activateAnalysisPolicyAction,
  createAnalysisPolicyAction,
} from "@/app/dashboard/costops/actions";

const template: AnalysisPolicyDefinition = {
  window_days: 30,
  expected_metric_keys: ["cpu.utilization"],
  quality: {
    metric_weight: 0.7,
    temporal_weight: 0.3,
    good_min_score: 80,
    partial_min_score: 40,
  },
  signals: [],
};

export function AnalysisPoliciesView({
  initialPolicies,
}: {
  initialPolicies: AnalysisPolicy[];
}) {
  const [policies, setPolicies] = useState(initialPolicies);
  const [resourceType, setResourceType] = useState("");
  const [version, setVersion] = useState("");
  const [definition, setDefinition] = useState(
    JSON.stringify(template, null, 2),
  );
  const [activate, setActivate] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const groups = useMemo(
    () =>
      policies.reduce<Record<string, AnalysisPolicy[]>>((result, policy) => {
        (result[policy.resourceType] ??= []).push(policy);
        return result;
      }, {}),
    [policies],
  );

  async function createPolicy(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    let parsed: AnalysisPolicyDefinition;
    try {
      parsed = JSON.parse(definition) as AnalysisPolicyDefinition;
    } catch {
      setError("Definition must be valid JSON.");
      return;
    }
    setBusy("create");
    const result = await createAnalysisPolicyAction({
      resourceType,
      version,
      definition: parsed,
      activate,
    });
    setBusy(null);
    if (!result.data) {
      setError(result.error ?? "Unable to create policy.");
      return;
    }
    setPolicies((current) => [
      result.data!,
      ...current.map((item) =>
        activate && item.resourceType === resourceType
          ? { ...item, isActive: false }
          : item,
      ),
    ]);
    setVersion("");
  }

  async function activatePolicy(policy: AnalysisPolicy) {
    setBusy(policy.id);
    setError(null);
    const result = await activateAnalysisPolicyAction(policy.id);
    setBusy(null);
    if (!result.data) {
      setError(result.error ?? "Unable to activate policy.");
      return;
    }
    setPolicies((current) =>
      current.map((item) =>
        item.resourceType === policy.resourceType
          ? { ...item, isActive: item.id === policy.id }
          : item,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Analysis Policies"
        description="Versioned provider-neutral evidence configuration. Changes affect future snapshots only."
      />
      <div className="border-accent/20 bg-accent/5 flex gap-3 rounded-xl border p-4 text-sm">
        <ShieldCheck className="text-accent mt-0.5 shrink-0" size={18} />
        <p>
          Global control-plane access is restricted to Dilanix superusers.
          Versions are immutable; create and activate a new version to change
          analysis behavior safely.
        </p>
      </div>
      <Section title="Create policy version">
        <form
          onSubmit={(event) => void createPolicy(event)}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Resource type
              <input
                required
                pattern="[a-z][a-z0-9_]*"
                value={resourceType}
                onChange={(event) => setResourceType(event.target.value)}
                className="border-foreground/15 bg-background mt-2 h-10 w-full rounded-lg border px-3 font-mono text-sm"
                placeholder="compute_instance"
              />
            </label>
            <label className="text-sm">
              Version
              <input
                required
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                className="border-foreground/15 bg-background mt-2 h-10 w-full rounded-lg border px-3 font-mono text-sm"
                placeholder="2.0"
              />
            </label>
          </div>
          <label className="block text-sm">
            Validated JSON definition
            <textarea
              required
              rows={16}
              value={definition}
              onChange={(event) => setDefinition(event.target.value)}
              spellCheck={false}
              className="border-foreground/15 bg-background mt-2 w-full rounded-lg border p-3 font-mono text-xs leading-5"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activate}
              onChange={(event) => setActivate(event.target.checked)}
            />{" "}
            Activate after creation
          </label>
          {error ? (
            <p
              role="alert"
              className="text-sm text-amber-600 dark:text-amber-300"
            >
              {error}
            </p>
          ) : null}
          <button
            disabled={busy !== null}
            className="bg-accent text-accent-foreground inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium disabled:opacity-50"
          >
            <Plus size={15} />
            {busy === "create" ? "Creating…" : "Create version"}
          </button>
        </form>
      </Section>
      <Section title="Policy versions">
        {Object.keys(groups).length ? (
          <div className="space-y-5">
            {Object.entries(groups).map(([type, versions]) => (
              <article
                key={type}
                className="border-foreground/10 overflow-hidden rounded-xl border"
              >
                <h3 className="bg-foreground/[0.025] border-foreground/10 border-b px-4 py-3 font-mono text-sm font-medium">
                  {type}
                </h3>
                <div className="divide-foreground/10 divide-y">
                  {versions.map((policy) => (
                    <div
                      key={policy.id}
                      className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            v{policy.version}
                          </span>
                          {policy.isActive ? (
                            <StatusBadge status="success">Active</StatusBadge>
                          ) : (
                            <StatusBadge status="neutral">Inactive</StatusBadge>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-2 text-xs">
                          {policy.definition.window_days} days ·{" "}
                          {policy.definition.expected_metric_keys.length}{" "}
                          metrics · {policy.definition.signals.length} signals ·
                          created {formatDateTime(policy.createdAt)}
                        </p>
                      </div>
                      {!policy.isActive ? (
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => void activatePolicy(policy)}
                          className="border-foreground/15 hover:border-accent/50 inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          {busy === policy.id ? "Activating…" : "Activate"}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No policies"
            description="Create the first validated analysis policy version."
          />
        )}
      </Section>
    </div>
  );
}
