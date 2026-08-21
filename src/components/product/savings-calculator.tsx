"use client";

import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function SavingsCalculator({
  calendlyUrl = "https://calendly.com",
}: {
  calendlyUrl?: string;
}) {
  const [cloudSpend, setCloudSpend] = useState<number>(35000);
  const [aiSpend, setAiSpend] = useState<number>(12000);

  const totalMonthlySpend = cloudSpend + aiSpend;
  // Estimated cloud savings ~28%, AI savings ~38%
  const estimatedMonthlyCloudSavings = Math.round(cloudSpend * 0.28);
  const estimatedMonthlyAiSavings = Math.round(aiSpend * 0.38);
  const totalMonthlySavings =
    estimatedMonthlyCloudSavings + estimatedMonthlyAiSavings;
  const annualSavings = totalMonthlySavings * 12;
  const paybackDays = Math.max(
    4,
    Math.round(14 - (totalMonthlySpend / 50000) * 5),
  );
  const estimatedRoiMultiple = Math.max(
    8,
    Math.round((annualSavings / 2400) * 10) / 10,
  );

  return (
    <div className="border-foreground/15 from-foreground/[0.04] via-foreground/[0.015] relative overflow-hidden rounded-2xl border bg-gradient-to-b to-transparent p-6 sm:p-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-accent/20 text-accent flex h-6 w-6 items-center justify-center rounded-md">
            <Sparkles size={14} />
          </span>
          <span className="text-accent font-mono text-xs font-medium tracking-wider uppercase">
            Interactive ROI Estimator
          </span>
        </div>
        <h3 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          Estimate your infrastructure savings
        </h3>
        <p className="text-muted-foreground max-w-xl text-sm">
          Based on aggregate benchmark data from engineering teams using Dilanix
          CostOps to detect idle resources, cache repeated LLM prompts, and
          right-size clusters.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Sliders Area */}
        <div className="space-y-6 lg:col-span-7">
          {/* Cloud Spend Slider */}
          <div className="border-foreground/10 bg-background/60 rounded-xl border p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-foreground text-sm font-medium">
                  Monthly Cloud Spend
                </span>
                <p className="text-muted-foreground text-xs">
                  AWS, GCP, Azure, Kubernetes
                </p>
              </div>
              <span className="text-foreground font-mono text-lg font-semibold">
                ${cloudSpend.toLocaleString("en-US")}
                <span className="text-muted-foreground text-xs font-normal">
                  /mo
                </span>
              </span>
            </div>
            <input
              type="range"
              min={2000}
              max={250000}
              step={1000}
              value={cloudSpend}
              onChange={(e) => setCloudSpend(Number(e.target.value))}
              className="accent-accent bg-foreground/10 mt-4 h-2 w-full cursor-pointer rounded-lg"
              aria-label="Monthly Cloud Spend"
            />
            <div className="text-muted-foreground mt-2 flex justify-between font-mono text-[11px]">
              <span>$2,000/mo</span>
              <span>$100,000/mo</span>
              <span>$250,000+/mo</span>
            </div>
          </div>

          {/* AI / LLM Spend Slider */}
          <div className="border-foreground/10 bg-background/60 rounded-xl border p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-foreground text-sm font-medium">
                  Monthly AI & LLM Inference
                </span>
                <p className="text-muted-foreground text-xs">
                  OpenAI, Anthropic, Gemini, Vertex, Pinecone
                </p>
              </div>
              <span className="text-accent font-mono text-lg font-semibold">
                ${aiSpend.toLocaleString("en-US")}
                <span className="text-muted-foreground text-xs font-normal">
                  /mo
                </span>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100000}
              step={500}
              value={aiSpend}
              onChange={(e) => setAiSpend(Number(e.target.value))}
              className="accent-accent bg-foreground/10 mt-4 h-2 w-full cursor-pointer rounded-lg"
              aria-label="Monthly AI & LLM Spend"
            />
            <div className="text-muted-foreground mt-2 flex justify-between font-mono text-[11px]">
              <span>$0/mo</span>
              <span>$50,000/mo</span>
              <span>$100,000+/mo</span>
            </div>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <ShieldCheck size={14} className="text-success shrink-0" />
            <span>
              Zero-agent setup: 100% read-only IAM & API keys. No code changes
              required to calculate live savings.
            </span>
          </div>
        </div>

        {/* Results Card */}
        <div className="border-accent/30 from-accent/[0.08] to-background shadow-accent/5 rounded-2xl border bg-gradient-to-b p-6 shadow-xl lg:col-span-5">
          <p className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            Projected Annual ROI
          </p>

          <div className="mt-3">
            <div className="text-success font-mono text-3xl font-bold tracking-tight sm:text-4xl">
              ${annualSavings.toLocaleString("en-US")}
              <span className="text-muted-foreground font-sans text-xs font-normal">
                {" "}
                / year saved
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              ~${totalMonthlySavings.toLocaleString("en-US")}/month directly
              back into gross margin
            </p>
          </div>

          <div className="border-foreground/10 my-6 grid grid-cols-2 gap-3 border-y py-4">
            <div>
              <p className="text-muted-foreground text-xs">
                Cloud Right-sizing
              </p>
              <p className="text-foreground font-mono text-sm font-semibold">
                ${(estimatedMonthlyCloudSavings * 12).toLocaleString("en-US")}
                /yr
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                AI Token & Cache Ops
              </p>
              <p className="text-accent font-mono text-sm font-semibold">
                ${(estimatedMonthlyAiSavings * 12).toLocaleString("en-US")}/yr
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Payback Period</p>
              <p className="text-foreground font-mono text-sm font-semibold">
                ~{paybackDays} days
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Estimated ROI</p>
              <p className="text-success font-mono text-sm font-semibold">
                {estimatedRoiMultiple}x return
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <Button
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="w-full justify-center py-3 text-sm font-medium"
            >
              Claim your savings walkthrough
              <ArrowRight size={15} />
            </Button>
            <p className="text-muted-foreground text-center text-[11px]">
              Free 14-day discovery scan • No credit card required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
