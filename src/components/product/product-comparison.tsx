"use client";

import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonRow {
  feature: string;
  costops: string | boolean;
  legacy: string | boolean;
  spreadsheets: string | boolean;
  highlight?: boolean;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "AI & LLM Token Cost Attribution (OpenAI/Anthropic)",
    costops: "Native token & cache tracking",
    legacy: "Not supported / Raw API only",
    spreadsheets: "Impossible manually",
    highlight: true,
  },
  {
    feature: "Setup Time & Agent Overhead",
    costops: "2 minutes (100% Read-only)",
    legacy: "3–6 weeks with heavy agents",
    spreadsheets: "Ongoing manual maintenance",
    highlight: true,
  },
  {
    feature: "Automated Terraform / IaC PR Generation",
    costops: "1-Click GitHub PRs",
    legacy: "Manual PDF reports only",
    spreadsheets: "No automation",
    highlight: true,
  },
  {
    feature: "Real-Time Anomaly Detection (< 60s)",
    costops: true,
    legacy: "Delayed (24–48 hours)",
    spreadsheets: false,
  },
  {
    feature: "Multi-Cloud Normalization (AWS + GCP + Azure)",
    costops: true,
    legacy: true,
    spreadsheets: "Extremely error-prone",
  },
  {
    feature: "Unit Economics (Cost per Tenant / Active User)",
    costops: true,
    legacy: "Complex enterprise add-on",
    spreadsheets: false,
  },
  {
    feature: "Prompt Content Privacy",
    costops: "Zero prompt ingestion",
    legacy: "Varies",
    spreadsheets: "Manual exports",
  },
  {
    feature: "Pricing Model",
    costops: "Transparent flat monthly fee",
    legacy: "Percentage of cloud spend (3–5%)",
    spreadsheets: "Engineer time wasted",
  },
];

export function ProductComparison() {
  return (
    <div className="space-y-12">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-accent font-mono text-xs font-medium tracking-widest uppercase">
          Why Dilanix CostOps
        </span>
        <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Built for modern engineering, not legacy enterprise bloat
        </h2>
        <p className="text-muted-foreground mt-4 text-base">
          Legacy FinOps tools were designed a decade ago before container
          clusters and LLM inference. CostOps is engineered from the ground up
          for modern stacks.
        </p>
      </div>

      <div className="border-foreground/10 bg-card-strong overflow-hidden rounded-2xl border shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-foreground/10 bg-foreground/[0.02] border-b">
                <th className="text-muted-foreground w-1/3 p-4 font-medium sm:p-6">
                  Capability / Feature
                </th>
                <th className="text-accent bg-accent/[0.05] border-accent/20 w-1/4 border-x p-4 font-semibold sm:p-6">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={16} />
                    <span>Dilanix CostOps</span>
                  </div>
                </th>
                <th className="text-foreground/80 w-1/5 p-4 font-medium sm:p-6">
                  Legacy FinOps
                </th>
                <th className="text-muted-foreground w-1/5 p-4 font-medium sm:p-6">
                  Manual Spreadsheets
                </th>
              </tr>
            </thead>
            <tbody className="divide-foreground/5 divide-y">
              {comparisonData.map((row, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    "hover:bg-foreground/[0.02] transition-colors",
                    row.highlight && "bg-foreground/[0.01]",
                  )}
                >
                  <td className="text-foreground p-4 text-xs font-medium sm:p-6 sm:text-sm">
                    {row.feature}
                  </td>

                  {/* CostOps column */}
                  <td className="bg-accent/[0.03] border-accent/15 text-foreground border-x p-4 text-xs font-semibold sm:p-6 sm:text-sm">
                    {typeof row.costops === "boolean" ? (
                      row.costops ? (
                        <span className="text-success flex items-center gap-1.5">
                          <Check size={16} />
                          <span>Included</span>
                        </span>
                      ) : (
                        <X size={16} className="text-muted-foreground" />
                      )
                    ) : (
                      <span className="text-accent">{row.costops}</span>
                    )}
                  </td>

                  {/* Legacy column */}
                  <td className="text-muted-foreground p-4 text-xs sm:p-6 sm:text-sm">
                    {typeof row.legacy === "boolean" ? (
                      row.legacy ? (
                        <Check size={16} className="text-foreground/70" />
                      ) : (
                        <X size={16} className="text-muted-foreground/50" />
                      )
                    ) : (
                      row.legacy
                    )}
                  </td>

                  {/* Spreadsheets column */}
                  <td className="text-muted-foreground p-4 text-xs sm:p-6 sm:text-sm">
                    {typeof row.spreadsheets === "boolean" ? (
                      row.spreadsheets ? (
                        <Check size={16} className="text-foreground/70" />
                      ) : (
                        <X size={16} className="text-muted-foreground/50" />
                      )
                    ) : (
                      row.spreadsheets
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
