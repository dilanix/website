"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { CoreAWSConnectionSetup } from "@/lib/core/api";

/**
 * Shared AWS CloudFormation setup block: disclaimer, launch button, and the
 * generated External ID with a copy action. Used by both the AWS onboarding
 * wizard and the connection Manage view so the two never drift apart.
 */
export function AwsSetupPanel({
  awsSetup,
  footer,
}: {
  awsSetup: CoreAWSConnectionSetup;
  footer?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function copyExternalId() {
    if (!awsSetup.external_id) return;
    await navigator.clipboard.writeText(awsSetup.external_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-foreground/10 bg-foreground/[0.015] rounded-xl border p-5">
      <p className="text-muted-foreground text-sm leading-6">
        Launch the CloudFormation stack to grant Dilanix a read-only
        cross-account IAM role. No AWS access keys are ever requested.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {awsSetup.cloudformation_url ? (
          <a
            href={awsSetup.cloudformation_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-accent-foreground inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
          >
            <ExternalLink size={15} />
            Launch in AWS CloudFormation
          </a>
        ) : (
          <p className="text-muted-foreground text-sm">
            CloudFormation launch isn&apos;t configured on this deployment yet.
          </p>
        )}
      </div>
      {awsSetup.external_id ? (
        <div className="mt-4">
          <span className="text-muted-foreground mb-2 block text-xs font-medium">
            External ID — paste this into the console&apos;s
            &quot;ExternalId&quot; field
          </span>
          <div className="border-foreground/15 flex items-center gap-2 rounded-lg border p-3">
            <code className="min-w-0 flex-1 overflow-hidden text-sm text-ellipsis">
              {awsSetup.external_id}
            </code>
            <button
              onClick={copyExternalId}
              className="text-accent inline-flex shrink-0 items-center gap-1 text-xs"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}
      {footer ? (
        <div className="border-foreground/10 mt-5 border-t pt-5">{footer}</div>
      ) : null}
    </div>
  );
}
