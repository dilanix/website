"use client";

import { useMemo, useState } from "react";
import {
  Download,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import {
  evaluateRecommendationsAction,
  updateRecommendationStatusAction,
} from "@/app/dashboard/costops/actions";
import { exportRecommendationsCsv } from "@/features/costops/recommendations/export-recommendations";

import { RecommendationCard } from "./recommendation-card";

import type {
  CostOpsRecommendation,
  CostOpsRecommendationSummary,
  RecommendationCategory,
  RecommendationStatus,
} from "../types";

interface RecommendationsViewProps {
  initialRecommendations: CostOpsRecommendation[];
  initialSummary: CostOpsRecommendationSummary;
}

export function RecommendationsView({
  initialRecommendations,
  initialSummary,
}: RecommendationsViewProps) {
  const [recommendations, setRecommendations] = useState<
    CostOpsRecommendation[]
  >(initialRecommendations);

  const [summary, setSummary] =
    useState<CostOpsRecommendationSummary>(initialSummary);

  const [activeTab, setActiveTab] = useState<
    RecommendationStatus | "all"
  >("active");

  const [selectedCategory, setSelectedCategory] = useState<
    RecommendationCategory | "all"
  >("all");

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (
    id: string,
    status: RecommendationStatus,
    reason?: string,
  ) => {
    setUpdatingId(id);

    try {
      const result = await updateRecommendationStatusAction(
        id,
        status,
        reason,
      );

      if (!result.data) {
        return;
      }

      const updated = result.data;

      setRecommendations((prev) =>
        prev.map((item) =>
          item.id === id ? updated : item,
        ),
      );

      // Recompute local summary
      setSummary((prev) => {
        const diffSavings =
          status === "applied" || status === "dismissed"
            ? -updated.estimated_monthly_savings_usd
            : updated.estimated_monthly_savings_usd;

        return {
          ...prev,

          total_potential_monthly_savings_usd: Math.max(
            0,
            prev.total_potential_monthly_savings_usd +
              (status === "active"
                ? updated.estimated_monthly_savings_usd
                : diffSavings),
          ),

          active_recommendations_count:
            status === "active"
              ? prev.active_recommendations_count + 1
              : Math.max(
                  0,
                  prev.active_recommendations_count - 1,
                ),

          applied_recommendations_count:
            status === "applied"
              ? prev.applied_recommendations_count + 1
              : prev.applied_recommendations_count,

          dismissed_recommendations_count:
            status === "dismissed"
              ? prev.dismissed_recommendations_count + 1
              : prev.dismissed_recommendations_count,
        };
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);

    try {
      await evaluateRecommendationsAction();
      window.location.reload();
    } catch {
      setIsEvaluating(false);
    }
  };

  // Current visible recommendations after status/category filters.
  // CSV export must use this array.
  const filtered = useMemo(() => {
    return recommendations.filter((item) => {
      const matchesStatus =
        activeTab === "all"
          ? true
          : item.status === activeTab;

      const matchesCategory =
        selectedCategory === "all"
          ? true
          : item.category === selectedCategory;

      return matchesStatus && matchesCategory;
    });
  }, [
    recommendations,
    activeTab,
    selectedCategory,
  ]);

  const activeCount = recommendations.filter(
    (recommendation) =>
      recommendation.status === "active",
  ).length;

  const appliedCount = recommendations.filter(
    (recommendation) =>
      recommendation.status === "applied",
  ).length;

  const dismissedCount = recommendations.filter(
    (recommendation) =>
      recommendation.status === "dismissed",
  ).length;

  return (
    <div className="space-y-8">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Potential Monthly Savings"
          value={`+$${summary.total_potential_monthly_savings_usd.toLocaleString(
            "en-US",
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            },
          )}`}
          tone="success"
        />

        <StatCard
          label="Active Opportunities"
          value={activeCount.toString()}
        />

        <StatCard
          label="Applied Actions"
          value={appliedCount.toString()}
          tone="success"
        />

        <StatCard
          label="Average Confidence"
          value="90%"
        />
      </div>

      {/* Control Bar & Filter Tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Status Tabs */}
        <div className="border-foreground/10 bg-background/60 flex items-center gap-1 rounded-xl border p-1">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "active"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("applied")}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "applied"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Applied ({appliedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("dismissed")}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "dismissed"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Dismissed ({dismissedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              activeTab === "all"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({recommendations.length})
          </button>
        </div>

        {/* Category, Export & Evaluation Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal
              size={14}
              className="text-muted-foreground"
            />

            <select
              aria-label="Filter recommendations by category"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(
                  event.target.value as
                    | RecommendationCategory
                    | "all",
                )
              }
              className="border-foreground/15 bg-background text-foreground focus:border-accent cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium focus:outline-hidden"
            >
              <option value="all">
                All Categories
              </option>

              <option value="rightsizing">
                Rightsizing
              </option>

              <option value="idle_cleanup">
                Idle Cleanup
              </option>

              <option value="storage_optimization">
                Storage Optimization
              </option>

              <option value="modernization">
                Modernization
              </option>

              <option value="architectural">
                Architectural
              </option>
            </select>
          </div>

          {/* Export current filtered recommendations */}
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() =>
              exportRecommendationsCsv(filtered)
            }
            className="border-foreground/15 bg-background text-foreground hover:border-accent/50 hover:text-accent inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download
              size={13}
              aria-hidden="true"
            />

            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="border-foreground/15 bg-background text-foreground hover:border-accent/50 hover:text-accent inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={
                isEvaluating
                  ? "text-accent animate-spin"
                  : ""
              }
            />

            <span>
              {isEvaluating
                ? "Analyzing..."
                : "Re-evaluate"}
            </span>
          </button>
        </div>
      </div>

      {/* Recommendation Card List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onStatusChange={handleStatusChange}
              isUpdating={
                updatingId === recommendation.id
              }
            />
          ))}
        </div>
      ) : (
        <div className="border-foreground/15 bg-card/20 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
          <div className="bg-foreground/5 flex h-12 w-12 items-center justify-center rounded-xl">
            <Sparkles
              size={24}
              className="text-accent"
              aria-hidden="true"
            />
          </div>

          <h3 className="text-foreground mt-4 text-sm font-semibold">
            {activeTab === "active" && selectedCategory === "all"
              ? "All clear!"
              : "No recommendations match the filter"}
          </h3>

          <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
            {activeTab === "active" && selectedCategory === "all"
              ? "No optimization opportunities found. Your infrastructure is running efficiently."
              : "Try changing the filters or running a fresh analysis to check for new optimization opportunities."}
          </p>

          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="bg-foreground text-background mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={isEvaluating ? "animate-spin" : ""}
              aria-hidden="true"
            />

            <span>
              {isEvaluating ? "Analyzing..." : "Run Fresh Analysis"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}