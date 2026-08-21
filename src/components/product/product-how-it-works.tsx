"use client";

import { KeyRound, Cpu, TrendingDown } from "lucide-react";

export function ProductHowItWorks() {
  const steps = [
    {
      number: "01",
      icon: KeyRound,
      title: "Connect in 2 minutes via Read-Only IAM",
      description:
        "No daemon agents or sidecars in production clusters. Simply link your AWS Cross-Account Role, GCP Service Account, or OpenAI read-only API key.",
      badge: "Zero-Agent Setup",
      codeSnippet: `# AWS Cross-Account Trust Policy
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::882910381920:role/dilanix-costops-reader" },
    "Action": "sts:AssumeRole",
    "Condition": { "StringEquals": { "sts:ExternalId": "dil_ext_7f19a..." } }
  }]
}`,
    },
    {
      number: "02",
      icon: Cpu,
      title: "AI Engine maps spend & attributes unit cost",
      description:
        "CostOps ingests CUR (Cost and Usage Report), billing exports, and token event streams, correlating compute & LLM usage directly to environments and customer tenants.",
      badge: "Continuous Ingestion",
      codeSnippet: `// CostOps Normalized Telemetry Stream
{
  "provider": "openai",
  "model": "gpt-4o",
  "tenant_id": "org_acme_corp",
  "prompt_tokens_cached": 4200,
  "completion_tokens": 310,
  "cost_usd": 0.00384,
  "anomaly_score": 0.02
}`,
    },
    {
      number: "03",
      icon: TrendingDown,
      title: "Apply 1-click right-sizing & stop cost drift",
      description:
        "Receive automated Terraform pull requests, real-time Slack anomaly alerts, and executive executive summaries. Save 25–35% on average within 14 days.",
      badge: "Actionable Savings",
      codeSnippet: `✓ Slack alert: Staging cluster scale-down executed
✓ Terraform PR #142 merged: -$640/mo ECS right-size
✓ Monthly savings achieved: $4,310 / month
✓ Gross margin improvement: +4.8%`,
    },
  ];

  return (
    <div className="space-y-12">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-accent font-mono text-xs font-medium tracking-widest uppercase">
          Simple 3-Step Setup
        </span>
        <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          From zero visibility to actionable savings in minutes
        </h2>
        <p className="text-muted-foreground mt-4 text-base">
          No complex SDK rewrites or production cluster agents. Start seeing
          waste on day one.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="border-foreground/10 bg-card-strong flex flex-col justify-between rounded-2xl border p-6 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-accent/80 font-mono text-2xl font-bold">
                    {step.number}
                  </span>
                  <span className="bg-foreground/5 text-muted-foreground rounded-full px-2.5 py-1 font-mono text-xs">
                    {step.badge}
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <span className="bg-foreground/5 text-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon size={18} />
                  </span>
                  <h3 className="text-foreground text-base leading-snug font-semibold">
                    {step.title}
                  </h3>
                </div>

                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="bg-foreground/[0.03] border-foreground/5 mt-6 overflow-x-auto rounded-lg border p-3">
                <pre className="text-foreground/80 font-mono text-[11px] leading-relaxed">
                  <code>{step.codeSnippet}</code>
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
