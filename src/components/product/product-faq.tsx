"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: "How does CostOps connect to our cloud accounts?",
    a: "CostOps connects via standard cross-account IAM roles with read-only permissions (AWS Cost Explorer, CUR bucket read, and CloudWatch metrics). For GCP, we use a read-only Service Account linked to Cloud Billing Export. For OpenAI and Anthropic, you provide a restricted read-only usage API key. There are zero daemon agents to install or maintain on your servers.",
  },
  {
    q: "Will CostOps ever see or store our AI prompt text or training data?",
    a: "Never. CostOps only monitors billing metadata, token usage metrics (prompt tokens, completion tokens, cached context hits), model IDs, and execution latency. We explicitly never ingest, inspect, or retain the actual string content of prompts or completions.",
  },
  {
    q: "How long does setup take?",
    a: "Initial setup typically takes less than 2 minutes. Once the IAM role or API keys are linked, historical cost data begins populating within 10–15 minutes, and our ML engine generates your first waste reduction recommendations within the first hour.",
  },
  {
    q: "How does the automated Terraform / IaC PR generation work?",
    a: "When CostOps identifies an optimization (e.g. downscaling an overprovisioned ECS task or removing an unattached EBS volume), you can click 'Generate Pull Request'. CostOps uses a connected GitHub App with repository write permissions to open a clean, formatted branch with exact code diffs for your engineering team to review and merge at your own pace.",
  },
  {
    q: "Can we track unit economics per customer tenant or environment?",
    a: "Yes. By tagging requests at your API gateway with custom headers (such as `x-tenant-id` or `x-environment`), CostOps correlates compute and model consumption to specific customers, teams, or microservices, giving you real-time gross margin and cost-per-user visibility.",
  },
  {
    q: "What is your pricing model?",
    a: "Unlike legacy FinOps vendors that charge an expensive 3–5% tax on your total cloud bill, Dilanix CostOps offers transparent, flat monthly pricing based on connected accounts. The platform frequently pays for itself within the first 10 days of deployment.",
  },
];

export function ProductFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="text-center">
        <span className="text-accent font-mono text-xs font-medium tracking-widest uppercase">
          Got Questions?
        </span>
        <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground mt-3 text-sm">
          Everything you need to know about integrating and scaling with Dilanix
          CostOps.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={cn(
                "overflow-hidden rounded-2xl border transition-colors duration-200",
                isOpen
                  ? "border-foreground/20 bg-card-strong shadow-sm"
                  : "border-foreground/10 bg-background/50 hover:border-foreground/15",
              )}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                className="text-foreground flex w-full cursor-pointer items-center justify-between p-5 text-left text-sm font-medium transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-foreground/90 pr-4 font-semibold">
                  {faq.q}
                </span>
                <span
                  className={cn(
                    "bg-foreground/5 text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200",
                    isOpen && "bg-accent/15 text-accent rotate-180",
                  )}
                >
                  <ChevronDown size={16} />
                </span>
              </button>

              {isOpen && (
                <div className="text-muted-foreground border-foreground/5 border-t px-5 pt-1 pb-5 text-sm leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
