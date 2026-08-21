"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Terminal,
  ShieldCheck,
  TrendingDown,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Server,
  Layers,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  CostOpsRecommendation,
  RecommendationCategory,
  RecommendationStatus,
} from "../types";

interface RecommendationCardProps {
  recommendation: CostOpsRecommendation;
  onStatusChange: (
    id: string,
    status: RecommendationStatus,
    reason?: string,
  ) => Promise<void>;
  isUpdating?: boolean;
}

const CATEGORY_META: Record<
  RecommendationCategory,
  { label: string; icon: typeof Server; tone: "neutral" | "accent" | "success" }
> = {
  rightsizing: {
    label: "Rightsizing",
    icon: TrendingDown,
    tone: "accent",
  },
  idle_cleanup: {
    label: "Idle Cleanup",
    icon: Zap,
    tone: "neutral",
  },
  storage_optimization: {
    label: "Storage Optimization",
    icon: Layers,
    tone: "neutral",
  },
  modernization: {
    label: "Modernization",
    icon: Sparkles,
    tone: "accent",
  },
  architectural: {
    label: "Architectural",
    icon: Server,
    tone: "neutral",
  },
};

export function RecommendationCard({
  recommendation,
  onStatusChange,
  isUpdating = false,
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedTf, setCopiedTf] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissReason, setDismissReason] = useState("");

  const catMeta = CATEGORY_META[recommendation.category] ?? {
    label: recommendation.category,
    icon: Server,
    tone: "neutral",
  };
  const CategoryIcon = catMeta.icon;

  const currentType =
    (recommendation.current_configuration?.instance_type as string) ??
    (recommendation.current_configuration?.resource_class as string) ??
    "Current Specs";

  const targetType =
    (recommendation.recommended_configuration?.instance_type as string) ??
    (recommendation.recommended_configuration?.action as string) ??
    "Optimized Specs";

  const currentCost = recommendation.current_configuration
    ?.estimated_monthly_cost_usd as number | undefined;
  const currentCpu = recommendation.current_configuration
    ?.baseline_average_cpu_percent as number | undefined;
  const currentVcpus = recommendation.current_configuration?.vcpus as
    number | undefined;
  const currentRam = recommendation.current_configuration?.memory_gib as
    number | undefined;

  const targetCost = recommendation.recommended_configuration
    ?.estimated_monthly_cost_usd as number | undefined;
  const targetVcpus = recommendation.recommended_configuration?.vcpus as
    number | undefined;
  const targetRam = recommendation.recommended_configuration?.memory_gib as
    number | undefined;
  const savingsPct = (recommendation.estimated_savings_percentage ??
    recommendation.recommended_configuration?.savings_percentage) as
    number | undefined;

  const cliCommand = recommendation.action_plan?.cli_command;
  const terraformCode = recommendation.action_plan?.terraform_suggestion;
  const safeSteps = recommendation.ai_analysis?.safe_execution_steps;
  const reasoning =
    recommendation.ai_analysis?.reasoning ?? recommendation.description;

  const handleCopyCli = async () => {
    if (!cliCommand) return;
    await navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleCopyTf = async () => {
    if (!terraformCode) return;
    await navigator.clipboard.writeText(terraformCode);
    setCopiedTf(true);
    setTimeout(() => setCopiedTf(false), 2000);
  };

  const handleApply = async () => {
    await onStatusChange(recommendation.id, "applied");
  };

  const handleDismissSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onStatusChange(recommendation.id, "dismissed", dismissReason);
    setIsDismissing(false);
  };

  const handleRestore = async () => {
    await onStatusChange(recommendation.id, "active");
  };

  return (
    <div
      className={cn(
        "group relative rounded-2xl border transition-all duration-200",
        recommendation.status === "active"
          ? "border-foreground/10 bg-card/60 hover:border-accent/40 shadow-xs"
          : recommendation.status === "applied"
            ? "border-emerald-500/30 bg-emerald-950/10"
            : "border-foreground/5 bg-card/30 opacity-75",
      )}
    >
      <div className="p-5 md:p-6">
        {/* Header Row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={catMeta.tone}
              className="flex items-center gap-1 text-[11px] font-medium"
            >
              <CategoryIcon size={12} />
              <span>{catMeta.label}</span>
            </Badge>

            <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
              {recommendation.provider}
            </span>

            <div className="bg-foreground/5 text-foreground/70 flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>{recommendation.confidence_score}% Confidence</span>
            </div>

            {recommendation.risk_level === "low" && (
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Low Risk
              </span>
            )}
          </div>

          {/* Savings Highlight */}
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Est. Savings:
            </span>
            <span className="font-mono text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              +$
              {recommendation.estimated_monthly_savings_usd.toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                },
              )}
            </span>
            <span className="text-muted-foreground text-xs">/ mo</span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="mt-3">
          <h3 className="text-foreground text-base font-semibold tracking-tight">
            {recommendation.title}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            {recommendation.description}
          </p>
        </div>

        {/* Configuration Change Visualizer */}
        <div className="border-foreground/10 bg-background/50 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-xs">
          <div className="flex min-w-[130px] flex-col">
            <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              Current / Baseline
            </span>
            <span className="text-foreground mt-0.5 font-mono text-sm font-semibold">
              {currentType}
            </span>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
              {currentCost !== undefined && <span>~${currentCost}/mo</span>}
              {currentVcpus && currentRam ? (
                <span>
                  • {currentVcpus} vCPU, {currentRam} GB
                </span>
              ) : null}
              {currentCpu !== undefined ? (
                <span>• {currentCpu}% CPU</span>
              ) : null}
            </div>
          </div>

          <div className="text-muted-foreground hidden items-center px-2 sm:flex">
            <ArrowRight size={16} className="text-accent" />
          </div>

          <div className="flex min-w-[130px] flex-col">
            <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              Target Configuration
            </span>
            <span className="mt-0.5 font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {targetType}
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {targetCost !== undefined && <span>~${targetCost}/mo</span>}
              {targetVcpus && targetRam ? (
                <span>
                  • {targetVcpus} vCPU, {targetRam} GB
                </span>
              ) : null}
              {savingsPct ? <span>• Save {savingsPct}%</span> : null}
            </div>
          </div>

          {recommendation.applied_at && (
            <div className="border-foreground/10 flex flex-col text-[11px] sm:border-l sm:pl-3.5">
              <span className="text-muted-foreground text-[10px] font-medium uppercase">
                Applied Date
              </span>
              <span className="text-foreground mt-0.5 font-medium">
                {new Date(recommendation.applied_at).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons & Status Row */}
        <div className="border-foreground/5 mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-foreground hover:bg-foreground/5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
            >
              <Terminal size={13} className="text-muted-foreground" />
              <span>Action Plan & Guidance</span>
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {recommendation.status === "active" && (
              <>
                {!isDismissing ? (
                  <>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => setIsDismissing(true)}
                      className="text-muted-foreground hover:border-foreground/10 hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <X size={13} />
                      <span>Dismiss</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={handleApply}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-emerald-500 disabled:opacity-50"
                    >
                      <Check size={13} />
                      <span>Mark as Applied</span>
                    </button>
                  </>
                ) : (
                  <form
                    onSubmit={handleDismissSubmit}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Reason for dismissal (optional)..."
                      value={dismissReason}
                      onChange={(e) => setDismissReason(e.target.value)}
                      className="border-foreground/15 bg-background text-foreground placeholder:text-muted-foreground focus:border-accent rounded-lg border px-2.5 py-1 text-xs focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="bg-foreground/10 text-foreground hover:bg-foreground/20 cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDismissing(false)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </>
            )}

            {recommendation.status === "applied" && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check size={13} />
                  <span>Applied</span>
                </span>
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={isUpdating}
                  className="border-foreground/10 text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                  title="Reopen recommendation"
                >
                  <RotateCcw size={12} />
                  <span>Reopen</span>
                </button>
              </div>
            )}

            {recommendation.status === "dismissed" && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground bg-foreground/5 flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium">
                  <X size={13} />
                  <span>Dismissed</span>
                </span>
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={isUpdating}
                  className="border-foreground/10 text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-xs"
                >
                  <RotateCcw size={12} />
                  <span>Restore</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Guided Action Plan */}
        {isExpanded && (
          <div className="border-foreground/10 bg-background/80 mt-4 space-y-4 rounded-xl border p-4 text-xs">
            {/* Reasoning */}
            <div>
              <h4 className="text-foreground flex items-center gap-1.5 font-semibold">
                <Sparkles size={13} className="text-accent" />
                <span>Analytical Context & Reasoning</span>
              </h4>
              <p className="text-muted-foreground mt-1 leading-relaxed">
                {reasoning}
              </p>
            </div>

            {/* Safe Execution Steps */}
            {safeSteps && safeSteps.length > 0 && (
              <div>
                <h5 className="text-foreground font-semibold">
                  Safe Execution Steps
                </h5>
                <ol className="text-muted-foreground mt-1.5 list-decimal space-y-1 pl-4">
                  {safeSteps.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* CLI Command */}
            {cliCommand && (
              <div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-foreground/80 font-mono text-[11px] font-semibold">
                    AWS CLI Command
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCli}
                    className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-[11px]"
                  >
                    {copiedCli ? (
                      <>
                        <Check size={12} className="text-emerald-500" />
                        <span className="font-medium text-emerald-500">
                          Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Command</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg bg-zinc-950 p-2.5 font-mono text-[11px] text-zinc-100 dark:bg-black/80">
                  <code>{cliCommand}</code>
                </div>
              </div>
            )}

            {/* Terraform Suggestion */}
            {terraformCode && (
              <div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-foreground/80 font-mono text-[11px] font-semibold">
                    Terraform / IaC
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTf}
                    className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-[11px]"
                  >
                    {copiedTf ? (
                      <>
                        <Check size={12} className="text-emerald-500" />
                        <span className="font-medium text-emerald-500">
                          Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg bg-zinc-950 p-2.5 font-mono text-[11px] text-zinc-100 dark:bg-black/80">
                  <code>{terraformCode}</code>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
