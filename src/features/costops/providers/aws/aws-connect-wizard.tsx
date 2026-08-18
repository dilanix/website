"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { CostOpsClientError, useCostOps } from "../../costops-context";
import type { CostOpsIntegration } from "../../types";
import { awsVerificationErrorMessage, isAwsAccountId } from "./aws-onboarding";

type WizardStep = 1 | 2 | 3 | 4;

function initialStep(integration?: CostOpsIntegration): WizardStep {
  if (!integration) return 1;
  return integration.status === "pending" ? 2 : 3;
}

function verificationMessage(error: unknown) {
  if (!(error instanceof CostOpsClientError)) {
    return awsVerificationErrorMessage(undefined);
  }
  return awsVerificationErrorMessage(error.status, error.message);
}

export function AwsConnectWizard({
  initialIntegration,
  onClose,
}: {
  initialIntegration?: CostOpsIntegration;
  onClose(): void;
}) {
  const api = useCostOps();
  const [step, setStep] = useState<WizardStep>(() =>
    initialStep(initialIntegration),
  );
  const [integration, setIntegration] = useState(initialIntegration);
  const [name, setName] = useState("AWS Production");
  const [awsAccountId, setAwsAccountId] = useState(
    initialIntegration?.externalAccountId ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const liveIntegration = integration
    ? (api.integrations.find((item) => item.id === integration.id) ??
      integration)
    : undefined;
  const latestSync = liveIntegration
    ? api.snapshot.syncRuns[liveIntegration.id]?.[0]
    : undefined;
  const syncActive =
    latestSync?.status === "pending" || latestSync?.status === "running";

  useEffect(() => {
    titleRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose]);

  useEffect(() => {
    if (step !== 4 || latestSync) return;
    const timer = window.setInterval(() => {
      api.refresh().catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [api, latestSync, step]);

  async function create() {
    setBusy(true);
    setError("");
    try {
      const value = await api.createIntegration(name.trim());
      setIntegration(value);
      setStep(2);
    } catch (caught) {
      setError(
        caught instanceof CostOpsClientError && caught.status !== 503
          ? caught.message
          : "AWS integration is temporarily unavailable. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function openAwsConsole() {
    const url = integration?.setup?.cloudformationUrl;
    if (!url) {
      setError(
        "AWS setup is temporarily unavailable. Please close this window and try again.",
      );
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copyExternalId() {
    const externalId = integration?.setup?.externalId;
    if (!externalId) return;
    try {
      await navigator.clipboard.writeText(externalId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Unable to copy the External ID. Select and copy it manually.");
    }
  }

  async function verify() {
    if (!integration) return;
    if (!isAwsAccountId(awsAccountId)) {
      setError("Enter a valid 12-digit AWS Account ID.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const value = await api.verifyIntegration(integration.id, awsAccountId);
      setIntegration((current) => ({
        ...value,
        setup: current?.setup,
      }));
      setStep(4);
    } catch (caught) {
      setError(verificationMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function retrySync() {
    if (!integration) return;
    setBusy(true);
    setError("");
    try {
      await api.syncNow(integration.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to start cost sync.",
      );
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<WizardStep, string> = {
    1: "Connect Amazon Web Services",
    2: "Launch CloudFormation",
    3: "Verify your AWS account",
    4: "AWS connected",
  };

  return (
    <div className="bg-background/80 fixed inset-0 z-50 overflow-y-auto p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="aws-wizard-title"
        className="bg-background border-foreground/15 mx-auto my-6 w-full max-w-2xl rounded-xl border p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs">Step {step} of 4</p>
            <h2
              ref={titleRef}
              tabIndex={-1}
              id="aws-wizard-title"
              className="mt-1 text-xl font-semibold outline-none"
            >
              {titles[step]}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close AWS setup"
            className="text-muted-foreground hover:bg-foreground/5 rounded-md p-1.5 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        {step === 1 ? (
          <div className="mt-6">
            <div className="bg-foreground/[0.025] border-foreground/10 rounded-xl border p-5">
              <ShieldCheck className="text-accent" size={22} />
              <p className="mt-4 text-sm leading-6">
                CostOps uses a read-only cross-account IAM role secured with an
                External ID to analyze AWS billing data.
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                No AWS access keys or secret access keys are required.
              </p>
            </div>
            <label
              htmlFor="aws-integration-name"
              className="mt-5 block text-sm font-medium"
            >
              Integration name
            </label>
            <input
              id="aws-integration-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
              className="border-foreground/15 bg-background focus:border-accent mt-2 h-10 w-full rounded-lg border px-3 outline-none"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="border-foreground/15 hover:border-foreground/30 rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !name.trim()}
                onClick={create}
                className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {busy ? "Creating…" : "Continue"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 && integration ? (
          <div className="mt-6 space-y-5">
            <div className="border-accent/30 bg-accent/5 rounded-xl border p-5">
              <p className="text-xs font-semibold tracking-wider uppercase">
                AWS Console
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Open the prepared CloudFormation stack in a new tab. In AWS,
                paste the External ID below and choose Create stack.
              </p>
              <button
                type="button"
                onClick={openAwsConsole}
                disabled={!integration.setup?.cloudformationUrl}
                className="bg-accent text-accent-foreground mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Open AWS Console <ExternalLink size={14} aria-hidden="true" />
              </button>
            </div>

            <div>
              <label
                htmlFor="costops-external-id"
                className="text-sm font-medium"
              >
                External ID
              </label>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                Paste this into the ExternalId field in AWS. AWS does not allow
                secret fields to be pre-filled by a launch link.
              </p>
              <div className="border-foreground/15 mt-2 flex min-w-0 items-center gap-2 rounded-lg border p-2">
                <input
                  id="costops-external-id"
                  readOnly
                  value={integration.setup?.externalId ?? ""}
                  className="min-w-0 flex-1 bg-transparent px-1 font-mono text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={copyExternalId}
                  disabled={!integration.setup?.externalId}
                  aria-label={
                    copied ? "External ID copied" : "Copy External ID"
                  }
                  className="border-foreground/15 hover:bg-foreground/5 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <dl className="border-foreground/10 grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs">Stack name</dt>
                <dd className="mt-1 font-mono text-xs">
                  {integration.setup?.stackName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">IAM role name</dt>
                <dd className="mt-1 font-mono text-xs">
                  {integration.setup?.roleName ?? "—"}
                </dd>
              </div>
            </dl>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(3);
                }}
                className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 && integration ? (
          <div className="mt-6">
            <p className="text-muted-foreground text-sm leading-6">
              Once the CloudFormation stack finishes creating, enter the
              12-digit ID of that AWS account. IAM changes can take a few
              seconds to propagate, so verification is safe to retry.
            </p>
            <label
              htmlFor="aws-account-id"
              className="mt-5 block text-sm font-medium"
            >
              AWS Account ID
            </label>
            <input
              id="aws-account-id"
              inputMode="numeric"
              autoComplete="off"
              maxLength={12}
              aria-describedby={
                error ? "aws-verification-error" : "aws-account-hint"
              }
              aria-invalid={Boolean(error)}
              value={awsAccountId}
              onChange={(event) => {
                setAwsAccountId(
                  event.target.value.replace(/\D/g, "").slice(0, 12),
                );
                setError("");
              }}
              onBlur={() => {
                if (awsAccountId && !isAwsAccountId(awsAccountId)) {
                  setError("Enter a valid 12-digit AWS Account ID.");
                }
              }}
              placeholder="123456789012"
              className="border-foreground/15 bg-background focus:border-accent mt-2 h-11 w-full rounded-lg border px-3 font-mono text-sm outline-none"
            />
            <p
              id="aws-account-hint"
              className="text-muted-foreground mt-2 text-xs"
            >
              Digits only. You can find this in the AWS Console account menu.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(2);
                }}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                View AWS setup again
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={verify}
                className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Verifying…
                  </>
                ) : (
                  "Verify connection"
                )}
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 && liveIntegration ? (
          <div className="mt-7">
            <div className="flex items-center gap-3">
              <span className="bg-success/10 text-success flex h-11 w-11 items-center justify-center rounded-full">
                <Check size={21} />
              </span>
              <div>
                <p className="font-medium">AWS connected successfully</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Account {liveIntegration.externalAccountId ?? awsAccountId}
                </p>
              </div>
              <span className="bg-success/10 text-success ml-auto rounded-full px-2.5 py-1 text-xs font-medium">
                Connected
              </span>
            </div>

            <div className="border-foreground/10 mt-6 rounded-xl border p-4">
              {syncActive || !latestSync ? (
                <div className="flex items-start gap-3">
                  <RefreshCw
                    className="text-accent mt-0.5 animate-spin"
                    size={16}
                  />
                  <div>
                    <p className="text-sm font-medium">Syncing your costs…</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Initial AWS billing data is importing in the background.
                    </p>
                  </div>
                </div>
              ) : latestSync.status === "failed" ? (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 text-amber-500" size={16} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Cost sync failed</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {latestSync.errorMessage ??
                        "AWS cost data could not be imported."}
                    </p>
                    <button
                      type="button"
                      onClick={retrySync}
                      disabled={busy}
                      className="border-foreground/15 mt-3 rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      {busy ? "Starting…" : "Sync now"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <Check className="text-success mt-0.5" size={16} />
                  <div>
                    <p className="text-sm font-medium">Cost data is ready</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {latestSync.recordsProcessed.toLocaleString()} records
                      processed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {liveIntegration.roleArn ? (
              <p className="text-muted-foreground mt-4 font-mono text-xs break-all">
                {liveIntegration.roleArn}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
              >
                Go to CostOps
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p
            id="aws-verification-error"
            role="alert"
            className="mt-5 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
