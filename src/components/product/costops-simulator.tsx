"use client";

import { useState } from "react";
import {
  TrendingDown,
  AlertTriangle,
  Bot,
  Layers,
  CheckCircle2,
  Code2,
  Bell,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "overview" | "ai-llm" | "waste" | "anomalies";

interface RecommendationItem {
  id: string;
  service: string;
  resource: string;
  issue: string;
  monthlySaving: number;
  confidence: "High" | "Medium";
  action: string;
  iacSnippet: string;
}

const mockRecommendations: RecommendationItem[] = [
  {
    id: "rec-1",
    service: "AWS ECS",
    resource: "service/document-analysis-worker",
    issue:
      "Task CPU allocated 4 vCPU, actual 30-day peak CPU utilization is 18.2%",
    monthlySaving: 640,
    confidence: "High",
    action:
      "Downscale task definition cpu from 4096 to 2048 and memory from 8192 to 4096",
    iacSnippet: `# terraform/ecs/document-analysis.tf
resource "aws_ecs_task_definition" "doc_worker" {
  family                   = "doc-worker"
- cpu                      = "4096"
- memory                   = "8192"
+ cpu                      = "2048"  # Optimized by CostOps (Avg CPU: 18.2%)
+ memory                   = "4096"  # Saves $640/mo
}`,
  },
  {
    id: "rec-2",
    service: "OpenAI API",
    resource: "model/gpt-4o-summarizer",
    issue:
      "Static system prompt (4,200 tokens) not anchored at payload prefix; cache hit rate is only 14%",
    monthlySaving: 1120,
    confidence: "High",
    action:
      "Enable prompt caching by moving system context to header and pinning temperature",
    iacSnippet: `// lib/ai/summarizer.ts
- const response = await openai.chat.completions.create({
-   messages: [{ role: "user", content: dynamicContext + systemPrompt }]
+ // CostOps Fix: Anchor static instructions for 50% discount prompt cache
+ const response = await openai.chat.completions.create({
+   messages: [
+     { role: "system", content: STATIC_SYSTEM_PROMPT },
+     { role: "user", content: dynamicUserPayload }
+   ]
  });`,
  },
  {
    id: "rec-3",
    service: "AWS RDS",
    resource: "db/analytics-replica-eu-west-1",
    issue:
      "Multi-AZ read replica has 0 connected clients for > 21 consecutive days",
    monthlySaving: 480,
    confidence: "High",
    action:
      "Terminate stale read replica and redirect queries to primary connection pool",
    iacSnippet: `# terraform/rds.tf
- resource "aws_db_instance" "analytics_replica" {
-   identifier             = "analytics-replica-eu-west"
-   instance_class         = "db.r6g.xlarge"
- }`,
  },
  {
    id: "rec-4",
    service: "AWS EBS",
    resource: "vol-08f12a9bc4 (gp3 800GB)",
    issue: "Unattached volume detached since staging teardown on July 24th",
    monthlySaving: 64,
    confidence: "High",
    action: "Create final snapshot and delete orphaned EBS volume",
    iacSnippet: `# aws cli automated cleanup command
aws ec2 create-snapshot --volume-id vol-08f12a9bc4 --description "Pre-delete backup"
aws ec2 delete-volume --volume-id vol-08f12a9bc4`,
  },
];

export function CostOpsSimulator() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");
  const [selectedRec, setSelectedRec] = useState<RecommendationItem | null>(
    mockRecommendations[0],
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [anomalyResolved, setAnomalyResolved] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="border-foreground/15 bg-card-strong w-full overflow-hidden rounded-2xl border shadow-2xl shadow-black/25">
      {/* Top Header Bar */}
      <div className="border-foreground/10 bg-foreground/[0.02] flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="bg-foreground/15 inline-block h-3 w-3 rounded-full" />
            <span className="bg-foreground/15 inline-block h-3 w-3 rounded-full" />
            <span className="bg-foreground/15 inline-block h-3 w-3 rounded-full" />
          </div>
          <span className="text-foreground/80 pl-2 font-mono text-xs font-medium">
            CostOps Explorer
          </span>
          <span className="bg-success/10 text-success border-success/20 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
            <span className="bg-success h-1.5 w-1.5 animate-pulse rounded-full" />
            Live Ingestion Active
          </span>
        </div>

        {/* Timeframe selector */}
        <div className="border-foreground/10 bg-background flex items-center gap-1 rounded-lg border p-0.5 text-xs">
          {(["7d", "30d", "90d"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={cn(
                "rounded px-2.5 py-1 font-mono transition-colors",
                timeframe === t
                  ? "bg-foreground/10 text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-foreground/10 bg-foreground/[0.01] flex overflow-x-auto border-b text-xs font-medium sm:text-sm">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 whitespace-nowrap transition-colors sm:px-6",
            activeTab === "overview"
              ? "border-accent text-accent bg-accent/[0.03] font-semibold"
              : "text-muted-foreground hover:text-foreground border-transparent",
          )}
        >
          <Layers size={16} />
          Multi-Cloud Spend
        </button>

        <button
          onClick={() => setActiveTab("ai-llm")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 whitespace-nowrap transition-colors sm:px-6",
            activeTab === "ai-llm"
              ? "border-accent text-accent bg-accent/[0.03] font-semibold"
              : "text-muted-foreground hover:text-foreground border-transparent",
          )}
        >
          <Bot size={16} />
          AI & LLM Token Ops
          <span className="bg-accent/15 py-0.2 text-accent rounded-full px-1.5 font-mono text-[10px]">
            New
          </span>
        </button>

        <button
          onClick={() => setActiveTab("waste")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 whitespace-nowrap transition-colors sm:px-6",
            activeTab === "waste"
              ? "border-accent text-accent bg-accent/[0.03] font-semibold"
              : "text-muted-foreground hover:text-foreground border-transparent",
          )}
        >
          <TrendingDown size={16} />
          Waste Buster
          <span className="bg-success/15 py-0.2 text-success rounded-full px-1.5 font-mono text-[10px]">
            -$2,304/mo
          </span>
        </button>

        <button
          onClick={() => setActiveTab("anomalies")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 whitespace-nowrap transition-colors sm:px-6",
            activeTab === "anomalies"
              ? "border-accent text-accent bg-accent/[0.03] font-semibold"
              : "text-muted-foreground hover:text-foreground border-transparent",
          )}
        >
          <AlertTriangle size={16} />
          Anomaly Radar
          {!anomalyResolved && (
            <span className="py-0.2 rounded-full bg-amber-500/20 px-1.5 font-mono text-[10px] text-amber-500">
              1 Alert
            </span>
          )}
        </button>
      </div>

      {/* Main Tab Panels */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* TAB 1: Multi-Cloud Spend Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="border-foreground/10 bg-foreground/[0.02] rounded-xl border p-4">
                <p className="text-muted-foreground text-xs">
                  Total Analyzed Spend
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-foreground font-mono text-2xl font-bold sm:text-3xl">
                    $24,821
                  </span>
                  <span className="text-success flex items-center font-mono text-xs">
                    ↓ 5.7% vs last mo
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  AWS + GCP + OpenAI + Azure
                </p>
              </div>

              <div className="border-accent/20 bg-accent/[0.04] rounded-xl border p-4">
                <p className="text-accent text-xs font-medium">
                  Identified Monthly Waste
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-accent font-mono text-2xl font-bold sm:text-3xl">
                    $4,310
                  </span>
                  <span className="bg-accent/20 text-accent rounded px-1.5 py-0.5 font-mono text-[10px]">
                    17.4% reducible
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  12 ready-to-execute right-sizes
                </p>
              </div>

              <div className="border-foreground/10 bg-foreground/[0.02] rounded-xl border p-4">
                <p className="text-muted-foreground text-xs">
                  Infrastructure Efficiency Score
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-success font-mono text-2xl font-bold sm:text-3xl">
                    88 / 100
                  </span>
                  <span className="text-muted-foreground text-xs">Good</span>
                </div>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  Top 15% in industry benchmark
                </p>
              </div>
            </div>

            {/* Provider Breakdown & Cost Bars */}
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="border-foreground/10 bg-background/50 space-y-3 rounded-xl border p-5 lg:col-span-7">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
                    Spend Distribution by Provider
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    100% Real-time sync
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-foreground flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Amazon Web Services (AWS)
                      </span>
                      <span className="text-foreground font-mono font-semibold">
                        $14,240 (57.4%)
                      </span>
                    </div>
                    <div className="bg-foreground/10 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: "57.4%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-foreground flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        OpenAI API & Batch Endpoints
                      </span>
                      <span className="text-foreground font-mono font-semibold">
                        $5,280 (21.3%)
                      </span>
                    </div>
                    <div className="bg-foreground/10 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: "21.3%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-foreground flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Google Cloud (Vertex AI & BigQuery)
                      </span>
                      <span className="text-foreground font-mono font-semibold">
                        $3,710 (14.9%)
                      </span>
                    </div>
                    <div className="bg-foreground/10 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: "14.9%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-foreground flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-purple-500" />
                        Anthropic & Other Clouds
                      </span>
                      <span className="text-foreground font-mono font-semibold">
                        $1,591 (6.4%)
                      </span>
                    </div>
                    <div className="bg-foreground/10 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: "6.4%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Unit Breakdown */}
              <div className="border-foreground/10 bg-background/50 flex flex-col justify-between rounded-xl border p-5 lg:col-span-5">
                <div>
                  <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
                    Top Cost Centers
                  </span>
                  <div className="mt-3 space-y-2.5">
                    {[
                      {
                        service: "EC2 & EKS Compute",
                        amount: "$8,420",
                        trend: "+2.1%",
                      },
                      {
                        service: "OpenAI GPT-4o Invocations",
                        amount: "$4,120",
                        trend: "-11.4%",
                      },
                      {
                        service: "Aurora RDS PostgreSQL",
                        amount: "$3,410",
                        trend: "0.0%",
                      },
                      {
                        service: "Vertex Gemini 1.5 Pro",
                        amount: "$1,820",
                        trend: "+8.3%",
                      },
                      {
                        service: "S3 & CloudFront Egress",
                        amount: "$1,120",
                        trend: "-3.2%",
                      },
                    ].map((item) => (
                      <div
                        key={item.service}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-muted-foreground max-w-[180px] truncate">
                          {item.service}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-mono font-medium">
                            {item.amount}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-[10px]",
                              item.trend.startsWith("-")
                                ? "text-success"
                                : "text-amber-500",
                            )}
                          >
                            {item.trend}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-accent/10 border-accent/20 mt-4 flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-accent shrink-0" />
                    <span className="text-foreground text-xs font-medium">
                      Auto-tagging coverage
                    </span>
                  </div>
                  <span className="text-accent font-mono text-xs font-semibold">
                    97.8% tagged
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI & LLM Token Ops */}
        {activeTab === "ai-llm" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="border-foreground/10 bg-foreground/[0.02] rounded-xl border p-4">
                <p className="text-muted-foreground text-xs">
                  Total Tokens (30d)
                </p>
                <p className="text-foreground mt-1 font-mono text-2xl font-bold">
                  148.2M
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  82M input • 66.2M output
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Prompt Cache Hit Rate
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  84.2%
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Saved $2,180 in redundant input
                </p>
              </div>

              <div className="border-foreground/10 bg-foreground/[0.02] rounded-xl border p-4">
                <p className="text-muted-foreground text-xs">
                  Blended Cost / 1k Queries
                </p>
                <p className="text-foreground mt-1 font-mono text-2xl font-bold">
                  $4.18
                </p>
                <p className="text-success mt-0.5 text-[11px]">
                  ↓ 28% after semantic routing
                </p>
              </div>

              <div className="border-foreground/10 bg-foreground/[0.02] rounded-xl border p-4">
                <p className="text-muted-foreground text-xs">Avg Latency p95</p>
                <p className="text-foreground mt-1 font-mono text-2xl font-bold">
                  420ms
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Streaming TTFT: 140ms
                </p>
              </div>
            </div>

            {/* Model Breakdown Table */}
            <div className="border-foreground/10 bg-background/50 overflow-hidden rounded-xl border">
              <div className="border-foreground/10 bg-foreground/[0.02] flex items-center justify-between border-b px-4 py-3">
                <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
                  Model Inventory & Unit Cost Attribution
                </span>
                <span className="text-accent text-xs font-medium">
                  Tenant tagging: 100% active
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-foreground/10 bg-foreground/[0.01] text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">
                        Model / Provider
                      </th>
                      <th className="px-4 py-2.5 font-medium">Workload</th>
                      <th className="px-4 py-2.5 font-medium">Tokens / Mo</th>
                      <th className="px-4 py-2.5 font-medium">Cache Rate</th>
                      <th className="px-4 py-2.5 font-medium">Monthly Cost</th>
                      <th className="px-4 py-2.5 font-medium">Optimization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-foreground/5 divide-y font-mono">
                    <tr className="hover:bg-foreground/[0.02]">
                      <td className="text-foreground px-4 py-3 font-sans font-medium">
                        gpt-4o{" "}
                        <span className="text-muted-foreground text-[10px]">
                          (OpenAI)
                        </span>
                      </td>
                      <td className="text-muted-foreground px-4 py-3 font-sans">
                        Complex Document Synthesis
                      </td>
                      <td className="text-foreground px-4 py-3">58.4M</td>
                      <td className="px-4 py-3 font-semibold text-emerald-500">
                        89.1%
                      </td>
                      <td className="text-foreground px-4 py-3 font-semibold">
                        $2,840
                      </td>
                      <td className="text-success px-4 py-3 font-sans">
                        Optimized
                      </td>
                    </tr>
                    <tr className="hover:bg-foreground/[0.02]">
                      <td className="text-foreground px-4 py-3 font-sans font-medium">
                        claude-3-5-sonnet{" "}
                        <span className="text-muted-foreground text-[10px]">
                          (Anthropic)
                        </span>
                      </td>
                      <td className="text-muted-foreground px-4 py-3 font-sans">
                        Code Generation & SQL Gen
                      </td>
                      <td className="text-foreground px-4 py-3">36.1M</td>
                      <td className="px-4 py-3 font-semibold text-emerald-500">
                        81.4%
                      </td>
                      <td className="text-foreground px-4 py-3 font-semibold">
                        $1,420
                      </td>
                      <td className="text-success px-4 py-3 font-sans">
                        Optimized
                      </td>
                    </tr>
                    <tr className="hover:bg-foreground/[0.02]">
                      <td className="text-foreground px-4 py-3 font-sans font-medium">
                        gemini-1.5-flash{" "}
                        <span className="text-muted-foreground text-[10px]">
                          (Google)
                        </span>
                      </td>
                      <td className="text-muted-foreground px-4 py-3 font-sans">
                        Entity & Sentiment Extraction
                      </td>
                      <td className="text-foreground px-4 py-3">42.8M</td>
                      <td className="text-muted-foreground px-4 py-3">N/A</td>
                      <td className="text-foreground px-4 py-3 font-semibold">
                        $420
                      </td>
                      <td className="text-accent px-4 py-3 font-sans">
                        High efficiency tier
                      </td>
                    </tr>
                    <tr className="hover:bg-foreground/[0.02]">
                      <td className="text-foreground px-4 py-3 font-sans font-medium">
                        text-embedding-3-small{" "}
                        <span className="text-muted-foreground text-[10px]">
                          (OpenAI)
                        </span>
                      </td>
                      <td className="text-muted-foreground px-4 py-3 font-sans">
                        Vector RAG Ingestion
                      </td>
                      <td className="text-foreground px-4 py-3">10.9M</td>
                      <td className="text-muted-foreground px-4 py-3">N/A</td>
                      <td className="text-foreground px-4 py-3 font-semibold">
                        $60
                      </td>
                      <td className="text-muted-foreground px-4 py-3 font-sans">
                        Normal
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Waste Buster & IaC Recommendations */}
        {activeTab === "waste" && (
          <div className="space-y-6">
            <div className="bg-success/10 border-success/20 flex flex-col items-start justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
              <div>
                <span className="text-success font-mono text-xs font-semibold tracking-wider uppercase">
                  Total Active Savings Identified
                </span>
                <p className="text-foreground font-mono text-lg font-bold">
                  $2,304/month ($27,648/year) with 4 non-breaking fixes
                </p>
              </div>
              <span className="text-muted-foreground font-sans text-xs">
                All recommendations verified with 0 downtime impact
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* List of recommendations */}
              <div className="space-y-3 lg:col-span-6">
                {mockRecommendations.map((rec) => {
                  const isSelected = selectedRec?.id === rec.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRec(rec)}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 transition-all duration-200",
                        isSelected
                          ? "border-accent bg-accent/[0.06] shadow-sm"
                          : "border-foreground/10 bg-background/50 hover:border-foreground/20",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-foreground/10 text-foreground rounded px-2 py-0.5 font-mono text-[11px] font-medium">
                            {rec.service}
                          </span>
                          <span className="text-muted-foreground max-w-[160px] truncate font-mono text-[11px]">
                            {rec.resource}
                          </span>
                        </div>
                        <span className="text-success shrink-0 font-mono text-sm font-bold">
                          +${rec.monthlySaving}/mo
                        </span>
                      </div>
                      <p className="text-foreground/90 mt-2 text-xs leading-relaxed font-medium">
                        {rec.issue}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-success" />
                          Confidence: {rec.confidence}
                        </span>
                        <span className="text-accent flex items-center gap-1 font-medium">
                          View Terraform Diff
                          <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* IaC Diff Code Inspector */}
              <div className="border-foreground/15 bg-background flex flex-col justify-between overflow-hidden rounded-xl border lg:col-span-6">
                <div>
                  <div className="border-foreground/10 bg-foreground/[0.03] flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Code2 size={15} className="text-accent" />
                      <span className="text-foreground font-mono text-xs font-medium">
                        Ready-to-Merge IaC Pull Request
                      </span>
                    </div>
                    {selectedRec && (
                      <button
                        onClick={() => handleCopy(selectedRec.iacSnippet)}
                        className="bg-foreground/10 text-foreground hover:bg-foreground/20 inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[11px] transition-colors"
                      >
                        {copiedCode ? (
                          <Check size={12} className="text-success" />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedCode ? "Copied" : "Copy Diff"}
                      </button>
                    )}
                  </div>

                  <div className="p-4">
                    {selectedRec ? (
                      <div>
                        <p className="text-muted-foreground mb-3 text-xs">
                          <span className="text-foreground font-medium">
                            Action:{" "}
                          </span>
                          {selectedRec.action}
                        </p>
                        <pre className="bg-foreground/[0.03] text-foreground border-foreground/5 overflow-x-auto rounded-lg border p-3 font-mono text-[11px] leading-relaxed">
                          <code>{selectedRec.iacSnippet}</code>
                        </pre>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        Select a recommendation to inspect code
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-foreground/10 bg-foreground/[0.01] flex items-center justify-between border-t p-4">
                  <span className="text-muted-foreground text-xs">
                    1-Click GitHub PR integration available
                  </span>
                  <span className="text-success font-mono text-xs font-semibold">
                    Save ${selectedRec?.monthlySaving}/mo
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Anomaly Radar */}
        {activeTab === "anomalies" && (
          <div className="space-y-6">
            {!anomalyResolved ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
                      <AlertTriangle size={18} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-sm font-semibold">
                          Unusual Spend Spike Detected
                        </span>
                        <span className="py-0.2 rounded bg-amber-500/20 px-1.5 font-mono text-[10px] font-bold text-amber-600 uppercase dark:text-amber-400">
                          +420% Baseline
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Service:{" "}
                        <span className="text-foreground font-mono">
                          OpenAI API (gpt-4o)
                        </span>{" "}
                        • Triggered by:{" "}
                        <span className="text-foreground font-mono">
                          worker-node-batch-04
                        </span>{" "}
                        in staging namespace
                      </p>
                      <p className="text-foreground/80 bg-background/60 border-foreground/10 mt-2 rounded border p-2.5 font-mono text-xs">
                        Root cause: A retry loop without exponential backoff
                        generated 1.2M unexpected completion tokens in 14
                        minutes.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setAnomalyResolved(true)}
                    className="shrink-0 cursor-pointer rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-amber-400"
                  >
                    Apply Rate-Limit Guardrail
                  </button>
                </div>

                {/* Slack Simulation */}
                <div className="bg-background border-foreground/10 mt-4 flex items-center justify-between rounded-lg border p-3.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Bell size={15} className="text-accent" />
                    <span className="text-muted-foreground">
                      Slack alert dispatched to{" "}
                      <span className="text-foreground font-mono">
                        #finops-alerts
                      </span>{" "}
                      4 minutes ago
                    </span>
                  </div>
                  <span className="text-success font-mono text-[11px]">
                    Webhook ACK 200 OK
                  </span>
                </div>
              </div>
            ) : (
              <div className="border-success/30 bg-success/[0.05] rounded-xl border p-6 text-center">
                <div className="bg-success/20 text-success mx-auto flex h-10 w-10 items-center justify-center rounded-full">
                  <CheckCircle2 size={20} />
                </div>
                <h4 className="text-foreground mt-3 text-base font-semibold">
                  Anomaly Guardrail Active & Spend Contained
                </h4>
                <p className="text-muted-foreground mx-auto mt-1 max-w-md text-xs">
                  Rate limits applied to staging worker node. Token consumption
                  returned to normal baseline ($0.12/hr). Potential $1,400
                  overage prevented.
                </p>
                <button
                  onClick={() => setAnomalyResolved(false)}
                  className="text-accent mt-4 cursor-pointer text-xs hover:underline"
                >
                  Reset simulation
                </button>
              </div>
            )}

            {/* Historical Anomaly Log */}
            <div className="border-foreground/10 bg-background/50 rounded-xl border p-5">
              <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
                Historical Anomaly Log (Trailing 90 Days)
              </span>
              <div className="mt-3 space-y-3">
                {[
                  {
                    date: "Aug 12, 2026",
                    title: "AWS CloudWatch Logs ingestion spike (+180GB/day)",
                    status: "Resolved in 6 min",
                    prevented: "$820",
                  },
                  {
                    date: "Jul 28, 2026",
                    title: "Orphaned GCP BigQuery sandbox cluster query scan",
                    status: "Resolved in 12 min",
                    prevented: "$450",
                  },
                  {
                    date: "Jul 11, 2026",
                    title:
                      "Anthropic Claude 3.5 Sonnet un-cached system prompt",
                    status: "Resolved in 4 min",
                    prevented: "$980",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="border-foreground/5 flex items-center justify-between border-b py-2 text-xs last:border-b-0"
                  >
                    <div>
                      <p className="text-foreground font-medium">
                        {item.title}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        {item.date} • {item.status}
                      </p>
                    </div>
                    <span className="text-success font-mono text-xs font-semibold">
                      Prevented {item.prevented}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar info */}
      <div className="border-foreground/10 bg-foreground/[0.02] text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs sm:px-6">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-success" />
          Zero-Agent, 100% Read-Only Architecture
        </span>
        <span className="font-mono text-[11px]">
          Multi-Cloud Engine v2.4 • SOC 2 Ready
        </span>
      </div>
    </div>
  );
}
