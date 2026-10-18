"use client";

import { useState } from "react";
import {
  Activity,
  BarChart3,
  Cloud,
  Database,
  DollarSign,
  Lightbulb,
  Network,
  RefreshCw,
  Server,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FlowNode {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
}

interface FlowColumn {
  title: string;
  nodes: FlowNode[];
}

/**
 * Columns of nodes joined by animated connectors: data visibly moves from left
 * to right. Hovering (or tapping) a node shows what it does.
 */
function AnimatedFlow({
  columns,
  label,
}: {
  columns: FlowColumn[];
  label: string;
}) {
  const [selected, setSelected] = useState<FlowNode | null>(
    columns[0]?.nodes[0] ?? null,
  );
  return (
    <figure
      aria-label={label}
      className="border-border-soft bg-dashboard-panel @container relative overflow-hidden rounded-3xl border p-4 shadow-[0_24px_60px_var(--shadow-card)] sm:p-6"
    >
      <div className="flex flex-col items-stretch gap-3 @2xl:flex-row @2xl:items-center @2xl:gap-0">
        {columns.map((column, columnIndex) => (
          <div
            key={column.title}
            className="flex min-w-0 flex-col items-stretch @2xl:flex-1 @2xl:flex-row @2xl:items-center"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-muted-foreground text-center text-[10px] font-semibold tracking-[0.16em] uppercase">
                {column.title}
              </p>
              <div className="flex flex-wrap justify-center gap-2 @2xl:flex-col @2xl:flex-nowrap">
                {column.nodes.map((node) => {
                  const Icon = node.icon;
                  const active = selected?.id === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onMouseEnter={() => setSelected(node)}
                      onFocus={() => setSelected(node)}
                      onClick={() => setSelected(node)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all duration-300",
                        active
                          ? "border-accent/60 bg-accent/10 text-foreground shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_10%,transparent)]"
                          : "border-border-soft bg-background/60 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon
                        size={14}
                        className={cn("shrink-0", active ? "text-accent" : "")}
                        aria-hidden
                      />
                      {node.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {columnIndex < columns.length - 1 ? (
              <div
                aria-hidden
                className="relative mx-auto my-1 h-8 w-px shrink-0 @2xl:mx-2 @2xl:my-0 @2xl:h-px @2xl:w-8"
              >
                <span className="bg-accent/25 absolute inset-0" />
                <span
                  className="bg-accent absolute top-0 left-0 size-1.5 -translate-y-[2px] [animation:docs-flow-x_1.6s_linear_infinite] rounded-full shadow-[0_0_10px_var(--accent)] @max-2xl:[animation:docs-flow-y_1.6s_linear_infinite]"
                  style={{ animationDelay: `${columnIndex * 0.25}s` }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {selected ? (
        <figcaption
          key={selected.id}
          className="border-border-soft bg-background/60 animate-toast-in mt-5 rounded-2xl border p-4 text-sm leading-6"
        >
          <span className="text-foreground font-semibold">
            {selected.label}
          </span>
          <span className="text-muted-foreground"> — {selected.detail}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}

export function PlatformFlow() {
  return (
    <AnimatedFlow
      label="How data flows through Dilanix"
      columns={[
        {
          title: "Your cloud",
          nodes: [
            {
              id: "aws",
              label: "AWS accounts",
              icon: Cloud,
              detail:
                "Dilanix reads through a read-only IAM role you create with CloudFormation. It never writes to your account.",
            },
          ],
        },
        {
          title: "Collection",
          nodes: [
            {
              id: "sync",
              label: "Sync",
              icon: RefreshCw,
              detail:
                "Every dataset refreshes on its own schedule, or right away with Sync now. Progress and health are on the Sync page.",
            },
          ],
        },
        {
          title: "Datasets",
          nodes: [
            {
              id: "inventory",
              label: "Inventory",
              icon: Server,
              detail:
                "Every resource in the account, with its configuration, tags, and size.",
            },
            {
              id: "billing",
              label: "Billing",
              icon: Database,
              detail:
                "Daily cost totals (Cost Explorer) and the detailed line-by-line bill (FOCUS export).",
            },
            {
              id: "metrics",
              label: "Metrics",
              icon: BarChart3,
              detail:
                "CPU, memory, network, and connections from CloudWatch — how busy each resource really is.",
            },
            {
              id: "interactions",
              label: "Interactions",
              icon: Activity,
              detail:
                "Which resources talk to each other, from configuration, IAM, flow logs, and traces.",
            },
          ],
        },
        {
          title: "Products",
          nodes: [
            {
              id: "cost",
              label: "Cost",
              icon: DollarSign,
              detail:
                "Spend, trends, budgets, allocations, anomalies, and reports.",
            },
            {
              id: "recommendations",
              label: "Recommendations",
              icon: Lightbulb,
              detail:
                "Safe, reviewed ways to pay less, each with step-by-step How to fix instructions.",
            },
            {
              id: "infrastructure",
              label: "Infrastructure",
              icon: Network,
              detail:
                "A live graph of your resources and the evidence behind every connection.",
            },
          ],
        },
      ]}
    />
  );
}

export function TelemetryFlow() {
  return (
    <AnimatedFlow
      label="How telemetry reaches Dilanix"
      columns={[
        {
          title: "Your service",
          nodes: [
            {
              id: "app",
              label: "Application",
              icon: Server,
              detail:
                "Your code (or a log shipper) batches log entries — up to 1,000 per request.",
            },
          ],
        },
        {
          title: "Authentication",
          nodes: [
            {
              id: "token",
              label: "Ingestion token",
              icon: ShieldCheck,
              detail:
                "A source-scoped bearer token. It decides the organization, application, environment, and source — nothing in the payload can change that.",
            },
          ],
        },
        {
          title: "Ingestion",
          nodes: [
            {
              id: "endpoint",
              label: "POST /v1/telemetry/logs",
              icon: Send,
              detail:
                "Validates the batch, redacts secret-looking attributes, and answers 202 with how many entries were accepted.",
            },
          ],
        },
        {
          title: "Dilanix",
          nodes: [
            {
              id: "env",
              label: "Telemetry store",
              icon: Activity,
              detail:
                "Accepted logs are stored for the environment, and the source's “last received” time updates — your sign that ingestion works.",
            },
          ],
        },
      ]}
    />
  );
}
