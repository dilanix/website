"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import type {
  CoreAWSConnectionSetup,
  CoreIntegrationConnection,
} from "@/lib/core/api";
import {
  getConnectionAwsSetupAction,
  verifyAwsConnectionAction,
} from "@/app/dashboard/integrations/actions";
import { StatusBadge } from "../primitives";
import { AwsSetupPanel } from "./aws-setup-panel";

/**
 * AWS-specific onboarding wizard: aws_setup -> verify -> complete.
 *
 * Verification is a real backend STS AssumeRole + GetCallerIdentity check
 * (`verifyAwsConnectionAction` -> `POST .../verify-aws`) — nothing here
 * fakes it.
 */

type WizardState =
  | {
      step: "aws_setup";
      setup: CoreAWSConnectionSetup | null;
      error: string | null;
    }
  | { step: "verify"; setup: CoreAWSConnectionSetup; error: string | null }
  | { step: "complete"; setup: CoreAWSConnectionSetup };

function ModalShell({
  titleId,
  onClose,
  children,
}: {
  titleId: string;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background/75 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-background border-foreground/15 w-full max-w-lg rounded-xl border p-6 shadow-2xl"
      >
        {onClose ? (
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted-foreground float-right p-1"
          >
            <X size={18} />
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function AwsOnboardingWizard({
  connection: initialConnection,
  integrationName,
  onClose,
  onConnectionChange,
}: {
  connection: CoreIntegrationConnection;
  integrationName: string;
  onClose: () => void;
  onConnectionChange: (connection: CoreIntegrationConnection) => void;
}) {
  const [connection, setConnection] = useState(initialConnection);
  const [wizardState, setWizardState] = useState<WizardState>({
    step: "aws_setup",
    setup: null,
    error: null,
  });
  const [pending, startTransition] = useTransition();
  const loaded = useRef(false);

  function loadSetup() {
    startTransition(async () => {
      setWizardState({ step: "aws_setup", setup: null, error: null });
      const result = await getConnectionAwsSetupAction(connection.id);
      setWizardState({
        step: "aws_setup",
        setup: result.data ?? null,
        error: result.error ?? null,
      });
    });
  }

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    loadSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function verify(setup: CoreAWSConnectionSetup, awsAccountId: string) {
    startTransition(async () => {
      const result = await verifyAwsConnectionAction(
        connection.id,
        awsAccountId,
      );
      if (result.error) {
        setWizardState({ step: "verify", setup, error: result.error });
        return;
      }
      const updated = result.data!.connection;
      setConnection(updated);
      onConnectionChange(updated);
      setWizardState({ step: "complete", setup });
    });
  }

  if (wizardState.step === "aws_setup") {
    return (
      <ModalShell titleId="aws-setup-title" onClose={onClose}>
        <h2 id="aws-setup-title" className="text-lg font-semibold">
          AWS setup
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Connect Dilanix to {integrationName} — grant a read-only cross-account
          role for {connection.name}.
        </p>
        <div className="mt-5">
          {wizardState.setup ? (
            <AwsSetupPanel awsSetup={wizardState.setup} />
          ) : wizardState.error ? (
            <div className="border-foreground/10 rounded-xl border p-5">
              <p className="text-sm text-red-500">{wizardState.error}</p>
              <button
                onClick={loadSetup}
                disabled={pending}
                className="border-foreground/15 hover:bg-foreground/5 mt-4 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10">
              <Loader2
                className="text-muted-foreground animate-spin"
                size={22}
              />
            </div>
          )}
        </div>
        {wizardState.setup ? (
          <button
            onClick={() =>
              setWizardState({
                step: "verify",
                setup: wizardState.setup!,
                error: null,
              })
            }
            className="bg-accent text-accent-foreground mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-medium"
          >
            Continue
          </button>
        ) : null}
      </ModalShell>
    );
  }

  if (wizardState.step === "verify") {
    return (
      <ModalShell titleId="verify-title" onClose={onClose}>
        <h2 id="verify-title" className="text-lg font-semibold">
          Verify AWS connection
        </h2>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Once the CloudFormation stack has finished creating, enter the AWS
          account ID it was created in. Dilanix will assume the role and confirm
          access before connecting.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const awsAccountId = String(
              data.get("aws_account_id") ?? "",
            ).trim();
            verify(wizardState.setup, awsAccountId);
          }}
          className="mt-6 space-y-4"
        >
          <label className="block text-sm">
            <span className="mb-2 block font-medium">AWS account ID</span>
            <input
              name="aws_account_id"
              required
              pattern="\d{12}"
              title="12-digit AWS account ID"
              placeholder="123456789012"
              className="border-foreground/15 bg-background focus:border-accent h-10 w-full rounded-lg border px-3 font-mono outline-none"
            />
          </label>
          {wizardState.error ? (
            <p role="alert" className="text-sm text-red-500">
              {wizardState.error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <button
              disabled={pending}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "Verifying…" : "Verify connection"}
            </button>
            <button
              type="button"
              onClick={() =>
                setWizardState({
                  step: "aws_setup",
                  setup: wizardState.setup,
                  error: null,
                })
              }
              disabled={pending}
              className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-4 py-2.5 text-sm disabled:opacity-50"
            >
              Back to AWS setup
            </button>
          </div>
        </form>
      </ModalShell>
    );
  }

  return (
    <ModalShell titleId="complete-title" onClose={onClose}>
      <h2 id="complete-title" className="text-lg font-semibold">
        AWS connected
      </h2>
      <div className="border-foreground/10 mt-4 rounded-xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{connection.name}</span>
          <StatusBadge status="success">{connection.status}</StatusBadge>
        </div>
      </div>
      <button
        onClick={onClose}
        className="bg-accent text-accent-foreground mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-medium"
      >
        Close
      </button>
    </ModalShell>
  );
}
