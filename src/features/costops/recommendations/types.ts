export type RecommendationCategory =
  | "rightsizing"
  | "idle_cleanup"
  | "storage_optimization"
  | "modernization"
  | "architectural";

export type RecommendationStatus = "active" | "applied" | "dismissed";

export type RecommendationSource = "rule_engine" | "ai_agent" | "hybrid";

export type RecommendationRisk = "low" | "medium" | "high";

export type RecommendationEffort = "low" | "medium" | "high";

export interface ActionPlan {
  action_type?: string;
  cli_command?: string;
  terraform_suggestion?: string;
  [key: string]: unknown;
}

export interface AIAnalysis {
  reasoning?: string;
  risk_level?: string;
  safe_execution_steps?: string[];
  [key: string]: unknown;
}

export interface CostOpsRecommendation {
  id: string;
  organization_id: string;
  integration_id: string;
  resource_id: string | null;
  evidence_snapshot_id: string | null;
  provider: "aws";
  category: RecommendationCategory;
  status: RecommendationStatus;
  source: RecommendationSource;
  risk_level: RecommendationRisk;
  implementation_effort: RecommendationEffort;

  title: string;
  description: string;
  current_configuration: Record<string, unknown>;
  recommended_configuration: Record<string, unknown>;

  estimated_monthly_savings_usd: number;
  estimated_savings_percentage?: number | null;
  currency: string;
  confidence_score: number;

  action_plan: ActionPlan;
  ai_analysis: AIAnalysis;

  dismissed_reason?: string | null;
  applied_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CostOpsRecommendationSummary {
  total_potential_monthly_savings_usd: number;
  active_recommendations_count: number;
  applied_recommendations_count: number;
  dismissed_recommendations_count: number;
  savings_by_category: Record<string, number>;
  counts_by_category: Record<string, number>;
  top_recommendation: CostOpsRecommendation | null;
}
