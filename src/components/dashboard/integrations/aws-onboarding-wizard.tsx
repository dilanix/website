"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import type {
  CoreAWSConnectionSetup,
  CoreConnectionSyncRun,
  CoreIntegrationConnection,
} from "@/lib/core/api";
import {
  getConnectionAwsSetupAction,
  markConnectionConnectedAction,
  triggerConnectionSyncAction,
} from "@/app/dashboard/integrations/actions";
import { StatusBadge } from "../primitives";
import { AwsSetupPanel } from "./aws-setup-panel";

/**
 * AWS-specific onboarding wizard: aws_setup -> verify -> starting_sync -> complete.
 *
 * Reuses the existing connection APIs end to end (setup info, the manual
 * "verify" confirmation, and the sync trigger) — no verification or sync
 * logic is duplicated or faked here. Provider-specific: a future GCP/Azure
 * wizard would live next to this one and plug into the same dispatch point
 * in `integrations-client.tsx`, not into this component.
 */

type WizardState =
  | {
      step: "aws_setup";
      setup: CoreAWSConnectionSetup | null;
      error: string | null;
    }
  | { step: "verify"; setup: CoreAWSConnectionSetup; error: string | null }
  | { step: "starting_sync"; setup: CoreAWSConnectionSetup }
  | {
      step: "complete";
      setup: CoreAWSConnectionSetup;
      syncRun: CoreConnectionSyncRun | null;
      syncError: string | null;
    };

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

  function verify(setup: CoreAWSConnectionSetup) {
    startTransition(async () => {
      const verifyResult = await markConnectionConnectedAction(connection.id);
      if (verifyResult.error) {
        setWizardState({ step: "verify", setup, error: verifyResult.error });
        return;
      }
      const updated = verifyResult.data!;
      setConnection(updated);
      onConnectionChange(updated);
      setWizardState({ step: "starting_sync", setup });

      const syncResult = await triggerConnectionSyncAction(updated.id);
      setWizardState({
        step: "complete",
        setup,
        syncRun: syncResult.data ?? null,
        syncError: syncResult.error ?? null,
      });
    });
  }

  function retrySync(setup: CoreAWSConnectionSetup) {
    startTransition(async () => {
      const syncResult = await triggerConnectionSyncAction(connection.id);
      setWizardState({
        step: "complete",
        setup,
        syncRun: syncResult.data ?? null,
        syncError: syncResult.error ?? null,
      });
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
          Once the CloudFormation stack has finished creating in AWS, click
          Verify connection below. Dilanix doesn&apos;t check AWS automatically
          yet — this marks the connection as connected based on your
          confirmation.
        </p>
        {wizardState.error ? (
          <p role="alert" className="mt-4 text-sm text-red-500">
            {wizardState.error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => verify(wizardState.setup)}
            disabled={pending}
            className="bg-accent text-accent-foreground rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {pending ? "Verifying…" : "Verify connection"}
          </button>
          <button
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
      </ModalShell>
    );
  }

  if (wizardState.step === "starting_sync") {
    return (
      <ModalShell titleId="starting-sync-title">
        <h2 id="starting-sync-title" className="text-lg font-semibold">
          Starting first sync…
        </h2>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="text-muted-foreground animate-spin" size={22} />
        </div>
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
        <div className="border-foreground/10 mt-4 border-t pt-4">
          <span className="text-muted-foreground text-xs font-medium">
            Initial sync
          </span>
          {wizardState.syncRun ? (
            <p className="mt-1 text-sm">
              Status:{" "}
              <span className="font-medium">{wizardState.syncRun.status}</span>.
              It will continue running in the background.
            </p>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-red-500">
                {wizardState.syncError ??
                  "The initial sync couldn't be started."}
              </p>
              <button
                onClick={() => retrySync(wizardState.setup)}
                disabled={pending}
                className="border-foreground/15 hover:bg-foreground/5 mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"
              >
                <RefreshCw size={13} />
                {pending ? "Retrying…" : "Retry sync"}
              </button>
            </div>
          )}
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
