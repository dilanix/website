"use client";

import {
  Cloud,
  Bot,
  Zap,
  ShieldCheck,
  GitPullRequest,
  PieChart,
} from "lucide-react";

interface FeatureCard {
  icon: typeof Cloud;
  title: string;
  category: string;
  description: string;
  highlight: string;
}

const features: FeatureCard[] = [
  {
    icon: Cloud,
    category: "Multi-Cloud Intelligence",
    title: "Unified Cloud & Cluster Visibility",
    description:
      "Normalize disparate billing across AWS, GCP, Azure, Kubernetes, and specialized AI GPU clouds into a single coherent dashboard with minute-level granularity.",
    highlight: "Cross-cloud currency & timezone normalization",
  },
  {
    icon: Bot,
    category: "AI & LLM FinOps",
    title: "Token-Level Model Spend Attribution",
    description:
      "Track prompt tokens, completion tokens, cached context discount rates, and per-query costs across OpenAI, Anthropic, Gemini, and custom fine-tuned endpoints.",
    highlight: "Identify un-cached prompts & inefficient models",
  },
  {
    icon: Zap,
    category: "Anomaly Detection",
    title: "Real-Time Anomaly Guardrails",
    description:
      "Stop infinite loops, leaky staging environments, and runaway scrapers before they turn into 5-figure month-end surprises. Real-time alerts to Slack and webhooks.",
    highlight: "< 60s detection with ML baseline modeling",
  },
  {
    icon: GitPullRequest,
    category: "Automated Remediation",
    title: "Terraform & IaC Ready Pull Requests",
    description:
      "Don't just view charts—fix waste with 1 click. CostOps generates safe, tested Terraform diffs for right-sizing EC2 instances, cleaning idle RDS, and pruning EBS.",
    highlight: "Zero downtime impact verification",
  },
  {
    icon: PieChart,
    category: "Unit Economics",
    title: "Cost Per Tenant & Active User",
    description:
      "Correlate infrastructure spend directly with business metrics. Know the exact gross margin per customer tier, product feature, or API endpoint in real time.",
    highlight: "True customer-level gross margin clarity",
  },
  {
    icon: ShieldCheck,
    category: "Enterprise Security",
    title: "Zero-Agent, 100% Read-Only",
    description:
      "No intrusive binaries to install on production servers. Connect in under 2 minutes using standard read-only IAM roles. Prompt payloads are never ingested.",
    highlight: "SOC 2 Type II compliant standards",
  },
];

export function ProductFeaturesGrid() {
  return (
    <div className="space-y-12">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-accent font-mono text-xs font-medium tracking-widest uppercase">
          Comprehensive Capabilities
        </span>
        <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to master infrastructure economics
        </h2>
        <p className="text-muted-foreground mt-4 text-base">
          Built specifically for modern engineering teams running complex
          distributed architectures and LLM pipelines.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className="group border-foreground/10 bg-card-strong hover:border-foreground/20 relative rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/5"
            >
              <div className="flex items-center justify-between">
                <span className="bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
                  <Icon size={20} />
                </span>
                <span className="text-muted-foreground font-mono text-[11px] font-medium uppercase">
                  {feature.category}
                </span>
              </div>

              <h3 className="text-foreground mt-5 text-lg font-semibold tracking-tight">
                {feature.title}
              </h3>

              <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed">
                {feature.description}
              </p>

              <div className="border-foreground/5 text-foreground/80 mt-6 flex items-center gap-1.5 border-t pt-4 text-xs font-medium">
                <span className="bg-accent h-1.5 w-1.5 rounded-full" />
                {feature.highlight}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
