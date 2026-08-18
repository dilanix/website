"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, ShieldCheck, X } from "lucide-react";
import { useCostOps } from "../../costops-context";
import type { CostOpsIntegration } from "../../types";

export function AwsConnectWizard({
  initialIntegration,
  onClose,
}: {
  initialIntegration?: CostOpsIntegration;
  onClose(): void;
}) {
  const api = useCostOps();
  const [step, setStep] = useState(initialIntegration ? 2 : 1);
  const [setup, setSetup] = useState<CostOpsIntegration | undefined>(
    initialIntegration,
  );
  const [name, setName] = useState("AWS Production");
  const [roleArn, setRoleArn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, [step]);
  async function create() {
    setBusy(true);
    setError("");
    try {
      const value = await api.createIntegration(name);
      setSetup(value);
      setStep(2);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to create integration.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    if (!setup) return;
    setBusy(true);
    setError("");
    setStep(4);
    try {
      await api.verifyIntegration(setup.id, roleArn);
      setStep(5);
    } catch (e) {
      setError(
        e instanceof Error && e.message === "INVALID_ROLE_ARN"
          ? "Enter a valid IAM role ARN, including the 12-digit AWS account ID."
          : "The IAM role could not be accessed. Check the trusted principal, External ID, and Role ARN.",
      );
      setStep(3);
    } finally {
      setBusy(false);
    }
  }
  const copy = (value: string) => navigator.clipboard.writeText(value);
  function downloadTemplate() {
    if (!setup?.setup?.cloudformationTemplate) return;
    const url = URL.createObjectURL(
      new Blob([setup.setup.cloudformationTemplate], {
        type: "application/yaml",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dilanix-costops-cloudformation.yaml";
    anchor.click();
    URL.revokeObjectURL(url);
  }
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
            <p className="text-muted-foreground text-xs">Step {step} of 5</p>
            <h2
              ref={titleRef}
              tabIndex={-1}
              id="aws-wizard-title"
              className="mt-1 text-xl font-semibold outline-none"
            >
              {
                [
                  "",
                  "Connect Amazon Web Services",
                  "Set up AWS access",
                  "Enter IAM Role ARN",
                  "Verifying AWS connection…",
                  "AWS connected successfully",
                ][step]
              }
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close setup"
            className="text-muted-foreground p-1"
          >
            <X size={19} />
          </button>
        </div>
        {step === 1 ? (
          <div className="mt-6">
            <div className="bg-foreground/[0.025] border-foreground/10 rounded-xl border p-5">
              <ShieldCheck className="text-accent" size={22} />
              <p className="mt-4 text-sm leading-6">
                CostOps uses read-only access to analyze AWS billing data
                through a cross-account IAM role secured with an External ID.
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                No AWS access keys or secret access keys are required.
              </p>
            </div>
            <label className="mt-5 block text-sm font-medium">
              Integration name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-foreground/15 bg-background focus:border-accent mt-2 h-10 w-full rounded-lg border px-3 outline-none"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="border-foreground/15 rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={busy || !name.trim()}
                onClick={create}
                className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {busy ? "Creating…" : "Continue"}
              </button>
            </div>
          </div>
        ) : null}
        {step === 2 && setup ? (
          <div className="mt-6">
            <div className="border-accent/30 bg-accent/5 rounded-xl border p-5">
              <p className="text-xs font-semibold tracking-wider uppercase">
                Recommended
              </p>
              <h3 className="mt-2 font-medium">Launch AWS CloudFormation</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Automatically create the read-only IAM role required by CostOps.
              </p>
              {setup.setup?.cloudformationTemplate ? (
                <button
                  onClick={downloadTemplate}
                  className="bg-accent text-accent-foreground mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                >
                  Download CloudFormation template <Download size={14} />
                </button>
              ) : null}
            </div>
            <details className="border-foreground/10 mt-4 rounded-xl border p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Manual setup
              </summary>
              <p className="text-muted-foreground mt-3 text-sm">
                Use these values in the IAM role trust policy.
              </p>
              {[
                ["Dilanix AWS principal", setup.setup?.principal],
                ["External ID", setup.externalId],
              ]
                .filter((item): item is [string, string] => Boolean(item[1]))
                .map(([label, value]) => (
                  <div key={label} className="mt-3">
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <div className="border-foreground/10 mt-1 flex min-w-0 items-center gap-2 rounded-lg border p-3">
                      <code className="min-w-0 flex-1 overflow-x-auto text-xs">
                        {value}
                      </code>
                      <button
                        onClick={() => copy(value)}
                        aria-label={`Copy ${label}`}
                        className="text-accent p-1"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </details>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(3)}
                className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium"
              >
                I created the role
              </button>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="mt-6">
            <p className="text-muted-foreground text-sm">
              Paste the ARN of the IAM role created in your AWS account.
            </p>
            <label className="mt-5 block text-sm font-medium">
              IAM Role ARN
              <input
                aria-describedby={error ? "role-error" : undefined}
                value={roleArn}
                onChange={(e) => setRoleArn(e.target.value)}
                placeholder="arn:aws:iam::123456789012:role/DilanixCostOpsRole"
                className="border-foreground/15 bg-background focus:border-accent mt-2 h-11 w-full rounded-lg border px-3 font-mono text-xs outline-none"
              />
            </label>
            {error ? (
              <p
                id="role-error"
                role="alert"
                className="mt-3 text-sm text-red-500"
              >
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-muted-foreground text-sm"
              >
                View setup instructions
              </button>
              <button
                disabled={busy || !roleArn}
                onClick={verify}
                className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Verify connection
              </button>
            </div>
          </div>
        ) : null}
        {step === 4 ? (
          <div className="mt-8 py-8 text-center">
            <span className="border-accent/30 border-t-accent inline-block h-9 w-9 animate-spin rounded-full border-2" />
            <p className="mt-4 text-sm font-medium">
              Checking IAM role access and Cost Explorer availability.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              This usually takes a few seconds.
            </p>
          </div>
        ) : null}
        {step === 5 && setup ? (
          <div className="mt-8 text-center">
            <span className="bg-success/10 text-success mx-auto flex h-12 w-12 items-center justify-center rounded-full">
              <Check size={22} />
            </span>
            <p className="mt-4 text-sm">
              {setup.name} is connected. Initial cost synchronization has
              started.
            </p>
            <button
              onClick={onClose}
              className="bg-accent text-accent-foreground mt-6 rounded-lg px-4 py-2 text-sm font-medium"
            >
              Go to CostOps
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
