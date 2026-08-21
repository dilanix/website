"use client";

import { ShieldCheck, Lock, EyeOff, FileCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductSecuritySection() {
  const securityPillars = [
    {
      icon: EyeOff,
      title: "Zero Prompt & Customer Data Ingestion",
      description:
        "CostOps never reads, processes, or logs the content of your LLM prompts or completions. We only ingest metadata: token counts, model identifiers, timestamps, and cost cents.",
    },
    {
      icon: ShieldCheck,
      title: "100% Read-Only Least-Privilege IAM",
      description:
        "Integration requires only standard read-only AWS Cost Explorer, GCP Billing, and Azure Cost Management roles. CostOps has zero write or delete permissions over your infrastructure.",
    },
    {
      icon: Lock,
      title: "AES-256 & TLS 1.3 In-Flight Encryption",
      description:
        "All telemetry in transit is encrypted using modern TLS 1.3 ciphers, and all stored analytical aggregates are encrypted at rest using AES-256 with KMS envelope encryption.",
    },
    {
      icon: FileCheck,
      title: "SOC 2 Type II Alignment & Audit Logging",
      description:
        "Comprehensive immutable audit logging for all API and dashboard access. Built to satisfy rigorous enterprise compliance and vendor risk assessments.",
    },
  ];

  return (
    <div className="border-foreground/15 from-foreground/[0.04] via-foreground/[0.015] rounded-3xl border bg-gradient-to-b to-transparent p-6 sm:p-12">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="bg-success/20 text-success flex h-6 w-6 items-center justify-center rounded-md">
            <ShieldCheck size={14} />
          </span>
          <span className="text-success font-mono text-xs font-medium tracking-wider uppercase">
            Enterprise Grade Security
          </span>
        </div>
        <h2 className="text-foreground mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Built for zero-trust security and strictest compliance
        </h2>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
          We understand that cloud billing and AI telemetry are sensitive. Our
          architecture is designed so you never have to grant intrusive
          permissions or expose application payloads.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {securityPillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="border-foreground/10 bg-background/80 rounded-2xl border p-5 backdrop-blur-sm sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="bg-foreground/5 text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Icon size={20} />
                </span>
                <h3 className="text-foreground text-base font-semibold">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-muted-foreground mt-3 text-xs leading-relaxed sm:text-sm">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-foreground/10 mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
        <div className="text-muted-foreground flex flex-wrap items-center gap-4 font-mono text-xs">
          <span className="flex items-center gap-1">
            <Check size={14} className="text-success" />
            No Agent Binaries
          </span>
          <span className="flex items-center gap-1">
            <Check size={14} className="text-success" />
            Zero Customer PII
          </span>
          <span className="flex items-center gap-1">
            <Check size={14} className="text-success" />
            Custom SAML SSO
          </span>
        </div>

        <Button
          href="/contact"
          variant="secondary"
          className="px-4 py-2 text-xs"
        >
          Request Security Whitepaper →
        </Button>
      </div>
    </div>
  );
}
